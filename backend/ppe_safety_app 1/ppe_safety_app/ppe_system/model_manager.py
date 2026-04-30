"""Lazy-loading model manager with device-aware inference.

This module centralizes model initialization so model weights are loaded once
per process and reused across all requests.
"""

from __future__ import annotations

from threading import Lock
from typing import List, Sequence

import numpy as np
import torch
from ultralytics import YOLO


class ModelManager:
    """Thread-safe lazy model wrapper.

    Parameters:
    - model_path: Filesystem path to model weights.

    Returns:
    - Manager exposing single and batch inference methods.
    """

    def __init__(self, model_path: str) -> None:
        self.model_path = model_path
        self._model = None
        self._lock = Lock()
        self._device = "cuda" if torch.cuda.is_available() else "cpu"

    @property
    def device(self) -> str:
        """Return active device name for inference."""
        return self._device

    def _ensure_model(self) -> YOLO:
        """Load model exactly once and return it.

        Returns:
        - Initialized Ultralytics YOLO model.
        """
        if self._model is None:
            with self._lock:
                if self._model is None:
                    model = YOLO(self.model_path, task="detect")
                    if self.model_path.lower().endswith((".pt", ".pth")):
                        model.to(self._device)
                    self._model = model
        return self._model

    def get_class_labels(self) -> List[str]:
        """Return normalized class labels exposed by the model."""
        model = self._ensure_model()
        names = model.names
        if isinstance(names, dict):
            labels = [str(value).strip().lower() for value in names.values()]
        elif isinstance(names, list):
            labels = [str(value).strip().lower() for value in names]
        else:
            labels = []
        return labels

    def infer_one(self, image: np.ndarray, confidence: float):
        """Run model inference on one frame.

        Parameters:
        - image: Input frame as numpy array.
        - confidence: Detection confidence threshold.

        Returns:
        - First Ultralytics result object.
        """
        model = self._ensure_model()
        results = model.predict(
            source=image,
            conf=confidence,
            verbose=False,
            device=self._device,
        )
        return results[0]

    def infer_batch(self, images: Sequence[np.ndarray], confidence: float):
        """Run inference for multiple frames in a single model call.

        Parameters:
        - images: Sequence of image frames.
        - confidence: Detection confidence threshold.

        Returns:
        - List of Ultralytics result objects in the same order as input.
        """
        model = self._ensure_model()
        return model.predict(
            source=list(images),
            conf=confidence,
            verbose=False,
            device=self._device,
        )


_MANAGER_REGISTRY = {}
_MANAGER_LOCK = Lock()


def get_model_manager(model_path: str) -> ModelManager:
    """Return a process-level singleton model manager for the given path.

    Parameters:
    - model_path: Path to weights file.

    Returns:
    - Reused ModelManager instance.
    """
    with _MANAGER_LOCK:
        manager = _MANAGER_REGISTRY.get(model_path)
        if manager is None:
            manager = ModelManager(model_path=model_path)
            _MANAGER_REGISTRY[model_path] = manager
    return manager
