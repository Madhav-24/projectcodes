import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import PageShell from '../../components/layout/PageShell.jsx';
import cameraWebSocketService from '../../services/websocket.js';
import { useAlertContext } from '../../context/AlertContext.jsx';
import { PPE_CAMERA_WS_URL } from '../../constants/ppeSocket.js';
import notificationSound from '../../notification_sound/notification.mp3';
import { markWsAlertShown } from '../../services/ppeAlertDedup.js';

const SOUND_PREF_KEY = 'construction:alert-sound-enabled';

function isSoundEnabled() {
  try {
    const raw = window.localStorage.getItem(SOUND_PREF_KEY);
    return raw === null ? true : raw === 'true';
  } catch {
    return true;
  }
}

// Module: Admin Camera Page
// Purpose: Start live PPE detection while camera page is mounted.

function AdminCamera() {
  const [frameSrc, setFrameSrc] = useState('');
  const [status, setStatus] = useState('disconnected');
  const { addAlert } = useAlertContext();
  const audioRef = useRef(typeof Audio !== 'undefined' ? new Audio(notificationSound) : null);

  useEffect(() => {
    cameraWebSocketService.connect();

    const unsubFrame = cameraWebSocketService.subscribeFrame((payload) => {
      if (!payload?.image) {
        return;
      }
      setFrameSrc(`data:image/jpeg;base64,${payload.image}`);
    });

    const unsubAlert = cameraWebSocketService.subscribeAlert((alert) => {
      // 1. Update in-memory context so the Alerts page updates instantly.
      //    Persistent storage is handled server-side by the PPE engine ingest endpoint.
      addAlert(alert);

      // 2. Show immediate toast notification for the PPE violation.
      const violation = alert.violation || alert.description || 'PPE Violation Detected';
      toast.error(`PPE Violation: ${violation}`, {
        autoClose: 6000,
        toastId: `ppe-ws-${violation}-${Date.now()}`,
      });

      // 3. Register this violation so the polling path skips the duplicate toast.
      markWsAlertShown(violation);

      // 4. Play notification sound if enabled.
      if (isSoundEnabled() && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    });

    const unsubStatus = cameraWebSocketService.subscribeStatus((nextStatus) => {
      setStatus(nextStatus);
    });

    return () => {
      unsubFrame();
      unsubAlert();
      unsubStatus();
      cameraWebSocketService.close();
    };
  }, [addAlert]);

  return (
    <PageShell
      title="Live PPE Camera"
      description="Detection runs only while this page is open"
    >
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-black overflow-hidden shadow-card">
        <div className="px-4 py-2 bg-gray-900 text-gray-100 text-xs flex items-center justify-between">
          <span>WebSocket: {PPE_CAMERA_WS_URL}</span>
          <span className="capitalize">Status: {status}</span>
        </div>
        <div className="w-full aspect-video flex items-center justify-center">
          {frameSrc ? (
            <img src={frameSrc} alt="PPE live stream" className="w-full h-full object-contain" />
          ) : (
            <p className="text-gray-300 text-sm">Waiting for camera stream...</p>
          )}
        </div>
      </div>
    </PageShell>
  );
}

export default AdminCamera;
