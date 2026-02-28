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
        # Use dedicated person model for person detection
        persons   = self.ppe_detector.detect_persons(frame)
        # Use custom PPE model for PPE detection
        detections = self.ppe_detector.detect(frame)
        ppe_items  = self.ppe_detector.get_ppe(detections)

        results = []
        for person in persons:
            ppe_status = self.ppe_detector.check_ppe_for_person(
                person, ppe_items, frame=frame  # pass frame for HSV colour fallback
            )
            label, missing = self._classify(ppe_status)
            results.append({
                'person':      person,
                'ppe':         ppe_status,
                'label':       label,
                'missing_ppe': missing
            })
        return results

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
