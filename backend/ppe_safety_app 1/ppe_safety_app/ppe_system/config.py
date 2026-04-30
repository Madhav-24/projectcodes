"""Runtime configuration for PPE inference services.

Configuration values can be provided through environment variables to support
local development, containerized deployment, and CI/CD environments.
"""

from __future__ import annotations

from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    """Application runtime settings.

    Parameters:
    - model_path: Path to ONNX or PyTorch model.
    - default_confidence: Detection confidence threshold in [0, 1].
    - host: Host for local UI server.
    - port: Port for local UI server.

    Returns:
    - Immutable configuration object.
    """

    model_path: str = "best.onnx"
    default_confidence: float = 0.65
    host: str = "127.0.0.1"
    port: int = 7860


def load_settings() -> Settings:
    """Load runtime settings from environment variables.

    Environment variables:
    - PPE_MODEL_PATH
    - PPE_CONFIDENCE
    - PPE_SERVER_HOST
    - PPE_SERVER_PORT

    Returns:
    - Settings instance with validated values and defaults.
    """
    model_path = os.getenv("PPE_MODEL_PATH", "best.onnx")

    try:
        default_confidence = float(os.getenv("PPE_CONFIDENCE", "0.65"))
    except ValueError:
        default_confidence = 0.5

    default_confidence = min(max(default_confidence, 0.0), 1.0)

    host = os.getenv("PPE_SERVER_HOST", "127.0.0.1")

    try:
        port = int(os.getenv("PPE_SERVER_PORT", "7860"))
    except ValueError:
        port = 7860

    return Settings(
        model_path=model_path,
        default_confidence=default_confidence,
        host=host,
        port=port,
    )
