from collections import Counter, deque
from typing import Deque, Dict, Iterable, List, Optional, Tuple

import cv2
import numpy as np


# Canonical layer class list used for re-ranking.
DEFAULT_LAYER_CLASSES: Tuple[str, ...] = (
    "soil",
    "subgrade",
    "gsb",
    "wmm",
    "asphalt",
    "wetmix",
)

# Map alternate labels to canonical layer names.
LAYER_ALIASES: Dict[str, str] = {
    "bitumen": "asphalt",
    "blacktop": "asphalt",
    # Backward compatibility: map old concrete-style labels to wetmix.
    "concrete": "wetmix",
    "pcc": "wetmix",
    "dlc": "wetmix",
}

# Tunable HSV profiles per layer. Each layer can have multiple HSV bands.
# Format: {layer: [([h_low, s_low, v_low], [h_high, s_high, v_high]), ...]}
# HSV bands per layer for color matching.
DEFAULT_HSV_RANGES: Dict[str, List[Tuple[List[int], List[int]]]] = {
    "soil": [([0, 40, 25], [18, 255, 255]), ([8, 35, 35], [38, 255, 255])],
    "subgrade": [([10, 30, 35], [34, 255, 255])],
    "gsb": [([12, 18, 50], [38, 210, 210])],
    "wmm": [([0, 0, 55], [180, 75, 205])],
    # Asphalt HSV restored to broader range for better recall.
    "asphalt": [([0, 0, 0], [180, 70, 120])],
    # Wetmix is intentionally constrained to brighter neutral tones.
    "wetmix": [([0, 0, 105], [180, 60, 255])],
}


def _normalize_label(label: str) -> str:
    # Normalize labels to the canonical layer names.
    key = str(label).strip().lower()
    return LAYER_ALIASES.get(key, key)


def extract_roi(frame: np.ndarray, bbox: Tuple[int, int, int, int]) -> np.ndarray:
    """Return ROI cropped from frame using a clipped bbox (x1, y1, x2, y2)."""
    if frame is None or frame.size == 0:
        return np.empty((0, 0, 3), dtype=np.uint8)

    h, w = frame.shape[:2]
    x1, y1, x2, y2 = [int(v) for v in bbox]
    x1 = max(0, min(x1, w - 1))
    x2 = max(0, min(x2, w))
    y1 = max(0, min(y1, h - 1))
    y2 = max(0, min(y2, h))

    if x2 <= x1 or y2 <= y1:
        return np.empty((0, 0, 3), dtype=np.uint8)

    return frame[y1:y2, x1:x2]


