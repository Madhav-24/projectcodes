# Module: Image Utils
# Purpose: Shared frame resize and base64 encode helpers for the PPE stream pipeline.

from __future__ import annotations

import base64

import cv2
import numpy as np


def resize_frame(frame_bgr: np.ndarray, width: int = 480, height: int = 320) -> np.ndarray:
    return cv2.resize(frame_bgr, (width, height))


def encode_jpeg_base64(frame_bgr: np.ndarray, jpeg_quality: int = 40) -> str:
    ok, buffer = cv2.imencode(".jpg", frame_bgr, [cv2.IMWRITE_JPEG_QUALITY, jpeg_quality])
    if not ok:
        raise RuntimeError("Failed to encode JPEG frame")
    return base64.b64encode(buffer).decode("utf-8")
