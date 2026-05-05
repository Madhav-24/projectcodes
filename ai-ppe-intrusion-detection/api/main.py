"""
FastAPI backend for the AI PPE & Intrusion Detection system.

Endpoints
---------
GET  /health                        – liveness check
POST /analyze/image                 – upload image → JSON detections
POST /analyze/video                 – upload video → JSON report + saves annotated MP4
GET  /results/report/{name}         – fetch saved JSON report (for dashboard)
GET  /results/download/{filename}   – download any saved file (MP4, JSON, …)
GET  /results/list                  – list all saved result files
WS   /ws/stream                     – WebSocket live frame-by-frame inference

Run
---
    cd ai-ppe-intrusion-detection
    uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
"""

import os
import sys
import json
import base64
import tempfile
import shutil
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from src.detectors.ppe_detector import PPEDetector
from src.detectors.intrusion_detector import IntrusionDetector
from src.utils.visualization import draw_detections

RESULTS_DIR    = ROOT / "data" / "processed" / "results"
PPE_WEIGHTS    = str(ROOT / "runs/detect/runs/train/ppe_model/weights/best.pt")
PERSON_WEIGHTS = str(ROOT / "yolo11n.pt")

RESULTS_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="PPE & Intrusion Detection API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("[API] Loading models …")
_detector = PPEDetector(
    weights=PPE_WEIGHTS, person_weights=PERSON_WEIGHTS,
    conf_threshold=0.25, person_conf=0.10, device="0",
)
_classifier = IntrusionDetector(ppe_detector=_detector)
print("[API] Models ready.")


# ── helpers ───────────────────────────────────────────────────────────────────

def _decode_upload(data: bytes) -> Optional[np.ndarray]:
    buf = np.frombuffer(data, dtype=np.uint8)
    return cv2.imdecode(buf, cv2.IMREAD_COLOR)

def _b64(frame: np.ndarray) -> str:
    _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
    return base64.b64encode(buf.tobytes()).decode("utf-8")

def _detection_list(results: list) -> list:
    out = []
    for r in results:
        person = r.get("person", {})
        ppe    = r.get("ppe", {})
        out.append({
            "label":      r.get("label", "Unknown"),
            "confidence": round(float(person.get("confidence", 0.0)), 3),
            "bbox":       [int(v) for v in person.get("bbox", [0, 0, 0, 0])],
            "ppe": {
                "helmet":        bool(ppe.get("helmet", False)),
                "vest":          bool(ppe.get("vest",   False)),
                "helmet_source": ppe.get("helmet_source"),
                "vest_source":   ppe.get("vest_source"),
            },
            "missing_ppe": r.get("missing_ppe", []),
        })
    return out


# ══════════════════════════════════════════════════════════════════════════════
# REST endpoints
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/health")
def health():
    return {"status": "ok", "models_loaded": True}


@app.post("/analyze/image")
async def analyze_image(file: UploadFile = File(...)):
    data  = await file.read()
    frame = _decode_upload(data)
    if frame is None:
        raise HTTPException(status_code=400, detail="Cannot decode image.")
    raw        = _classifier.process_frame(frame)
    detections = _detection_list(raw)
    workers    = [d for d in detections if d["label"] == "Worker"]
    intruders  = [d for d in detections if d["label"] == "Intruder"]
    return {
        "source":        file.filename,
        "total_persons": len(detections),
        "workers":       len(workers),
        "intruders":     len(intruders),
        "alert":         len(intruders) > 0,
        "detections":    detections,
    }


