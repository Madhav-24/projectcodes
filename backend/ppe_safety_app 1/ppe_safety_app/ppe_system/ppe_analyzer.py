"""PPE post-processing and compliance rule evaluation.

Transforms raw object detections into counts, model capability flags, and
compliance alerts that downstream APIs and dashboards can consume.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Dict, Iterable, List, Sequence, Tuple

from .schemas import DetectionSummary

NEGATIVE_MARKERS = ("no ", "no_", "no-", "without", "missing", "absent")

PERSON_KEYWORDS = ("person", "worker", "human", "people", "man", "woman")
HELMET_KEYWORDS = ("helmet", "hardhat", "hard_hat", "hard-hat", "hat", "safety helmet")
VEST_KEYWORDS = ("vest", "safety_vest", "safety vest", "reflective_vest", "jacket")
SHOE_KEYWORDS = (
    "shoe",
    "shoes",
    "safety shoe",
    "safety shoes",
    "boot",
    "boots",
    "safety boot",
    "safety boots",
    "footwear",
)
GLOVE_KEYWORDS = ("glove", "gloves", "hand glove", "hand gloves", "safety glove", "safety gloves")
HARNESS_KEYWORDS = ("harness", "safety harness", "full body harness", "strap", "lifeline", "lanyard")

GLOVE_REQUIRED_TASKS = {
    "welding",
    "chemical handling",
    "electrical work",
    "material cutting/grinding",
    "heavy lifting",
}


def normalize_text(value: str) -> str:
    """Normalize labels and keywords for robust matching.

    Parameters:
    - value: Raw text to normalize.

    Returns:
    - Lower-cased text with separators normalized.
    """
    return value.replace("_", " ").replace("-", " ").strip().lower()


@lru_cache(maxsize=64)
def _cached_normalize_many(values: Tuple[str, ...]) -> Tuple[str, ...]:
    """Normalize a tuple of strings with memoization."""
    return tuple(normalize_text(v) for v in values)


def supports_keywords(model_labels: Sequence[str], keywords: Iterable[str]) -> bool:
    """Check if model label space supports a PPE concept.

    Parameters:
    - model_labels: Model classes as lowercase strings.
    - keywords: Candidate phrases for a PPE type.

    Returns:
    - True if at least one label semantically matches a keyword.
    """
    normalized_labels = _cached_normalize_many(tuple(model_labels))
    normalized_keywords = _cached_normalize_many(tuple(keywords))
    return any(any(k in label for k in normalized_keywords) for label in normalized_labels)


def _is_negative_label(label: str, keywords: Sequence[str]) -> bool:
    """Return True when a class label indicates PPE absence."""
    return any(keyword in label for keyword in keywords) and any(marker in label for marker in NEGATIVE_MARKERS)


def _count_by_keywords(class_counts: Dict[str, int], keywords: Sequence[str], include_negative: bool = False) -> int:
    """Count detections that contain any of the given keywords."""
    total = 0
    for label, count in class_counts.items():
        if any(keyword in label for keyword in keywords):
            if not include_negative and _is_negative_label(label, keywords):
                continue
            total += count
    return total


def _collect_class_counts(result) -> Dict[str, int]:
    """Convert model output classes to a normalized count map."""
    counts: Dict[str, int] = {}
    names = result.names

    if result.boxes is None or result.boxes.cls is None:
        return counts

    for class_id in result.boxes.cls.tolist():
        class_index = int(class_id)
        if isinstance(names, dict):
            label = str(names.get(class_index, class_index))
        else:
            label = str(names[class_index]) if class_index < len(names) else str(class_index)

        key = label.strip().lower()
        counts[key] = counts.get(key, 0) + 1

    return counts


def analyze_result(result, task_type: str, is_height_work: bool) -> DetectionSummary:
    """Generate PPE counts and compliance alerts for one frame.

    Parameters:
    - result: Single Ultralytics detection result object.
    - task_type: Work context used for glove requirements.
    - is_height_work: Whether harness checks should be enforced.

    Returns:
    - DetectionSummary containing counts, capability flags, and alerts.
    """
    names = result.names
    if isinstance(names, dict):
        model_labels = [str(v).strip().lower() for v in names.values()]
    elif isinstance(names, list):
        model_labels = [str(v).strip().lower() for v in names]
    else:
        model_labels = []

    class_counts = _collect_class_counts(result)
    normalized_task = (task_type or "").strip().lower()
    gloves_required = normalized_task in GLOVE_REQUIRED_TASKS

    supports_shoes = supports_keywords(model_labels, SHOE_KEYWORDS)
    supports_gloves = supports_keywords(model_labels, GLOVE_KEYWORDS)
    supports_harness = supports_keywords(model_labels, HARNESS_KEYWORDS)

    persons = _count_by_keywords(class_counts, PERSON_KEYWORDS)
    helmets = _count_by_keywords(class_counts, HELMET_KEYWORDS)
    vests = _count_by_keywords(class_counts, VEST_KEYWORDS)
    shoes = _count_by_keywords(class_counts, SHOE_KEYWORDS)
    gloves = _count_by_keywords(class_counts, GLOVE_KEYWORDS)
    harnesses = _count_by_keywords(class_counts, HARNESS_KEYWORDS)

    no_helmets = _count_by_keywords(class_counts, HELMET_KEYWORDS, include_negative=True) - helmets
    no_vests = _count_by_keywords(class_counts, VEST_KEYWORDS, include_negative=True) - vests
    no_shoes = _count_by_keywords(class_counts, SHOE_KEYWORDS, include_negative=True) - shoes
    no_gloves = _count_by_keywords(class_counts, GLOVE_KEYWORDS, include_negative=True) - gloves
    no_harnesses = _count_by_keywords(class_counts, HARNESS_KEYWORDS, include_negative=True) - harnesses

    alerts: List[str] = []
    if persons == 0:
        alerts.append("No persons detected.")
    else:
        if no_helmets > 0:
            alerts.append(f"Helmet alert: {no_helmets} person(s) detected without helmets/hats.")
        elif helmets < persons:
            alerts.append(f"Helmet alert: {persons - helmets} person(s) may be without helmets.")

        if no_vests > 0:
            alerts.append(f"Vest alert: {no_vests} person(s) detected without safety vests.")
        elif vests < persons:
            alerts.append(f"Vest alert: {persons - vests} person(s) may be without safety vests.")

        if not supports_shoes:
            alerts.append("Safety shoe status unavailable: class not present in current model.")
        elif no_shoes > 0:
            alerts.append(f"Safety shoe alert: {no_shoes} person(s) detected without safety shoes/boots.")
        elif shoes < persons:
            alerts.append(f"Safety shoe alert: {persons - shoes} person(s) may be without safety shoes/boots.")

        if gloves_required:
            if not supports_gloves:
                alerts.append(f"Glove status unavailable for task '{task_type}': class not present in current model.")
            elif no_gloves > 0:
                alerts.append(f"Glove alert ({task_type}): {no_gloves} person(s) detected without gloves.")
            elif gloves < persons:
                alerts.append(f"Glove alert ({task_type}): {persons - gloves} person(s) may be without gloves.")
            else:
                alerts.append(f"Glove check passed for task '{task_type}'.")
        else:
            alerts.append(f"Glove check not mandatory for task '{task_type}'.")

        if is_height_work:
            if not supports_harness:
                alerts.append("Harness status unavailable for height work: class not present in current model.")
            elif no_harnesses > 0:
                alerts.append(f"Harness alert (height work): {no_harnesses} person(s) detected without harness.")
            elif harnesses < persons:
                alerts.append(f"Harness alert (height work): {persons - harnesses} person(s) may be without harness.")
            else:
                alerts.append("Harness check passed for height-related work.")
        else:
            alerts.append("Harness check not mandatory (height work disabled).")

        shoes_ok = shoes >= persons if supports_shoes else True
        if helmets >= persons and vests >= persons and shoes_ok:
            alerts.append("Base PPE check passed for detected persons (helmet + vest + safety shoes).")

    return DetectionSummary(
        class_counts=class_counts,
        persons=persons,
        helmets=helmets,
        vests=vests,
        shoes=shoes,
        gloves=gloves,
        harnesses=harnesses,
        alerts=alerts,
        supports_shoes=supports_shoes,
        supports_gloves=supports_gloves,
        supports_harness=supports_harness,
    )
