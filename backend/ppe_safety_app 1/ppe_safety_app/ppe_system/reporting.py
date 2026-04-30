"""Report builders for PPE inspection output.

Provides human-readable report formatting from structured detection summaries.
"""

from __future__ import annotations

from datetime import datetime

from .schemas import DetectionRequest, DetectionSummary


def _status(summary: DetectionSummary, field: str, supported: bool, mandatory: bool = True, fallback: str = "Not detected") -> str:
    """Build a display status string for one PPE field."""
    if not mandatory:
        return fallback
    if not supported:
        return "Unavailable (class missing in model)"
    count = getattr(summary, field)
    return "Detected" if count > 0 else "Not detected"


def build_text_report(request: DetectionRequest, summary: DetectionSummary) -> str:
    """Create a formatted inspection report.

    Parameters:
    - request: DetectionRequest used for this frame.
    - summary: PPE summary generated from model output.

    Returns:
    - Multi-line plain text report for logs/UI output.
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    camera = request.camera_id.strip() if request.camera_id and request.camera_id.strip() else "Not specified"
    site = request.site_name.strip() if request.site_name and request.site_name.strip() else "Not specified"
    gps = request.gps_coords.strip() if request.gps_coords and request.gps_coords.strip() else "Not available"
    task = request.task_type.strip() if request.task_type and request.task_type.strip() else "General Work"
    height = "Yes" if request.is_height_work else "No"

    glove_mandatory = task.lower() in {
        "welding",
        "chemical handling",
        "electrical work",
        "material cutting/grinding",
        "heavy lifting",
    }

    shoe_status = _status(summary, "shoes", summary.supports_shoes)
    glove_status = _status(
        summary,
        "gloves",
        summary.supports_gloves,
        mandatory=glove_mandatory,
        fallback=f"Not mandatory for task '{task}'",
    )
    harness_status = _status(
        summary,
        "harnesses",
        summary.supports_harness,
        mandatory=request.is_height_work,
        fallback="Not mandatory (height work disabled)",
    )

    detected_classes = ", ".join(f"{label}: {count}" for label, count in sorted(summary.class_counts.items()))
    detected_classes = detected_classes if detected_classes else "None"

    return (
        "=== Road Safety & PPE Inspection Report ===\n"
        f"Date/Time    : {timestamp}\n"
        f"Camera       : {camera}\n"
        f"Site         : {site}\n"
        f"GPS          : {gps}\n"
        f"Task Context : {task}\n"
        f"Height Work  : {height}\n"
        "-------------------------------------------\n"
        f"Persons detected : {summary.persons}\n"
        f"Helmets detected : {summary.helmets}\n"
        f"Safety vests     : {summary.vests}\n"
        f"Safety shoes     : {summary.shoes}\n"
        f"Gloves detected  : {summary.gloves}\n"
        f"Harness detected : {summary.harnesses}\n"
        f"Safety shoes     : {shoe_status}\n"
        f"Safety gloves    : {glove_status}\n"
        f"Safety harness   : {harness_status}\n"
        f"Detected classes : {detected_classes}\n"
        "-------------------------------------------\n"
        "Alerts:\n"
        + "\n".join(f"  - {alert}" for alert in summary.alerts)
    )
