# Module: PPE Capture Service
# Purpose: Run a webcam capture loop and keep only the latest frames in a bounded queue.

from __future__ import annotations

import queue
import threading
import time
from typing import Optional

import cv2
import numpy as np

from backend.utils.image_utils import resize_frame


class WebcamCaptureService:
    def __init__(
        self,
        camera_index: int = 0,
        width: int = 480,
        height: int = 320,
        capture_fps: int = 20,
        queue_size: int = 2,
    ) -> None:
        self._camera_index = camera_index
        self._width = width
        self._height = height
        self._capture_fps = capture_fps
        self._frame_queue: queue.Queue[np.ndarray] = queue.Queue(maxsize=queue_size)
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._cap: Optional[cv2.VideoCapture] = None

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run_capture_loop, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=2)
        if self._cap is not None:
            self._cap.release()
            self._cap = None
        with self._frame_queue.mutex:
            self._frame_queue.queue.clear()

    def read_latest_frame(self, timeout: float = 0.2) -> Optional[np.ndarray]:
        try:
            return self._frame_queue.get(timeout=timeout)
        except queue.Empty:
            return None

    def _run_capture_loop(self) -> None:
        self._cap = cv2.VideoCapture(self._camera_index)
        if not self._cap.isOpened():
            return

        self._cap.set(cv2.CAP_PROP_FRAME_WIDTH, self._width)
        self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self._height)
        self._cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        frame_interval = 1.0 / max(1, self._capture_fps)

        while not self._stop_event.is_set():
            tick = time.perf_counter()
            ok, frame = self._cap.read()
            if not ok:
                time.sleep(0.01)
                continue

            frame = resize_frame(frame, self._width, self._height)

            if self._frame_queue.full():
                try:
                    self._frame_queue.get_nowait()
                except queue.Empty:
                    pass

            try:
                self._frame_queue.put_nowait(frame)
            except queue.Full:
                pass

            elapsed = time.perf_counter() - tick
            sleep_for = frame_interval - elapsed
            if sleep_for > 0:
                time.sleep(sleep_for)
