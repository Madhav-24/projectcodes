"""Camera site registry and helper functions.

Input format:
- camera_id: str

Output format:
- dict with keys: "site" and "gps"
"""

from __future__ import annotations

from typing import Dict

CAMERA_REGISTRY: Dict[str, Dict[str, str]] = {
    "Manual Entry": {"site": "", "gps": ""},
    "CAM-001 | MG Road Junction": {
        "site": "MG Road Junction, Road Works Zone A",
        "gps": "12.975161, 77.606476",
    },
    "CAM-002 | Brigade Road Flyover": {
        "site": "Brigade Road Flyover Construction Site",
        "gps": "12.971566, 77.607048",
    },
    "CAM-003 | Outer Ring Road Widening": {
        "site": "Outer Ring Road Widening, Sector 3",
        "gps": "12.935944, 77.624207",
    },
    "CAM-004 | NH-48 Underpass": {
        "site": "NH-48 Underpass Construction, Km 14",
        "gps": "12.890000, 77.580000",
    },
}


def resolve_camera_context(camera_id: str) -> Dict[str, str]:
    """Return site metadata for a known camera id.

    Parameters:
    - camera_id: Camera/source identifier from UI or API payload.

    Returns:
    - Dict with fields: {"site": str, "gps": str}.
      Empty values are returned when camera id is unknown.
    """
    return CAMERA_REGISTRY.get(camera_id, {"site": "", "gps": ""})
