# Module: PPE Engine App
# Purpose: Expose FastAPI app and include PPE WebSocket routes from controller layer.

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.controllers.ppeController import router as ppe_router

app = FastAPI(title="PPE Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ppe_router)


@app.get("/health")
async def health() -> dict:
    return {
        "success": True,
        "message": "PPE Engine is healthy",
        "data": {
            "camera_ws": "/ws/camera",
            "frame_size": [480, 320],
            "frame_skip": 3,
        },
    }
