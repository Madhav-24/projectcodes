# Module: PPE Renderer Service
# Purpose: Draw only red violation overlays and no confidence/person labels.

from __future__ import annotations

from typing import List

import cv2
import numpy as np

from backend.services.ppe.ppe_logic import PersonViolation


def draw_violation_overlay(frame_bgr: np.ndarray, violations: List[PersonViolation]) -> np.ndarray:
    output = frame_bgr.copy()

    for item in violations:
        if not item.violation:
            continue

        x1, y1, x2, y2 = [int(v) for v in item.bbox]
        cv2.rectangle(output, (x1, y1), (x2, y2), (0, 0, 255), 2)

        label_text = item.violation
        (label_width, label_height), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        label_x2 = min(x1 + label_width + 10, output.shape[1] - 1)
        label_y1 = max(y1 - label_height - 12, 0)
        label_y2 = max(y1 - 2, label_height + 2)

        cv2.rectangle(output, (x1, label_y1), (label_x2, label_y2), (0, 0, 255), -1)
        cv2.putText(
            output,
            label_text,
            (x1 + 5, max(label_y2 - 6, 12)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (255, 255, 255),
            1,
        )

    return output
