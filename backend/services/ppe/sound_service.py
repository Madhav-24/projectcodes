# Module: PPE Sound Service
# Purpose: Play alert sound asynchronously so the realtime loop remains non-blocking.

from __future__ import annotations

import threading
from pathlib import Path

SOUND_FILE_PATH = Path(r"C:\Users\MADHAV\Downloads\test\src\notification_sound\notification.mp3")
_mixer_ready = False
_mixer_lock = threading.Lock()


def play_alert_sound() -> None:
    threading.Thread(target=_play_worker, daemon=True).start()


def _play_worker() -> None:
    if not SOUND_FILE_PATH.exists():
        return
    if not _init_mixer_once():
        return

    try:
        import pygame

        pygame.mixer.music.load(str(SOUND_FILE_PATH))
        pygame.mixer.music.play()
    except Exception:
        return


def _init_mixer_once() -> bool:
    global _mixer_ready
    with _mixer_lock:
        if _mixer_ready:
            return True
        try:
            import pygame

            pygame.mixer.init()
            _mixer_ready = True
            return True
        except Exception:
            return False
