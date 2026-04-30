# Module: PPE Detection Service
# Purpose: Run YOLOv8 ONNX inference and return normalized detection boxes.

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import List, Tuple

import numpy as np
from ultralytics import YOLO

BBox = Tuple[float, float, float, float]

MODEL_PATH = Path(__file__).resolve().parents[2] / "ppe_safety_app 1" / "ppe_safety_app" / "best.onnx"
CONFIDENCE_THRESHOLD = 0.25

PERSON_LABELS = {"person", "worker", "human"}
HELMET_LABELS = {"helmet", "hardhat", "hard hat", "safety helmet", "safety_helmet"}
VEST_LABELS = {"vest", "safety vest", "safety_vest", "reflective vest", "reflective_vest"}
GLOVE_LABELS = {"glove", "gloves", "safety gloves", "safety_gloves"}
NO_HELMET_LABELS = {"no helmet", "no_helmet", "without helmet", "without_helmet"}
NO_VEST_LABELS = {"no vest", "no_vest", "without vest", "without_vest"}
NO_GLOVE_LABELS = {"no glove", "no_glove", "without glove", "without_glove"}


@dataclass
class DetectionBox:
    label: str
    bbox: BBox


_model: YOLO | None = None


def _normalize_label(label: str) -> str:
    return label.replace("_", " ").replace("-", " ").strip().lower()


def _get_model() -> YOLO:
    global _model
    if _model is None:
        _model = YOLO(str(MODEL_PATH), task="detect")
    return _model


def run_inference(frame_bgr: np.ndarray) -> List[DetectionBox]:
    result = _get_model().predict(source=frame_bgr, conf=CONFIDENCE_THRESHOLD, verbose=False)[0]
    if result.boxes is None or result.boxes.cls is None:
        return []

    names = result.names
    detections: List[DetectionBox] = []

    for cls_id, xyxy in zip(result.boxes.cls.tolist(), result.boxes.xyxy.tolist()):
        idx = int(cls_id)
        raw_name = str(names.get(idx, idx)) if isinstance(names, dict) else str(names[idx])
        detections.append(
            DetectionBox(
                label=_normalize_label(raw_name),
                bbox=tuple(float(v) for v in xyxy),
            )
        )

    return detections
