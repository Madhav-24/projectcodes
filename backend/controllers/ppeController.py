# Module: PPE Controller
# Purpose: Handle /ws/camera connection and orchestrate the PPE pipeline services.

from __future__ import annotations

import asyncio
import json
import os
import time
from pathlib import Path
from urllib import error as urllib_error
from urllib import request as urllib_request

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.services.ppe.alert_manager import AlertEvent, AlertManagerService
from backend.services.ppe.capture import WebcamCaptureService
from backend.services.ppe.detection import run_inference
from backend.services.ppe.ppe_logic import evaluate_violations, extract_person_boxes
from backend.services.ppe.renderer import draw_violation_overlay
from backend.services.ppe.sound_service import play_alert_sound
from backend.services.ppe.tracker import PersonTrackerService
from backend.utils.image_utils import encode_jpeg_base64

router = APIRouter()

FRAME_SKIP = 3
PERSON_TTL_SECONDS = 30
STREAM_DELAY_SECONDS = 0.10


def _load_local_env_file() -> None:
    """Load root .env for local runs where the PPE engine is started directly."""
    env_path = Path(__file__).resolve().parents[2] / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


_load_local_env_file()


def _ingest_config() -> tuple[str, str, str]:
    return (
        os.getenv("PPE_ALERT_API_URL", "http://localhost:4000/api/alerts/ppe"),
        os.getenv("PPE_INGEST_KEY", ""),
        os.getenv("PPE_ALERT_SITE", "All Sites"),
    )


def _persist_ppe_violation(violation: str, person_id: int) -> None:
    if not violation:
        return

    ppe_alert_api_url, ppe_ingest_key, ppe_alert_site = _ingest_config()

    payload = {
        "site": ppe_alert_site,
        "problem": violation,
        "severity": "Critical",
        "status": "Active",
        "senderName": "PPE Engine",
        "senderRole": "system",
        "personId": person_id,
    }
    encoded = json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if ppe_ingest_key:
        headers["x-ppe-ingest-key"] = ppe_ingest_key

    last_error = None
    for _ in range(3):
        req = urllib_request.Request(ppe_alert_api_url, data=encoded, headers=headers, method="POST")
        try:
            with urllib_request.urlopen(req, timeout=2.5):
                return
        except (urllib_error.HTTPError, urllib_error.URLError, TimeoutError) as exc:
            last_error = exc

    print(f"[PPE] Failed to persist violation '{violation}' for person {person_id}: {last_error}")


def _process_detection_frame(frame_bgr, tracker: PersonTrackerService):
    detections = run_inference(frame_bgr)
    tracked_people = tracker.update(extract_person_boxes(detections), now_ts=time.time())
    violations = evaluate_violations(tracked_people, detections)
    rendered_frame = draw_violation_overlay(frame_bgr, violations)

    frame_payload = {
        "type": "frame",
        "image": encode_jpeg_base64(rendered_frame, jpeg_quality=40),
        "detections": [
            {"person_id": item.person_id, "violation": item.violation}
            for item in violations
            if item.violation
        ],
    }
    return frame_payload, violations


@router.websocket("/ws/camera")
async def ws_camera(websocket: WebSocket) -> None:
    await websocket.accept()

    capture_service = WebcamCaptureService(
        camera_index=0,
        width=480,
        height=320,
        capture_fps=20,
        queue_size=2,
    )
    tracker_service = PersonTrackerService(max_age_seconds=PERSON_TTL_SECONDS)
    alert_manager_service = AlertManagerService(person_ttl_seconds=PERSON_TTL_SECONDS)

    capture_service.start()
    frame_counter = 0
    loop = asyncio.get_running_loop()

    try:
        while True:
            frame = capture_service.read_latest_frame(timeout=0.2)
            if frame is None:
                await asyncio.sleep(0.005)
                continue

            frame_counter += 1
            if frame_counter % FRAME_SKIP != 0:
                continue

            frame_payload, violations = await loop.run_in_executor(
                None,
                _process_detection_frame,
                frame,
                tracker_service,
            )

            await websocket.send_json(frame_payload)

            for item in violations:
                if not item.violation:
                    continue

                alert_payload = alert_manager_service.build_alert_if_new(
                    AlertEvent(person_id=item.person_id, violation=item.violation)
                )
                if alert_payload is None:
                    # Deduped — already persisted for this person+violation combo; skip.
                    continue

                # Persist to DB only for genuinely new (deduped) alerts.
                await loop.run_in_executor(
                    None,
                    _persist_ppe_violation,
                    item.violation,
                    item.person_id,
                )

                await websocket.send_json(alert_payload)
                play_alert_sound()

            await asyncio.sleep(STREAM_DELAY_SECONDS)

    except WebSocketDisconnect:
        pass
    finally:
        capture_service.stop()