@app.post("/analyze/video")
async def analyze_video(file: UploadFile = File(...)):
    suffix = Path(file.filename).suffix
    tmp    = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    shutil.copyfileobj(file.file, tmp); tmp.close()

    vid_name = Path(file.filename).stem
    out_vid  = str(RESULTS_DIR / f"output_{file.filename}")

    cap = cv2.VideoCapture(tmp.name)
    if not cap.isOpened():
        os.unlink(tmp.name)
        raise HTTPException(status_code=400, detail="Cannot open video.")

    w, h   = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps    = cap.get(cv2.CAP_PROP_FPS) or 25.0
    writer = cv2.VideoWriter(out_vid, cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h))

    frame_id = 0
    peak_workers = peak_intruders = intruder_frames = 0
    w_total = w_helmet = w_vest = w_both = 0
    timeline        = []
    intruder_events = []

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        raw        = _classifier.process_frame(frame)
        detections = _detection_list(raw)
        annotated  = draw_detections(frame, raw)
        ts         = round(frame_id / fps, 2)

        workers_now   = sum(1 for d in detections if d["label"] == "Worker")
        intruders_now = sum(1 for d in detections if d["label"] == "Intruder")

        for d in detections:
            if d["label"] == "Worker":
                w_total  += 1
                w_helmet += int(d["ppe"]["helmet"])
                w_vest   += int(d["ppe"]["vest"])
                w_both   += int(d["ppe"]["helmet"] and d["ppe"]["vest"])

        peak_workers   = max(peak_workers,   workers_now)
        peak_intruders = max(peak_intruders, intruders_now)
        if intruders_now > 0:
            intruder_frames += 1
            intruder_events.append({"frame": frame_id, "time_s": ts, "count": intruders_now})

        timeline.append({"frame": frame_id, "time_s": ts,
                         "persons": len(detections), "workers": workers_now, "intruders": intruders_now})
        writer.write(annotated)
        frame_id += 1

    cap.release(); writer.release(); os.unlink(tmp.name)

    report = {
        "source":           file.filename,
        "frames_processed": frame_id,
        "duration_s":       round(frame_id / fps, 1),
        "fps":              round(fps, 2),
        "resolution":       f"{w}x{h}",
        "summary": {
            "peak_workers":       peak_workers,
            "peak_intruders":     peak_intruders,
            "alert":              peak_intruders > 0,
            "intruder_frames":    intruder_frames,
            "intruder_frame_pct": round(intruder_frames * 100 / max(frame_id, 1), 1),
        },
        "ppe_compliance": {
            "total_worker_detections": w_total,
            "helmet_worn_pct":    round(w_helmet * 100 / max(w_total, 1), 1),
            "vest_worn_pct":      round(w_vest   * 100 / max(w_total, 1), 1),
            "fully_equipped_pct": round(w_both   * 100 / max(w_total, 1), 1),
            "missing_ppe_pct":    round((w_total - w_both) * 100 / max(w_total, 1), 1),
        },
        "intruder_events": intruder_events,
        "timeline":        timeline,
        "annotated_video_url": f"/results/download/output_{file.filename}",
        "report_url":          f"/results/report/{vid_name}",
    }

    # Persist report so it can be fetched later by the dashboard
    json_path = RESULTS_DIR / f"report_{vid_name}.json"
    json_path.write_text(json.dumps(report, indent=2))

    return report


# ── Serve saved reports / files ───────────────────────────────────────────────

@app.get("/results/report/{name}")
async def get_report(name: str):
    """
    Fetch the saved JSON report for a video by name (without extension).
    React dashboard calls this to populate the report page.
    """
    path = RESULTS_DIR / f"report_{name}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"No report found for '{name}'.")
    return JSONResponse(content=json.loads(path.read_text()))


@app.get("/results/list")
async def list_results():
    """List all saved result files with their URLs."""
    files = []
    for f in sorted(RESULTS_DIR.iterdir()):
        if f.is_file():
            files.append({
                "name":    f.name,
                "size_kb": round(f.stat().st_size / 1024, 1),
                "url":     f"/results/download/{f.name}",
            })
    return {"files": files}


@app.get("/results/download/{filename}")
async def download_result(filename: str):
    path = RESULTS_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {filename}")
    media = ("video/mp4"   if filename.endswith(".mp4")  else
             "application/json" if filename.endswith(".json") else
             "text/csv"    if filename.endswith(".csv")  else
             "application/octet-stream")
    return FileResponse(str(path), media_type=media, filename=filename)


# ══════════════════════════════════════════════════════════════════════════════
# WebSocket – live streaming
# ══════════════════════════════════════════════════════════════════════════════

@app.websocket("/ws/stream")
async def websocket_stream(websocket: WebSocket):
    """
    Send a JSON message: { "frame": "<base64 JPEG>", "return_annotated": true }
    Receive: { "frame_id", "workers", "intruders", "alert", "detections", "annotated_frame"? }
    """
    await websocket.accept()
    frame_id = 0
    try:
        while True:
            msg = await websocket.receive()
            return_annotated = False
            if "bytes" in msg and msg["bytes"]:
                raw_bytes = msg["bytes"]
            elif "text" in msg and msg["text"]:
                payload          = json.loads(msg["text"])
                raw_bytes        = base64.b64decode(payload.get("frame", ""))
                return_annotated = bool(payload.get("return_annotated", False))
            else:
                continue

            frame = _decode_upload(raw_bytes)
            if frame is None:
                await websocket.send_json({"error": "Cannot decode frame", "frame_id": frame_id})
                continue

            raw        = _classifier.process_frame(frame)
            detections = _detection_list(raw)
            workers    = sum(1 for d in detections if d["label"] == "Worker")
            intruders  = sum(1 for d in detections if d["label"] == "Intruder")

            response = {
                "frame_id":      frame_id,
                "total_persons": len(detections),
                "workers":       workers,
                "intruders":     intruders,
                "alert":         intruders > 0,
                "detections":    detections,
            }
            if return_annotated:
                response["annotated_frame"] = _b64(draw_detections(frame, raw))

            await websocket.send_json(response)
            frame_id += 1

    except WebSocketDisconnect:
        print(f"[WS] Client disconnected after {frame_id} frames.")
