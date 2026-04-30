# Module: Schemas
# Purpose: Define shared data contracts for detection pipeline and WebSocket output.

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Sequence


@dataclass
class DetectionBox:
    label: str
    confidence: float
    xyxy: Sequence[float]


@dataclass
class ViolationEvent:
    violation: str
    confidence: float


@dataclass
class FrameOutput:
    frame_b64: str
    violations: List[ViolationEvent]


@dataclass
class AlertPayload:
    date: str
    time: str
    violation: str
    confidence: float
    description: str

    def to_ws_message(self) -> dict:
        return {
            "type": "alert",
            "data": {
                "date": self.date,
                "time": self.time,
                "violation": self.violation,
                "confidence": round(self.confidence, 3),
                "description": self.description,
            },
        }
