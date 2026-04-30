# Module: PPE Tracker Service
# Purpose: Assign stable person IDs using centroid matching and expire stale identities.

from __future__ import annotations

import math
import time
from dataclasses import dataclass
from typing import Dict, List, Tuple

BBox = Tuple[float, float, float, float]


@dataclass
class TrackedPerson:
    person_id: int
    bbox: BBox


class PersonTrackerService:
    def __init__(self, max_age_seconds: int = 30, max_distance: float = 80.0) -> None:
        self._max_age_seconds = max_age_seconds
        self._max_distance = max_distance
        self._next_id = 1
        self._tracks: Dict[int, Tuple[float, float, float]] = {}

    def update(self, person_boxes: List[BBox], now_ts: float | None = None) -> List[TrackedPerson]:
        now_ts = now_ts or time.time()
        self._expire_stale_tracks(now_ts)

        assigned_ids: set[int] = set()
        tracked_people: List[TrackedPerson] = []

        for bbox in person_boxes:
            cx, cy = self._centroid(bbox)
            person_id = self._match_existing_id(cx, cy, assigned_ids)
            if person_id is None:
                person_id = self._next_id
                self._next_id += 1

            self._tracks[person_id] = (cx, cy, now_ts)
            assigned_ids.add(person_id)
            tracked_people.append(TrackedPerson(person_id=person_id, bbox=bbox))

        return tracked_people

    def _match_existing_id(self, cx: float, cy: float, assigned_ids: set[int]) -> int | None:
        best_id = None
        best_distance = float("inf")

        for person_id, (tx, ty, _) in self._tracks.items():
            if person_id in assigned_ids:
                continue

            distance = math.hypot(cx - tx, cy - ty)
            if distance <= self._max_distance and distance < best_distance:
                best_distance = distance
                best_id = person_id

        return best_id

    def _expire_stale_tracks(self, now_ts: float) -> None:
        stale_ids = [
            person_id
            for person_id, (_, _, last_seen) in self._tracks.items()
            if now_ts - last_seen > self._max_age_seconds
        ]
        for person_id in stale_ids:
            del self._tracks[person_id]

    @staticmethod
    def _centroid(bbox: BBox) -> Tuple[float, float]:
        x1, y1, x2, y2 = bbox
        return (x1 + x2) / 2.0, (y1 + y2) / 2.0