def _preprocess_roi(roi: np.ndarray) -> np.ndarray:
    """Apply CLAHE in LAB and brightness normalization for robust edge inference."""
    if roi is None or roi.size == 0:
        return roi

    lab = cv2.cvtColor(roi, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_eq = clahe.apply(l)

    l_norm = cv2.normalize(l_eq, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX)
    lab_norm = cv2.merge((l_norm, a, b))
    return cv2.cvtColor(lab_norm, cv2.COLOR_LAB2BGR)


def compute_hsv_score(
    roi: np.ndarray,
    layer_type: str,
    hsv_ranges: Optional[Dict[str, List[Tuple[List[int], List[int]]]]] = None,
) -> float:
    """Compute HSV match score in [0, 1] using per-layer HSV bands."""
    if roi is None or roi.size == 0:
        return 0.0

    ranges = hsv_ranges or DEFAULT_HSV_RANGES
    key = _normalize_label(layer_type)
    layer_ranges = ranges.get(key, [])
    if not layer_ranges:
        return 0.0

    processed = _preprocess_roi(roi)
    hsv = cv2.cvtColor(processed, cv2.COLOR_BGR2HSV)
    return _compute_hsv_score_from_hsv(hsv, layer_ranges)


def _compute_hsv_score_from_hsv(
    hsv: np.ndarray,
    layer_ranges: List[Tuple[List[int], List[int]]],
) -> float:
    if hsv is None or hsv.size == 0 or not layer_ranges:
        return 0.0

    mask = np.zeros(hsv.shape[:2], dtype=np.uint8)
    for low, high in layer_ranges:
        lo = np.array(low, dtype=np.uint8)
        hi = np.array(high, dtype=np.uint8)
        mask = cv2.bitwise_or(mask, cv2.inRange(hsv, lo, hi))

    matched = float(np.count_nonzero(mask))
    total = float(mask.size)
    if total <= 0:
        return 0.0
    return _clip01(matched / total)


def _clip01(value: float) -> float:
    # Clamp values to [0, 1] for scoring stability.
    return float(np.clip(value, 0.0, 1.0))


def _score_by_target(value: float, target: float, tolerance: float) -> float:
    if tolerance <= 0:
        return 0.0
    return _clip01(1.0 - abs(value - target) / tolerance)


def compute_texture_score(roi: np.ndarray, layer_type: str) -> float:
    """Compute texture score in [0, 1] from variance and edge density."""
    if roi is None or roi.size == 0:
        return 0.0

    processed = _preprocess_roi(roi)
    gray = cv2.cvtColor(processed, cv2.COLOR_BGR2GRAY)
    var_norm, edge_norm = _extract_texture_metrics(gray)
    return _compute_texture_score_from_metrics(layer_type, var_norm, edge_norm)


def _extract_texture_metrics(gray: np.ndarray) -> Tuple[float, float]:
    # Convert raw variance/edge density into normalized features.
    if gray is None or gray.size == 0:
        return 0.0, 0.0

    variance = float(np.var(gray))
    var_norm = _clip01(variance / 2500.0)

    edges = cv2.Canny(gray, 75, 150)
    edge_density = float(np.count_nonzero(edges)) / float(max(edges.size, 1))
    edge_norm = _clip01(edge_density * 4.0)
    return var_norm, edge_norm


def _compute_texture_score_from_metrics(layer_type: str, var_norm: float, edge_norm: float) -> float:
    # Layer-specific texture heuristics.
    layer = _normalize_label(layer_type)
    if layer == "asphalt":
        score = 0.65 * (1.0 - var_norm) + 0.35 * (1.0 - edge_norm)
    elif layer == "wetmix":
        # Wetmix is typically bright/neutral with low-medium texture.
        score = 0.6 * _score_by_target(var_norm, target=0.35, tolerance=0.35) + 0.4 * _score_by_target(edge_norm, target=0.25, tolerance=0.3)
    elif layer == "gsb":
        score = 0.55 * var_norm + 0.45 * edge_norm
    elif layer == "wmm":
        # WMM: medium texture with moderate edge response.
        score = 0.65 * _score_by_target(var_norm, target=0.55, tolerance=0.45) + 0.35 * _score_by_target(edge_norm, target=0.45, tolerance=0.45)
    elif layer == "soil" or layer == "subgrade":
        # Soil/subgrade: medium-high variance, medium edge response.
        score = 0.7 * _score_by_target(var_norm, target=0.65, tolerance=0.5) + 0.3 * _score_by_target(edge_norm, target=0.35, tolerance=0.4)
    else:
        score = 0.5 * var_norm + 0.5 * edge_norm

    return _clip01(score)


def compute_final_score(model_conf: float, hsv_score: float, texture_score: float) -> float:
    """Weighted score fusion (does not directly override model output)."""
    return _clip01(0.5 * float(model_conf) + 0.3 * float(hsv_score) + 0.2 * float(texture_score))


def _extract_detection_fields(detection: Dict) -> Tuple[Tuple[int, int, int, int], str, float]:
    # Extract bbox/label/confidence in a consistent format.
    bbox = detection.get("bbox", (0, 0, 0, 0))
    pred_label = _normalize_label(detection.get("class", detection.get("label", detection.get("name", "unknown"))))
    model_conf = float(detection.get("confidence", detection.get("conf", 0.0)))
    model_conf = _clip01(model_conf)
    return bbox, pred_label, model_conf


def _class_specific_model_conf(candidate: str, predicted: str, model_conf: float, n_classes: int) -> float:
    """Assign larger model prior to YOLO predicted class for re-ranking stability."""
    if n_classes <= 1:
        return model_conf
    if candidate == predicted:
        return model_conf
    return _clip01((1.0 - model_conf) / float(n_classes - 1))


def classify_layer(
    detection: Dict,
    frame: np.ndarray,
    possible_layers: Optional[Iterable[str]] = None,
    hsv_ranges: Optional[Dict[str, List[Tuple[List[int], List[int]]]]] = None,
) -> Tuple[str, float]:
    """
    Re-rank all layer classes by combining model prior + HSV + texture.

    Returns: (final_class, final_score)
    """
    # Assemble candidate layers and extract ROI.
    bbox, pred_label, model_conf = _extract_detection_fields(detection)
    layers = []
    for item in (possible_layers or DEFAULT_LAYER_CLASSES):
        norm = _normalize_label(item)
        if norm not in layers:
            layers.append(norm)
    if not layers:
        return pred_label, model_conf

    if pred_label not in layers:
        layers.append(pred_label)

    roi = extract_roi(frame, bbox)
    if roi is None or roi.size == 0:
        return pred_label, model_conf

    # Compute HSV/texture features once and reuse across candidates.
    processed = _preprocess_roi(roi)
    hsv = cv2.cvtColor(processed, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(processed, cv2.COLOR_BGR2GRAY)
    var_norm, edge_norm = _extract_texture_metrics(gray)
    ranges = hsv_ranges or DEFAULT_HSV_RANGES

    hsv_scores = {
        layer: _compute_hsv_score_from_hsv(hsv, ranges.get(layer, []))
        for layer in layers
    }

    pred_hsv = hsv_scores.get(pred_label, 0.0)
    alt_hsv_best = max((score for layer, score in hsv_scores.items() if layer != pred_label), default=0.0)
    pred_hsv_contradicted = pred_hsv < 0.08 and alt_hsv_best > (pred_hsv + 0.15)

    best_class = pred_label
    best_score = 0.0

    n_classes = len(layers)
    # Score each layer and pick the best.
    for layer in layers:
        cls_model_conf = _class_specific_model_conf(layer, pred_label, model_conf, n_classes)
        hsv_score = hsv_scores.get(layer, 0.0)

        # If the predicted class has very weak color support while alternatives are strong,
        # reduce its model prior instead of hard overriding with HSV.
        if pred_hsv_contradicted and layer == pred_label:
            cls_model_conf *= 0.55

        texture_score = _compute_texture_score_from_metrics(layer, var_norm, edge_norm)
        final_score = compute_final_score(cls_model_conf, hsv_score, texture_score)

        if final_score > best_score:
            best_score = final_score
            best_class = layer

    return best_class, _clip01(best_score)


class TemporalLayerSmoother:
    """Optional temporal smoother: confirm class if >= threshold in recent N frames."""

    def __init__(self, window_size: int = 10, consistency_threshold: float = 0.7) -> None:
        self.window_size = max(1, int(window_size))
        self.consistency_threshold = _clip01(float(consistency_threshold))
        self._labels: Deque[str] = deque(maxlen=self.window_size)
        self._scores: Deque[float] = deque(maxlen=self.window_size)

    def update(self, label: str, score: float) -> Tuple[str, float, bool]:
        # Update rolling window and return (label, score, confirmed).
        label = str(label).lower()
        score = _clip01(float(score))
        self._labels.append(label)
        self._scores.append(score)

        if not self._labels:
            return label, score, False

        counts = Counter(self._labels)
        top_label, top_count = counts.most_common(1)[0]
        ratio = float(top_count) / float(len(self._labels))

        if ratio >= self.consistency_threshold:
            top_scores = [s for l, s in zip(self._labels, self._scores) if l == top_label]
            confirmed_score = float(np.mean(top_scores)) if top_scores else score
            return top_label, _clip01(confirmed_score), True

        return label, score, False
