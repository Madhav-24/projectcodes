from typing import Callable, Dict, Iterable, List, Optional, Set, Tuple


# Normalize alternate labels into canonical class names.
OBJECT_ALIASES = {
    "dozer": "bulldozer",
    "bull_dozer": "bulldozer",
    "motor_grader": "grader",
    "dumptruck": "tipper",
    "dump-truck": "tipper",
    "dump_truck": "tipper",
}

# Map activity names to scorer functions (string names for metadata/use).
ACTIVITY_RULES = {
    "excavation": "score_earthwork",
    "asphalt_paving": "score_asphalt_paving",
    "gsb_laying": "score_gsb_laying",
    "land_grading": "score_land_grading",
    "subgrade_preparation": "score_subgrade_preparation",
    "site_clearing_vegetation_removal": "score_site_clearing_vegetation_removal",
}


# Global feature thresholds/weights.
HIGH_EDGE = 0.16
HIGH_TEXTURE = 0.06
LAYER_WEIGHT_MULT = 1.5

# GSB laying tuning values.
GSB_LAYER_NAMES = {"gsb", "granular_sub_base"}
GSB_WRONG_LAYER = {"asphalt", "wmm"}
GSB_MIN_LAYER_CONF = 0.55


def _normalize_label(label: str) -> str:
    # Normalize string labels so rules match consistently.
    key = str(label).strip().lower().replace(" ", "_")
    return OBJECT_ALIASES.get(key, key)


def _clip01(v: float) -> float:
    # Clamp values to [0, 1] for scoring stability.
    return float(max(0.0, min(1.0, v)))


def _low_score(v: float, max_ok: float) -> float:
    if max_ok <= 0:
        return 0.0
    return _clip01(1.0 - (v / max_ok))


def _midlow_score(v: float, low: float, high: float) -> float:
    if v <= low:
        return 1.0
    if v >= high:
        return 0.0
    return _clip01((high - v) / max(high - low, 1e-6))


def _get_conf(object_conf: Dict, name: str, default_if_present: float = 0.6) -> float:
    # Resolve the confidence of a named object with alias handling.
    norm_name = _normalize_label(name)
    for k, v in (object_conf or {}).items():
        if _normalize_label(k) == norm_name:
            return _clip01(float(v))
    return _clip01(default_if_present)


def _extract_detected_classes(frame: Dict) -> Set[str]:
    # Pull normalized machinery classes from frame payload.
    raw = frame.get("machinaries", frame.get("machineries", frame.get("machinery", []))) or []
    return {_normalize_label(x) for x in raw}


def has_object(detected_classes: Set[str], object_name: str) -> bool:
    return _normalize_label(object_name) in detected_classes


def extract_detected_classes(detections: Iterable[Dict], conf_threshold: float = 0.5) -> Set[str]:
    # Convert detection dicts into a set of class labels above a threshold.
    classes: Set[str] = set()
    threshold = float(conf_threshold)
    for det in detections or []:
        conf = float(det.get("confidence", det.get("conf", 0.0)))
        if conf < threshold:
            continue
        cls = _normalize_label(det.get("class_name", det.get("class", det.get("name", ""))))
        if cls:
            classes.add(cls)
    return classes


def _default_is_near(obj1: str, obj2: str, positions: Dict, proximity_ratio: float = 1.2) -> bool:
    # Proximity check based on bbox centers and size.
    a = positions.get(_normalize_label(obj1))
    b = positions.get(_normalize_label(obj2))
    if a is None or b is None:
        return False
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    acx, acy = (ax1 + ax2) * 0.5, (ay1 + ay2) * 0.5
    bcx, bcy = (bx1 + bx2) * 0.5, (by1 + by2) * 0.5
    dist = ((acx - bcx) ** 2 + (acy - bcy) ** 2) ** 0.5
    aw, ah = max(ax2 - ax1, 1), max(ay2 - ay1, 1)
    bw, bh = max(bx2 - bx1, 1), max(by2 - by1, 1)
    scale = max((aw + bw) * 0.5, (ah + bh) * 0.5)
    return bool(dist <= proximity_ratio * scale)


