// Module: PPE Socket Constants
// Purpose: Centralize WebSocket endpoint configuration for camera streaming.

export const PPE_CAMERA_WS_URL =
  import.meta.env.VITE_PPE_WS_URL || 'ws://localhost:8000/ws/camera';
