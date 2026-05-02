# Module: PPE Capture Service
# Purpose: Provide stable real-time camera capture (webcam or RTSP) with fallback backends,
# latest-frame queueing, frame validation, and auto-reconnect.

from __future__ import annotations

import logging
import queue
import threading
import time
from dataclasses import dataclass
from typing import Optional

import cv2
import numpy as np

from backend.utils.image_utils import resize_frame

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class _CaptureCandidate:
    label: str
    source: int | str
    backend: Optional[int]


class WebcamCaptureService:
    def __init__(
        self,
        camera_index: int = 0,
        width: int = 480,
        height: int = 320,
        capture_fps: int = 20,
        queue_size: int = 1,
        camera_source: Optional[int | str] = None,
        reconnect_interval_seconds: float = 2.0,
        max_read_failures: int = 25,
        fps_log_interval_seconds: float = 5.0,
    ) -> None:
        self._source = camera_source if camera_source is not None else camera_index
        self._width = width
        self._height = height
        self._capture_fps = max(1, int(capture_fps))
        # Always keep only the latest frame to avoid lag/backpressure.
        self._frame_queue: queue.Queue[np.ndarray] = queue.Queue(maxsize=1)
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._cap: Optional[cv2.VideoCapture] = None
        self._active_candidate: Optional[_CaptureCandidate] = None

        self._reconnect_interval_seconds = max(0.5, reconnect_interval_seconds)
        self._max_read_failures = max(5, int(max_read_failures))
        self._fps_log_interval_seconds = max(1.0, fps_log_interval_seconds)

        if queue_size != 1:
            logger.warning(
                "capture.queue_size=%s requested, forcing queue_size=1 for latest-frame pipeline",
                queue_size,
            )

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            logger.debug("Capture service already running")
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run_capture_loop, daemon=True, name="ppe-capture")
        self._thread.start()
        logger.info("Capture service started (source=%s)", self._source)

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=3)
            self._thread = None
        self._release_capture()
        self._clear_queue()
        logger.info("Capture service stopped")

    def read_latest_frame(self, timeout: float = 0.2) -> Optional[np.ndarray]:
        try:
            return self._frame_queue.get(timeout=timeout)
        except queue.Empty:
            return None

    def _run_capture_loop(self) -> None:
        frame_interval = 1.0 / self._capture_fps
        consecutive_failures = 0
        frames_in_window = 0
        fps_window_start = time.monotonic()

        while not self._stop_event.is_set():
            if self._cap is None:
                opened = self._open_capture_with_fallbacks()
                if not opened:
                    logger.error(
                        "Camera open failed for source=%s, retrying in %.1fs",
                        self._source,
                        self._reconnect_interval_seconds,
                    )
                    self._sleep_with_stop(self._reconnect_interval_seconds)
                    continue

                consecutive_failures = 0
                frames_in_window = 0
                fps_window_start = time.monotonic()

            tick = time.perf_counter()
            ok, frame = self._cap.read()

            if not self._is_valid_frame(ok, frame):
                consecutive_failures += 1
                if consecutive_failures == 1 or consecutive_failures % 5 == 0:
                    logger.warning(
                        "Frame read failure (attempt=%d, source=%s, backend=%s)",
                        consecutive_failures,
                        self._active_candidate.source if self._active_candidate else self._source,
                        self._active_candidate.label if self._active_candidate else "unknown",
                    )

                if consecutive_failures >= self._max_read_failures:
                    logger.error(
                        "Too many frame failures (%d). Reconnecting in %.1fs",
                        consecutive_failures,
                        self._reconnect_interval_seconds,
                    )
                    self._release_capture()
                    self._sleep_with_stop(self._reconnect_interval_seconds)
                    continue

                self._sleep_with_stop(0.01)
                continue

            consecutive_failures = 0

            frame = resize_frame(frame, self._width, self._height)
            self._push_latest_frame(frame)
            frames_in_window += 1

            now = time.monotonic()
            window_elapsed = now - fps_window_start
            if window_elapsed >= self._fps_log_interval_seconds:
                fps = frames_in_window / max(window_elapsed, 1e-6)
                logger.info(
                    "Capture FPS=%.2f (source=%s, backend=%s)",
                    fps,
                    self._active_candidate.source if self._active_candidate else self._source,
                    self._active_candidate.label if self._active_candidate else "unknown",
                )
                frames_in_window = 0
                fps_window_start = now

            elapsed = time.perf_counter() - tick
            sleep_for = frame_interval - elapsed
            if sleep_for > 0:
                self._sleep_with_stop(sleep_for)

        self._release_capture()

    def _open_capture_with_fallbacks(self) -> bool:
        candidates = self._build_candidates()

        for candidate in candidates:
            if self._stop_event.is_set():
                return False

            cap = self._open_candidate(candidate)
            if cap is None:
                continue

            self._cap = cap
            self._active_candidate = candidate
            logger.info(
                "Camera opened successfully (source=%s, backend=%s)",
                candidate.source,
                candidate.label,
            )
            return True

        self._active_candidate = None
        return False

    def _open_candidate(self, candidate: _CaptureCandidate) -> Optional[cv2.VideoCapture]:
        logger.info("Trying camera source=%s backend=%s", candidate.source, candidate.label)
        try:
            if candidate.backend is None:
                cap = cv2.VideoCapture(candidate.source)
            else:
                cap = cv2.VideoCapture(candidate.source, candidate.backend)
        except Exception as exc:
            logger.exception(
                "VideoCapture constructor failed for source=%s backend=%s: %s",
                candidate.source,
                candidate.label,
                exc,
            )
            return None

        if not cap or not cap.isOpened():
            if cap is not None:
                cap.release()
            logger.warning("Camera open failed (source=%s, backend=%s)", candidate.source, candidate.label)
            return None

        self._apply_capture_properties(cap)
        return cap

    def _apply_capture_properties(self, cap: cv2.VideoCapture) -> None:
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, float(self._width))
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, float(self._height))
        cap.set(cv2.CAP_PROP_FPS, float(self._capture_fps))

    def _build_candidates(self) -> list[_CaptureCandidate]:
        if isinstance(self._source, str):
            source = self._source.strip()
            if self._looks_rtsp(source):
                return [
                    _CaptureCandidate("CAP_FFMPEG", source, cv2.CAP_FFMPEG),
                    _CaptureCandidate("CAP_ANY", source, None),
                ]

            if source.isdigit():
                return self._build_webcam_candidates(int(source))

            return [
                _CaptureCandidate("CAP_FFMPEG", source, cv2.CAP_FFMPEG),
                _CaptureCandidate("CAP_ANY", source, None),
            ]

        return self._build_webcam_candidates(int(self._source))

    def _build_webcam_candidates(self, preferred_index: int) -> list[_CaptureCandidate]:
        indexes = [preferred_index, 0, 1, 2]
        unique_indexes = []
        for idx in indexes:
            if idx not in unique_indexes:
                unique_indexes.append(idx)

        backends: list[tuple[str, Optional[int]]] = [
            ("CAP_DSHOW", cv2.CAP_DSHOW),
            ("CAP_MSMF", cv2.CAP_MSMF),
            ("CAP_FFMPEG", cv2.CAP_FFMPEG),
            ("CAP_ANY", None),
        ]

        candidates: list[_CaptureCandidate] = []
        for idx in unique_indexes:
            for label, backend in backends:
                candidates.append(_CaptureCandidate(label, idx, backend))
        return candidates

    def _push_latest_frame(self, frame: np.ndarray) -> None:
        if self._frame_queue.full():
            try:
                self._frame_queue.get_nowait()
            except queue.Empty:
                pass

        try:
            self._frame_queue.put_nowait(frame)
        except queue.Full:
            pass

    def _release_capture(self) -> None:
        if self._cap is not None:
            try:
                self._cap.release()
            except Exception:
                logger.exception("Error while releasing camera")
            finally:
                self._cap = None
                self._active_candidate = None

    def _clear_queue(self) -> None:
        with self._frame_queue.mutex:
            self._frame_queue.queue.clear()

    def _sleep_with_stop(self, seconds: float) -> None:
        self._stop_event.wait(timeout=max(0.0, seconds))

    @staticmethod
    def _looks_rtsp(source: str) -> bool:
        lowered = source.lower()
        return lowered.startswith("rtsp://") or lowered.startswith("rtsps://")

    @staticmethod
    def _is_valid_frame(ok: bool, frame: Optional[np.ndarray]) -> bool:
        if not ok:
            return False
        if frame is None:
            return False
        if not isinstance(frame, np.ndarray):
            return False
        if frame.size == 0:
            return False
        if len(frame.shape) < 2:
            return False

        height, width = frame.shape[:2]
        if height <= 0 or width <= 0:
            return False
        return True