def score_earthwork(frame: Dict, detected: Set[str], near_fn: Callable[[str, str], bool]) -> float:
    # Earthwork score: excavator + tipper + soil/texture cues.
    score = 0.0
    layer = _normalize_label(frame.get("layer", ""))
    layer_conf = _clip01(float(frame.get("layer_conf", 0.0)))
    feats = frame.get("features", {}) or {}
    obj_conf = frame.get("object_conf", {}) or {}

    if "excavator" in detected:
        score += 3.0 * _get_conf(obj_conf, "excavator")
    if "tipper" in detected:
        score += 2.0 * _get_conf(obj_conf, "tipper")
    if layer == "soil":
        score += (2.0 * LAYER_WEIGHT_MULT) * layer_conf
    if "excavator" in detected and "tipper" in detected and near_fn("excavator", "tipper"):
        score += 2.0

    texture_var = float(feats.get("texture_variance", 0.0))
    score += 2.0 * _clip01(texture_var / 0.08)
    return score


def score_asphalt_paving(frame: Dict, detected: Set[str]) -> float:
    # Asphalt paving score: roller + asphalt layer + low edge/green cues.
    score = 0.0
    layer = _normalize_label(frame.get("layer", ""))
    layer_conf = _clip01(float(frame.get("layer_conf", 0.0)))
    feats = frame.get("features", {}) or {}
    obj_conf = frame.get("object_conf", {}) or {}

    if "roller" in detected:
        score += 3.0 * _get_conf(obj_conf, "roller")
    if layer == "asphalt":
        score += (3.0 * LAYER_WEIGHT_MULT) * layer_conf

    edge_density = float(feats.get("edge_density", 0.0))
    green_ratio = float(feats.get("green_ratio", 0.0))
    score += 2.0 * _low_score(edge_density, 0.18)
    # Lower green ratio often corresponds to darker paved surfaces in this use-case.
    score += 1.5 * _low_score(green_ratio, 0.25)
    return score


def score_gsb_laying(frame: Dict, detected: Set[str], near_fn: Callable[[str, str], bool]) -> float:
    # GSB laying score: tipper/dump-truck + loader + strong GSB layer context.
    score = 0.0
    layer = _normalize_label(frame.get("layer", ""))
    layer_conf = _clip01(float(frame.get("layer_conf", 0.0)))
    obj_conf = frame.get("object_conf", {}) or {}

    has_truck = "tipper" in detected
    has_loader = "loader" in detected

    if has_truck:
        score += 3.0 * _get_conf(obj_conf, "tipper")
    if has_loader:
        score += 2.6 * _get_conf(obj_conf, "loader")

    if layer in GSB_LAYER_NAMES:
        score += (3.2 * LAYER_WEIGHT_MULT) * layer_conf
        if layer_conf >= GSB_MIN_LAYER_CONF:
            score += 1.4

    if has_truck and has_loader:
        score += 1.6
    if has_truck and has_loader and near_fn("tipper", "loader"):
        score += 1.4

    # Fallback: truck + strong layer signal even if loader is occluded.
    if has_truck and layer in GSB_LAYER_NAMES and layer_conf >= 0.45:
        score += 1.0

    # Negative conditions to avoid overlap with paving/compaction stages.
    if layer in GSB_WRONG_LAYER:
        score -= 2.6
    if "roller" in detected and layer not in GSB_LAYER_NAMES:
        score -= 2.0
    return score


def score_land_grading(frame: Dict, detected: Set[str]) -> float:
    # Land grading score: dozer/grader + soil + low edge/texture.
    score = 0.0
    layer = _normalize_label(frame.get("layer", ""))
    layer_conf = _clip01(float(frame.get("layer_conf", 0.0)))
    feats = frame.get("features", {}) or {}
    obj_conf = frame.get("object_conf", {}) or {}

    if "bulldozer" in detected:
        score += 3.0 * _get_conf(obj_conf, "bulldozer")
    if "grader" in detected:
        score += 2.8 * _get_conf(obj_conf, "grader")
    if layer == "soil":
        score += (2.0 * LAYER_WEIGHT_MULT) * layer_conf

    edge_density = float(feats.get("edge_density", 0.0))
    texture_var = float(feats.get("texture_variance", 0.0))
    score += 1.8 * _low_score(edge_density, 0.16)
    score += 1.8 * _low_score(texture_var, 0.06)
    return score


def score_subgrade_preparation(frame: Dict, detected: Set[str]) -> float:
    # Subgrade prep score: roller + soil/subgrade + mid-low texture/edge.
    score = 0.0
    layer = _normalize_label(frame.get("layer", ""))
    layer_conf = _clip01(float(frame.get("layer_conf", 0.0)))
    feats = frame.get("features", {}) or {}
    obj_conf = frame.get("object_conf", {}) or {}

    if "roller" in detected:
        score += 3.0 * _get_conf(obj_conf, "roller")
    if layer in {"soil", "subgrade"}:
        score += (2.5 * LAYER_WEIGHT_MULT) * layer_conf

    edge_density = float(feats.get("edge_density", 0.0))
    texture_var = float(feats.get("texture_variance", 0.0))
    score += 1.6 * _midlow_score(edge_density, low=0.05, high=0.20)
    score += 1.6 * _midlow_score(texture_var, low=0.02, high=0.08)
    return score


