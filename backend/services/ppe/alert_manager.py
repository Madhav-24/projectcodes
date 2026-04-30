# Module: PPE Alert Manager
# Purpose: Prevent duplicate alerts for the same person during the tracking window.

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Dict

from backend.utils.time_utils import get_current_date_time


@dataclass
class AlertEvent:
    person_id: int
    violation: str


class AlertManagerService:
    def __init__(self, person_ttl_seconds: int = 30) -> None:
        self._person_ttl_seconds = person_ttl_seconds
        self._sent_at: Dict[int, datetime] = {}

    def build_alert_if_new(self, event: AlertEvent) -> dict | None:
        now = datetime.now()
        self._cleanup_expired(now)

        if event.person_id in self._sent_at:
            return None

        self._sent_at[event.person_id] = now
        date_text, time_text = get_current_date_time()
        return {
            "type": "alert",
            "data": {
                "date": date_text,
                "time": time_text,
                "person_id": event.person_id,
                "violation": event.violation,
                "description": "Worker not wearing PPE",
            },
        }

    def _cleanup_expired(self, now: datetime) -> None:
        expired_ids = [
            person_id
            for person_id, created_at in self._sent_at.items()
            if (now - created_at).total_seconds() > self._person_ttl_seconds
        ]
        for person_id in expired_ids:
            del self._sent_at[person_id]
