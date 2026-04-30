# Module: PPE Logic Service
# Purpose: Deduce PPE compliance per tracked person and generate violation labels.

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Tuple

from backend.services.ppe.detection import (
    GLOVE_LABELS,
    HELMET_LABELS,
    NO_GLOVE_LABELS,
    NO_HELMET_LABELS,
    NO_VEST_LABELS,
    PERSON_LABELS,
    VEST_LABELS,
    DetectionBox,
)
from backend.services.ppe.tracker import TrackedPerson

BBox = Tuple[float, float, float, float]


@dataclass
class PersonViolation:
    person_id: int
    bbox: BBox
    violation: str | None


def extract_person_boxes(detections: List[DetectionBox]) -> List[BBox]:
    return [d.bbox for d in detections if d.label in PERSON_LABELS]


def evaluate_violations(tracked_people: List[TrackedPerson], detections: List[DetectionBox]) -> List[PersonViolation]:
    helmet_boxes = [d.bbox for d in detections if d.label in HELMET_LABELS]
    vest_boxes = [d.bbox for d in detections if d.label in VEST_LABELS]
    glove_boxes = [d.bbox for d in detections if d.label in GLOVE_LABELS]

    no_helmet_boxes = [d.bbox for d in detections if d.label in NO_HELMET_LABELS]
    no_vest_boxes = [d.bbox for d in detections if d.label in NO_VEST_LABELS]
    no_glove_boxes = [d.bbox for d in detections if d.label in NO_GLOVE_LABELS]

    results: List[PersonViolation] = []

    for person in tracked_people:
        has_helmet = _has_inside_item(person.bbox, helmet_boxes)
        has_vest = _has_inside_item(person.bbox, vest_boxes)
        has_glove = _has_inside_item(person.bbox, glove_boxes)

        if _has_inside_item(person.bbox, no_helmet_boxes):
            has_helmet = False
        if _has_inside_item(person.bbox, no_vest_boxes):
            has_vest = False
        if _has_inside_item(person.bbox, no_glove_boxes):
            has_glove = False

        missing_items: List[str] = []
        if not has_helmet:
            missing_items.append("no helmet")
        if not has_vest:
            missing_items.append("no vest")
        if not has_glove:
            missing_items.append("no glove")

        violation = _build_violation_text(missing_items)
        results.append(PersonViolation(person_id=person.person_id, bbox=person.bbox, violation=violation))

    return results


def _build_violation_text(missing_items: List[str]) -> str | None:
    if not missing_items:
        return None
    return ", ".join(missing_items)


def _has_inside_item(person_bbox: BBox, item_boxes: List[BBox]) -> bool:
    return any(_is_center_inside(person_bbox, item_bbox) for item_bbox in item_boxes)


def _is_center_inside(person_bbox: BBox, item_bbox: BBox) -> bool:
    px1, py1, px2, py2 = person_bbox
    ix1, iy1, ix2, iy2 = item_bbox
    center_x = (ix1 + ix2) / 2.0
    center_y = (iy1 + iy2) / 2.0
    return px1 <= center_x <= px2 and py1 <= center_y <= py2
