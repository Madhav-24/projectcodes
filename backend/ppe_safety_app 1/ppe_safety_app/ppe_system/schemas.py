"""Typed schemas for PPE detection requests and responses.

These dataclasses define stable I/O contracts for backend API integration and
frontend dashboard consumption.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional
import numpy as np


@dataclass
class DetectionRequest:
    """Input payload for single-frame PPE inspection.

    Parameters:
    - image: Image array in RGB or BGR format (H, W, C), dtype uint8 preferred.
    - site_name: Site label or address.
    - gps_coords: String formatted as "lat, lon".
    - camera_id: Camera/source identifier.
    - task_type: Current operation context (e.g., Welding).
    - is_height_work: Whether harness checks are mandatory.
    - confidence: Optional override for confidence threshold [0, 1].

    Returns:
    - Structured input object used by service pipeline.
    """

    image: np.ndarray
    site_name: str = ""
    gps_coords: str = ""
    camera_id: str = "Manual Entry"
    task_type: str = "General Work"
    is_height_work: bool = False
    confidence: Optional[float] = None


@dataclass
class DetectionSummary:
    """Per-frame detection summary generated from model output.

    Parameters:
    - class_counts: Label-to-count mapping for detected classes.
    - persons: Number of detected persons/workers.
    - helmets, vests, shoes, gloves, harnesses: PPE item counts.
    - alerts: Human-readable compliance messages.
    - supports_shoes, supports_gloves, supports_harness: Model capability flags.

    Returns:
    - Aggregated summary used for report formatting and API responses.
    """

    class_counts: Dict[str, int]
    persons: int
    helmets: int
    vests: int
    shoes: int
    gloves: int
    harnesses: int
    alerts: List[str] = field(default_factory=list)
    supports_shoes: bool = False
    supports_gloves: bool = False
    supports_harness: bool = False


@dataclass
class DetectionResponse:
    """Output payload for a processed frame.

    Parameters:
    - annotated_image_rgb: Annotated image in RGB format for UI rendering.
    - report_text: Multi-line human-readable report.
    - summary: Structured summary for API consumers.

    Returns:
    - Service response object consumed by UI and backend endpoints.
    """

    annotated_image_rgb: np.ndarray
    report_text: str
    summary: DetectionSummary
