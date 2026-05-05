import cv2
import numpy as np
from ultralytics import YOLO


class PPEDetector:
    """
    Detects persons, helmets, and safety vests using a YOLOv8 model
    trained on the construction PPE dataset.

    Class IDs (from data.yaml):
        0 = Helmet
        1 = Person
        2 = Vest
        3 = objects
    """

    # Class IDs from updated data.yaml (6 classes)
    # 0=Boots, 1=Gloves, 2=Goggles, 3=Helmet, 4=Person, 5=Vest
    CLASS_NAMES = {0: 'Boots', 1: 'Gloves', 2: 'Goggles', 3: 'Helmet', 4: 'Person', 5: 'Vest'}
    PERSON_ID   = 4
    HELMET_ID   = 3
    VEST_ID     = 5
    BOOTS_ID    = 0
    GLOVES_ID   = 1
    GOGGLES_ID  = 2
    COCO_PERSON_ID = 0  # class 0 = 'person' in COCO pretrained models

    def __init__(self, weights: str = 'yolo11n.pt',
                 person_weights: str = 'yolo11n.pt',
                 conf_threshold: float = 0.35,
                 person_conf: float = 0.10,
                 nms_threshold: float = 0.45,
                 device: str = 'cpu',
                 image_size: int = 640):
        """
        Args:
            weights:        Path to custom PPE .pt weights file.
            person_weights: Pretrained YOLO weights for person detection (COCO).
                            Use a larger model (e.g. yolo11l.pt) for better recall.
            conf_threshold: Minimum confidence for PPE detections.
            person_conf:    Lower confidence threshold for person detection
                            (higher recall — don't miss workers).
            nms_threshold:  IoU threshold for Non-Maximum Suppression.
            device:         'cpu' or 'cuda'.
            image_size:     Inference image size.
        """
        # Core inference settings.
        self.conf        = conf_threshold
        self.person_conf = person_conf
        self.iou         = nms_threshold
        self.device      = device
        self.imgsz       = image_size
        # Main PPE detection model.
        self.model       = YOLO(weights)
        # Use a separate pretrained COCO model for robust person detection.
        if person_weights == weights:
            self.person_model    = self.model
            self.use_coco_person = False
        else:
            self.person_model    = YOLO(person_weights)
            self.use_coco_person = True

    # ------------------------------------------------------------------
    def detect(self, frame: np.ndarray) -> list[dict]:
        """
        Run inference on a single BGR frame (numpy array).

        Returns:
            List of dicts, one per detection:
            {
                'bbox':       [x1, y1, x2, y2]  (int pixels),
                'class_id':   int,
                'class_name': str,
                'confidence': float
            }
        """
        # PPE model inference.
        results = self.model.predict(
            source=frame,
            conf=self.conf,
            iou=self.iou,
            device=self.device,
            imgsz=self.imgsz,
            verbose=False
        )

        # Normalize model output to a list of dicts.
        detections = []
        for r in results:
            for box in r.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                cls_id  = int(box.cls[0])
                conf    = float(box.conf[0])
                cls_name = self.CLASS_NAMES.get(cls_id, str(cls_id))
                detections.append({
                    'bbox':       [x1, y1, x2, y2],
                    'class_id':   cls_id,
                    'class_name': cls_name,
                    'confidence': round(conf, 3)
                })
        return detections

    # ------------------------------------------------------------------
    def detect_persons(self, frame: np.ndarray) -> list[dict]:
        """
        Detect persons using the dedicated person model.
        Uses a lower confidence threshold for maximum recall.
        When using COCO pretrained model, restricts to class 0 (person) only.
        """
        # Person model inference with lower confidence for higher recall.
        predict_kwargs = dict(
            source=frame,
            conf=self.person_conf,  # lower threshold — catch more people
            iou=self.iou,
            device=self.device,
            imgsz=self.imgsz,
            verbose=False,
        )
        if self.use_coco_person:
            # Only detect class 0 (person) — faster and avoids false positives
            predict_kwargs['classes'] = [self.COCO_PERSON_ID]

        results = self.person_model.predict(**predict_kwargs)
        persons = []
        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                if (self.use_coco_person and cls_id == self.COCO_PERSON_ID) or \
                   (not self.use_coco_person and cls_id == self.PERSON_ID):
                    x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                    persons.append({
                        'bbox':       [x1, y1, x2, y2],
                        'class_id':   self.PERSON_ID,
                        'class_name': 'Person',
                        'confidence': round(float(box.conf[0]), 3)
                    })
        return persons

    # ------------------------------------------------------------------
    def get_persons(self, detections: list[dict]) -> list[dict]:
        """Filter detections to Person class only."""
        return [d for d in detections if d['class_id'] == self.PERSON_ID]

    def get_ppe(self, detections: list[dict]) -> list[dict]:
        """Filter detections to Helmet and Vest classes only."""
        return [d for d in detections if d['class_id'] in (self.HELMET_ID, self.VEST_ID)]

    # ------------------------------------------------------------------
    # HSV ranges for high-visibility vest colours (OpenCV H: 0-180)
    # Each entry: (H_low, H_high, S_min, S_max, V_min, V_max)
    VEST_HSV_RANGES = [
        (15,  35, 120, 255,  80, 255),   # Yellow  (hi-vis yellow)
        ( 5,  15, 150, 255,  80, 255),   # Orange  (hi-vis orange)
        (35,  80,  80, 255,  80, 255),   # Lime / fluorescent green
    ]
    VEST_COLOR_MIN_RATIO = 0.06   # ≥6 % of torso pixels must match

    # HSV ranges for hard hat colours (OpenCV H: 0-180)
    HELMET_HSV_RANGES = [
        (15,  38,  70, 255,  80, 255),   # Yellow hard hat
        ( 5,  18,  80, 255,  80, 255),   # Orange hard hat
        (  0,   8, 100, 255,  80, 255),  # Red hard hat (low hue)
        (165, 180, 100, 255,  80, 255),  # Red hard hat (high hue wrap)
        (100, 130,  80, 255,  80, 255),  # Blue hard hat
        (  0, 180,   0,  50, 190, 255),  # White hard hat (low sat, high brightness)
    ]
    HELMET_COLOR_MIN_RATIO = 0.13   # slightly above original 0.10 — the white range tightening handles false positives

    # Named colour ranges for role classification (matched in order)
    HELMET_COLOR_RANGES = [
        ('White',  [(  0, 180,   0,  50, 190, 255)]),
        ('Yellow', [( 15,  38,  70, 255,  80, 255)]),
        ('Orange', [(  5,  18,  80, 255,  80, 255)]),
        ('Red',    [(  0,   8, 100, 255,  80, 255), (165, 180, 100, 255, 80, 255)]),
        ('Blue',   [(100, 130,  80, 255,  80, 255)]),
        ('Green',  [( 35,  85,  80, 255,  80, 255)]),
    ]
    HELMET_ROLE_MAP = {
        'White':  'Site Manager',
        'Blue':   'Site Engineer',
        'Green':  'Road Worker',
        'Red':    'Flagman',
        'Orange': 'Paver Operator',
        'Yellow': 'Road Worker',
    }

    def detect_helmet_color(self, frame: np.ndarray, person_bbox: list) -> str:
        """
        Detect the dominant helmet colour in the person's head region and
        return the colour name, or 'Unknown' if none matched above threshold.
        """
        px1, py1, px2, py2 = person_bbox
        h_box = py2 - py1
        h1 = max(0, py1)
        h2 = min(frame.shape[0], py1 + int(h_box * 0.25))
        x1 = max(0, px1); x2 = min(frame.shape[1], px2)
        if h2 <= h1 or x2 <= x1:
            return 'Unknown'
        head  = frame[h1:h2, x1:x2]
        if head.size == 0:
            return 'Unknown'
        hsv   = cv2.cvtColor(head, cv2.COLOR_BGR2HSV)
        total = max(1, head.shape[0] * head.shape[1])
        best_color, best_ratio = 'Unknown', 0.0
        # Score each named color range and return the best match.
        for color_name, ranges in self.HELMET_COLOR_RANGES:
            mask = np.zeros(hsv.shape[:2], dtype=np.uint8)
            for (hl, hh, smin, smax, vmin, vmax) in ranges:
                mask |= cv2.inRange(hsv,
                                    np.array([hl, smin, vmin], dtype=np.uint8),
                                    np.array([hh, smax, vmax], dtype=np.uint8))
            ratio = np.count_nonzero(mask) / total
            if ratio > best_ratio:
                best_ratio, best_color = ratio, color_name
        return best_color if best_ratio >= self.HELMET_COLOR_MIN_RATIO else 'Unknown'

    # ------------------------------------------------------------------
    def detect_vest_by_color(self, frame: np.ndarray, person_bbox: list) -> bool:
        """
        Check for a high-visibility vest using HSV color analysis on the
        person's torso region (middle vertical third of the bounding box).

        Returns True if a sufficient area of hi-vis colour is found.
        """
        px1, py1, px2, py2 = person_bbox
        h_box = py2 - py1

        # Crop to torso: skip top 30% (head/helmet) and bottom 20% (legs)
        t1 = py1 + int(h_box * 0.30)
        t2 = py1 + int(h_box * 0.80)
        t1 = max(0, t1);  t2 = min(frame.shape[0], t2)
        x1 = max(0, px1); x2 = min(frame.shape[1], px2)

        if t2 <= t1 or x2 <= x1:
            return False

        torso = frame[t1:t2, x1:x2]
        hsv   = cv2.cvtColor(torso, cv2.COLOR_BGR2HSV)
        total = torso.shape[0] * torso.shape[1]
        if total == 0:
            return False

        mask = np.zeros(hsv.shape[:2], dtype=np.uint8)
        for (hl, hh, smin, smax, vmin, vmax) in self.VEST_HSV_RANGES:
            lower = np.array([hl,  smin, vmin], dtype=np.uint8)
            upper = np.array([hh,  smax, vmax], dtype=np.uint8)
            mask |= cv2.inRange(hsv, lower, upper)

        ratio = np.count_nonzero(mask) / total
        return ratio >= self.VEST_COLOR_MIN_RATIO

    # ------------------------------------------------------------------
    def detect_helmet_by_color(self, frame: np.ndarray, person_bbox: list) -> bool:
        """
        Check for a hard hat using HSV color analysis on the person's head
        region (top 25% of the bounding box).

        Covers yellow, orange, red, blue, and white hard hats.
        Returns True if a sufficient area of helmet colour is found.
        """
        px1, py1, px2, py2 = person_bbox
        h_box = py2 - py1

        # Crop to head: top 25% of bbox
        h1 = max(0, py1)
        h2 = py1 + int(h_box * 0.25)
        h2 = min(frame.shape[0], h2)
        x1 = max(0, px1); x2 = min(frame.shape[1], px2)

        if h2 <= h1 or x2 <= x1:
            return False

        head = frame[h1:h2, x1:x2]
        if head.size == 0:
            return False
        hsv   = cv2.cvtColor(head, cv2.COLOR_BGR2HSV)
        total = head.shape[0] * head.shape[1]

        mask = np.zeros(hsv.shape[:2], dtype=np.uint8)
        for (hl, hh, smin, smax, vmin, vmax) in self.HELMET_HSV_RANGES:
            lower = np.array([hl,  smin, vmin], dtype=np.uint8)
            upper = np.array([hh,  smax, vmax], dtype=np.uint8)
            mask |= cv2.inRange(hsv, lower, upper)

        ratio = np.count_nonzero(mask) / total
        return ratio >= self.HELMET_COLOR_MIN_RATIO

    # ------------------------------------------------------------------
    def check_ppe_for_person(self, person: dict, ppe_detections: list[dict],
                              iou_thresh: float = 0.15,
                              frame: np.ndarray = None) -> dict:
        """
        For a single person bbox, check which PPE items overlap with it.
        Also runs HSV color analysis as a fallback for vest detection.

        Returns:
            {'helmet': bool, 'vest': bool, 'vest_source': 'yolo'|'color'|None}
        """
        px1, py1, px2, py2 = person['bbox']
        has_helmet = False
        has_vest   = False

        # Check overlap of each PPE item with the person bbox.
        for ppe in ppe_detections:
            bx1, by1, bx2, by2 = ppe['bbox']
            # Compute intersection
            ix1 = max(px1, bx1); iy1 = max(py1, by1)
            ix2 = min(px2, bx2); iy2 = min(py2, by2)
            inter_w = max(0, ix2 - ix1)
            inter_h = max(0, iy2 - iy1)
            inter   = inter_w * inter_h

            ppe_area = max(1, (bx2 - bx1) * (by2 - by1))
            overlap  = inter / ppe_area  # fraction of PPE box inside person box

            if overlap >= iou_thresh:
                if ppe['class_id'] == self.HELMET_ID:
                    has_helmet = True
                elif ppe['class_id'] == self.VEST_ID:
                    has_vest = True

        # HSV colour fallback: if YOLO missed the vest, try colour detection.
        vest_source = None
        if has_vest:
            vest_source = 'yolo'
        elif frame is not None and self.detect_vest_by_color(frame, person['bbox']):
            has_vest    = True
            vest_source = 'color'

        # HSV colour fallback for helmet.
        helmet_source = None
        helmet_color  = 'Unknown'
        if has_helmet:
            helmet_source = 'yolo'
            if frame is not None:
                helmet_color = self.detect_helmet_color(frame, person['bbox'])
        elif frame is not None and self.detect_helmet_by_color(frame, person['bbox']):
            has_helmet    = True
            helmet_source = 'color'
            helmet_color  = self.detect_helmet_color(frame, person['bbox'])

        # Role mapping derived from helmet color.
        role = self.HELMET_ROLE_MAP.get(helmet_color, 'Unknown') if has_helmet else 'Unknown'

        return {'helmet': has_helmet, 'vest': has_vest,
                'vest_source': vest_source, 'helmet_source': helmet_source,
                'helmet_color': helmet_color, 'role': role}

    # ------------------------------------------------------------------
    def draw_results(self, frame: np.ndarray, detections: list[dict]) -> np.ndarray:
        """Draw raw bounding boxes for all detections (debug use)."""
        COLOR_MAP = {
            self.PERSON_ID: (255, 200, 0),
            self.HELMET_ID: (0, 220, 0),
            self.VEST_ID:   (0, 160, 255),
        }
        out = frame.copy()
        for d in detections:
            x1, y1, x2, y2 = d['bbox']
            color = COLOR_MAP.get(d['class_id'], (180, 180, 180))
            label = f"{d['class_name']} {d['confidence']:.2f}"
            cv2.rectangle(out, (x1, y1), (x2, y2), color, 2)
            cv2.putText(out, label, (x1, max(y1 - 6, 12)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 2)
        return out
