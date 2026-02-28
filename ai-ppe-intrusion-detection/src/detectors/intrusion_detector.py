import numpy as np
from src.detectors.ppe_detector import PPEDetector


class IntrusionDetector:
    """
    Combines person detection + PPE detection to classify each detected
    person as a Worker (compliant) or Intruder (non-compliant).

    Classification rules (configurable):
        Worker   → helmet AND vest detected near the person
        Intruder → one or both PPE items missing
    """

    WORKER   = 'Worker'
    INTRUDER = 'Intruder'

    def __init__(self, ppe_detector: PPEDetector,
                 require_helmet: bool = True,
                 require_vest: bool = True):
        """
        Args:
            ppe_detector:   An initialized PPEDetector instance.
            require_helmet: If True, helmet is required to be a Worker.
            require_vest:   If True, vest is required to be a Worker.
        """
        self.ppe_detector   = ppe_detector
        self.require_helmet = require_helmet
        self.require_vest   = require_vest

    # ------------------------------------------------------------------
    def process_frame(self, frame: np.ndarray) -> list[dict]:
        """
        Full pipeline: detect persons (pretrained YOLO) + PPE (custom model),
        then classify each person as Worker or Intruder.

        Args:
            frame: BGR numpy array (from OpenCV).

        Returns:
            List of result dicts, one per detected person:
            {
                'person':      detection dict (bbox, confidence),
                'ppe':         {'helmet': bool, 'vest': bool, 'boots': bool, ...},
                'label':       'Worker' | 'Intruder',
                'missing_ppe': list of missing items e.g. ['Helmet']
            }
        """
        # Step 1: Detect persons using pretrained COCO model (high recall)
        persons    = self.ppe_detector.detect_persons(frame)
        # Step 2: Run custom PPE model for helmets, vests, and Person class 4
        detections = self.ppe_detector.detect(frame)
        ppe_items  = self.ppe_detector.get_ppe(detections)
        # Custom model's own Person detections — used to cross-validate + supplement
        custom_persons = self.ppe_detector.get_persons(detections)

        # Merge: add any custom-model Person detections not already covered by COCO
        # (catches people the COCO model missed entirely)
        for cp in custom_persons:
            already_covered = any(
                self._bbox_iou(cp['bbox'], p['bbox']) >= 0.30 for p in persons
            )
            if not already_covered:
                persons.append(cp)

        results = []
        for person in persons:
            # Step 3: Cross-validate to filter false COCO detections (machinery,
            # signage, etc.).
            # High-confidence COCO detections (≥ 0.35) are trusted directly.
            # Low-confidence ones (0.10–0.35) must be confirmed by the custom
            # model (Person class 4 or a PPE item overlapping the bbox).
            coco_conf = person.get('confidence', 0.0)
            if coco_conf < 0.35:
                confirmed = self._is_person_confirmed(person['bbox'], custom_persons, ppe_items)
                if not confirmed:
                    continue  # low-confidence and unconfirmed — drop it
            ppe_status = self.ppe_detector.check_ppe_for_person(
                person, ppe_items, frame=frame
            )
            label, missing = self._classify(ppe_status)
            results.append({
                'person':      person,
                'ppe':         ppe_status,
                'label':       label,
                'missing_ppe': missing
            })
        return results

    def _bbox_iou(self, a: list, b: list) -> float:
        """Compute IoU between two [x1,y1,x2,y2] boxes."""
        ix1 = max(a[0], b[0]); iy1 = max(a[1], b[1])
        ix2 = min(a[2], b[2]); iy2 = min(a[3], b[3])
        inter = max(0, ix2 - ix1) * max(0, iy2 - iy1)
        if inter == 0:
            return 0.0
        area_a = (a[2]-a[0]) * (a[3]-a[1])
        area_b = (b[2]-b[0]) * (b[3]-b[1])
        return inter / (area_a + area_b - inter)

    # ------------------------------------------------------------------
    def _is_person_confirmed(self, bbox: list, custom_persons: list,
                              ppe_items: list, min_overlap: float = 0.15) -> bool:
        """
        Cross-validate a COCO person detection against the custom model.
        Expands the bbox 20% downward to catch vests that fall just below
        the COCO person boundary.

        Returns True if:
          - The custom model also detects a Person (class 4) overlapping ≥ 15%, OR
          - At least one PPE item (helmet/vest) overlaps ≥ 15% of the expanded bbox.
        """
        px1, py1, px2, py2 = bbox
        # Expand bbox downward by 20% of the person height to catch low vests
        expand = int((py2 - py1) * 0.20)
        py2_exp = py2 + expand
        p_area = max(1, (px2 - px1) * (py2_exp - py1))

        for candidate in custom_persons + ppe_items:
            cx1, cy1, cx2, cy2 = candidate['bbox']
            ix = max(0, min(px2, cx2) - max(px1, cx1))
            iy = max(0, min(py2_exp, cy2) - max(py1, cy1))
            if ix * iy / p_area >= min_overlap:
                return True
        return False

    # ------------------------------------------------------------------
    def _classify(self, ppe_status: dict) -> tuple[str, list[str]]:
        """
        Classify a person based on PPE status.
        Worker = wearing AT LEAST ONE of helmet / vest.
        Intruder = wearing neither.

        Returns:
            (label, missing_items)  — missing lists items they should have
        """
        has_helmet = ppe_status.get('helmet', False)
        has_vest   = ppe_status.get('vest',   False)

        missing = []
        if not has_helmet:
            missing.append('Helmet')
        if not has_vest:
            missing.append('Vest')

        # Worker if they have at least one PPE item
        label = self.WORKER if (has_helmet or has_vest) else self.INTRUDER
        return label, missing

    # ------------------------------------------------------------------
    def classify(self, detections: list[dict]) -> list[tuple]:
        """
        Legacy-compatible method: classify a pre-computed list of
        person detections (no frame needed).

        Args:
            detections: list of person detection dicts with 'ppe' key,
                        OR plain person dicts (will default to Intruder).
        Returns:
            list of (detection, label) tuples.
        """
        results = []
        for det in detections:
            ppe_status = det.get('ppe', {'helmet': False, 'vest': False})
            label, _   = self._classify(ppe_status)
            results.append((det, label))
        return results
