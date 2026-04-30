"""Public PPE detection service APIs.

This module provides production-oriented entry points for single-frame and
batch-frame inference, suitable for backend API handlers and worker pipelines.
"""

from __future__ import annotations

from typing import List, Sequence

import cv2
import numpy as np

from .config import load_settings
from .model_manager import get_model_manager
from .ppe_analyzer import analyze_result
from .reporting import build_text_report
from .schemas import DetectionRequest, DetectionResponse


def _resolve_confidence(override: float | None) -> float:
    """Resolve effective confidence threshold from request/env settings."""
    settings = load_settings()
    if override is None:
        return settings.default_confidence
    return min(max(float(override), 0.0), 1.0)


def _annotate_to_rgb(result) -> np.ndarray:
    """Convert plotted detections to RGB image expected by web frontends."""
    plotted_bgr = result.plot()
    return cv2.cvtColor(plotted_bgr, cv2.COLOR_BGR2RGB)


def detect_image(request: DetectionRequest) -> DetectionResponse:
    """Run PPE detection for a single image.

    Parameters:
    - request: DetectionRequest containing image and inspection context.

    Returns:
    - DetectionResponse with annotated RGB image, report text, and structured summary.
    """
    if request.image is None:
        raise ValueError("request.image must not be None")

    settings = load_settings()
    manager = get_model_manager(settings.model_path)

    confidence = _resolve_confidence(request.confidence)
    result = manager.infer_one(request.image, confidence=confidence)

    summary = analyze_result(
        result=result,
        task_type=request.task_type,
        is_height_work=request.is_height_work,
    )
    report = build_text_report(request=request, summary=summary)
    annotated = _annotate_to_rgb(result)

    return DetectionResponse(
        annotated_image_rgb=annotated,
        report_text=report,
        summary=summary,
    )


def detect_batch(requests: Sequence[DetectionRequest]) -> List[DetectionResponse]:
    """Run PPE detection for multiple frames in batch.

    Parameters:
    - requests: Ordered sequence of DetectionRequest objects.

    Returns:
    - List of DetectionResponse objects aligned with input order.
    """
    if not requests:
        return []

    for req in requests:
        if req.image is None:
            raise ValueError("all requests must include image data")

    settings = load_settings()
    manager = get_model_manager(settings.model_path)

    # Use one confidence across the batch for efficient model execution.
    batch_confidence = _resolve_confidence(requests[0].confidence)
    images = [req.image for req in requests]
    results = manager.infer_batch(images=images, confidence=batch_confidence)

    responses: List[DetectionResponse] = []
    for req, result in zip(requests, results):
        summary = analyze_result(
            result=result,
            task_type=req.task_type,
            is_height_work=req.is_height_work,
        )
        report = build_text_report(request=req, summary=summary)
        annotated = _annotate_to_rgb(result)
        responses.append(
            DetectionResponse(
                annotated_image_rgb=annotated,
                report_text=report,
                summary=summary,
            )
        )
    return responses


def get_model_metadata() -> dict:
    """Return model metadata useful for health checks and API discovery.

    Returns:
    - Dict with model path, execution device, and class labels.
    """
    settings = load_settings()
    manager = get_model_manager(settings.model_path)
    labels = manager.get_class_labels()
    return {
        "model_path": settings.model_path,
        "device": manager.device,
        "labels": labels,
    }
