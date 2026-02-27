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

    CLASS_NAMES = {0: 'Helmet', 1: 'Person', 2: 'Vest', 3: 'objects'}
    PERSON_ID   = 1
    HELMET_ID   = 0
    VEST_ID     = 2

    def __init__(self, weights: str = 'yolov8n.pt',
                 conf_threshold: float = 0.4,
                 nms_threshold: float = 0.45,
                 device: str = 'cpu',
                 image_size: int = 640):
        """
        Args:
            weights:        Path to .pt weights file, or 'yolov8n.pt' to use
                            the COCO pre-trained model.
            conf_threshold: Minimum confidence to keep a detection.
            nms_threshold:  IoU threshold for Non-Maximum Suppression.
            device:         'cpu' or 'cuda'.
            image_size:     Inference image size.
        """
        self.conf  = conf_threshold
        self.iou   = nms_threshold
        self.device = device
        self.imgsz = image_size
        self.model = YOLO(weights)

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