def score_site_clearing_vegetation_removal(frame: Dict, detected: Set[str]) -> float:
    """Vegetation removal / site clearing activity score.

    Uses heavy-machinery presence + soil layer + green/texture/edge cues.
    """
    score = 0.0
    layer = _normalize_label(frame.get("layer", ""))
    layer_conf = _clip01(float(frame.get("layer_conf", 0.0)))
    feats = frame.get("features", {}) or {}
    obj_conf = frame.get("object_conf", {}) or {}

    # Balanced weights aligned with other activity scorers.
    if "excavator" in detected:
        score += 2.4 * _get_conf(obj_conf, "excavator")
    if "bulldozer" in detected:
        score += 2.4 * _get_conf(obj_conf, "bulldozer")
    if layer == "soil":
        score += (1.8 * LAYER_WEIGHT_MULT) * layer_conf

    green_ratio = float(feats.get("green_ratio", 0.0))
    edge_density = float(feats.get("edge_density", 0.0))
    texture_var = float(feats.get("texture_variance", 0.0))

    # Vegetation/texture cues.
    if green_ratio > 0.05:
        score += 1.6
    if edge_density > HIGH_EDGE:
        score += 1.6
    if texture_var > HIGH_TEXTURE:
        score += 0.9
    return score


def detect_activity(
    frame: Dict,
    is_near: Optional[Callable[[str, str], bool]] = None,
) -> Tuple[str, Dict[str, float]]:
    """
    Score-based activity detector.

    Input frame format:
      {
        "machinaries": [...],
        "object_conf": {...},
        "layer": "soil|asphalt|...",
        "layer_conf": 0..1,
        "features": {
          "edge_density": float,
          "texture_variance": float,
          "green_ratio": float,
        },
        "positions": {"obj": (x1,y1,x2,y2), ...}
      }

    Returns:
      (final_activity, activity_scores)
    """
    # Normalize inputs and prepare proximity function.
    detected = _extract_detected_classes(frame)

    positions_raw = frame.get("positions", {}) or {}
    positions = {_normalize_label(k): v for k, v in positions_raw.items()}

    if is_near is None:
        near_fn = lambda a, b: _default_is_near(a, b, positions)
    else:
        near_fn = is_near

    # Compute all activity scores and choose the max.
    activity_scores = {
        "excavation": score_earthwork(frame, detected, near_fn),
        "asphalt_paving": score_asphalt_paving(frame, detected),
        "gsb_laying": score_gsb_laying(frame, detected, near_fn),
        "land_grading": score_land_grading(frame, detected),
        "subgrade_preparation": score_subgrade_preparation(frame, detected),
        "site_clearing_vegetation_removal": score_site_clearing_vegetation_removal(frame, detected),
    }

    final_activity = max(activity_scores, key=activity_scores.get)
    return final_activity, activity_scores


def detect_activities(detections: List[Dict], layer: str, conf_threshold: float = 0.0) -> List[str]:
    """Backward-compatible wrapper returning top-1 activity as a list."""
    machinaries: List[str] = []
    object_conf: Dict[str, float] = {}
    positions: Dict[str, Tuple[int, int, int, int]] = {}

    for det in detections or []:
        conf = float(det.get("confidence", det.get("conf", 0.0)))
        if conf < float(conf_threshold):
            continue

        name = _normalize_label(det.get("class_name", det.get("class", det.get("name", ""))))
        if not name:
            continue
        machinaries.append(name)
        object_conf[name] = max(conf, object_conf.get(name, 0.0))
        bbox = det.get("bounding_box", det.get("bbox", None))
        if bbox is not None and name not in positions:
            positions[name] = tuple(bbox)

    frame = {
        "machinaries": machinaries,
        "object_conf": object_conf,
        "layer": layer,
        "layer_conf": 1.0,
        "features": {
            "edge_density": 0.0,
            "texture_variance": 0.0,
            "green_ratio": 0.0,
        },
        "positions": positions,
    }
    final_activity, _ = detect_activity(frame)
    return [final_activity] if final_activity else []
