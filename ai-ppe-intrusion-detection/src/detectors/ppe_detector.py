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
                 nms_threshold: float = 0.45,
                 device: str = 'cpu',
                 image_size: int = 640):
        """
        Args:
            weights:        Path to custom PPE .pt weights file.
            person_weights: Pretrained YOLO weights for person detection (COCO).
                            If same as weights, a single model is used.
            conf_threshold: Minimum confidence to keep a detection.
            nms_threshold:  IoU threshold for Non-Maximum Suppression.
            device:         'cpu' or 'cuda'.
            image_size:     Inference image size.
        """
        self.conf   = conf_threshold
        self.iou    = nms_threshold
        self.device = device
        self.imgsz  = image_size
        self.model  = YOLO(weights)
        # Use a separate pretrained COCO model for robust person detection
        if person_weights == weights:
            self.person_model = self.model
            self.use_coco_person = False
        else:
            self.person_model = YOLO(person_weights)
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
        results = self.model.predict(
            source=frame,
            conf=self.conf,
            iou=self.iou,
            device=self.device,
            imgsz=self.imgsz,
            verbose=False
        )

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
        Uses COCO pretrained YOLO (class 0 = person) for best accuracy.
        """
        results = self.person_model.predict(
            source=frame, conf=self.conf, iou=self.iou,
            device=self.device, imgsz=self.imgsz, verbose=False
        )
        persons = []
        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                # COCO pretrained: class 0 = person
                # Custom model: class 4 = Person
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
    def check_ppe_for_person(self, person: dict, ppe_detections: list[dict],
                              iou_thresh: float = 0.15) -> dict:
        """
        For a single person bbox, check which PPE items overlap with it.

        Uses IoU between person box and each PPE box to determine association.

        Returns:
            {'helmet': bool, 'vest': bool}
        """
        px1, py1, px2, py2 = person['bbox']
        has_helmet = False
        has_vest   = False

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

        return {'helmet': has_helmet, 'vest': has_vest}

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
