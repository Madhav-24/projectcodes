"""Production-ready PPE detection package.

This package exposes reusable service APIs for image and batch PPE detection
that can be integrated into web backends, real-time streams, and UI layers.
"""

from .service import detect_image, detect_batch, get_model_metadata

__all__ = ["detect_image", "detect_batch", "get_model_metadata"]
