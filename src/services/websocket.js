import { PPE_CAMERA_WS_URL } from '../constants/ppeSocket.js';

// Module: Camera WebSocket Service
// Purpose: Share a single camera socket connection across UI subscribers.

class CameraWebSocketService {
  constructor() {
    this.socket = null;
    this.status = 'disconnected';
    this.frameSubscribers = new Set();
    this.alertSubscribers = new Set();
    this.statusSubscribers = new Set();
  }

  _emitStatus(status) {
    this.status = status;
    this.statusSubscribers.forEach((cb) => cb(status));
  }

  connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this._emitStatus('connecting');
    this.socket = new WebSocket(PPE_CAMERA_WS_URL);

    this.socket.onopen = () => {
      this._emitStatus('connected');
    };

    this.socket.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      if (msg.type === 'frame' && typeof msg.data === 'string') {
        this.frameSubscribers.forEach((cb) => cb({ image: msg.data, detections: msg.detections || [] }));
      }

      if (msg.type === 'frame' && typeof msg.image === 'string') {
        this.frameSubscribers.forEach((cb) => cb({ image: msg.image, detections: msg.detections || [] }));
      }

      if (msg.type === 'alert' && msg.data) {
        this.alertSubscribers.forEach((cb) => cb(msg.data));
      }

      if (msg.type === 'error') {
        this._emitStatus('error');
      }
    };

    this.socket.onerror = () => {
      this._emitStatus('error');
    };

    this.socket.onclose = () => {
      this._emitStatus('disconnected');
      this.socket = null;
    };
  }

  close() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this._emitStatus('disconnected');
  }

  subscribeFrame(callback) {
    this.frameSubscribers.add(callback);
    return () => this.frameSubscribers.delete(callback);
  }

  subscribeAlert(callback) {
    this.alertSubscribers.add(callback);
    return () => this.alertSubscribers.delete(callback);
  }

  subscribeStatus(callback) {
    this.statusSubscribers.add(callback);
    callback(this.status);
    return () => this.statusSubscribers.delete(callback);
  }
}

const cameraWebSocketService = new CameraWebSocketService();

export default cameraWebSocketService;
