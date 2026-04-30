import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_PPE_WS_URL || 'ws://localhost:8000';

const STATUS_COLORS = {
  connecting: 'text-yellow-500',
  connected: 'text-green-500',
  error: 'text-red-500',
  disconnected: 'text-gray-400',
};

function ConnectionBadge({ status }) {
  const dots = {
    connecting: '⬤',
    connected: '⬤',
    error: '⬤',
    disconnected: '⬤',
  };
  return (
    <span className={`text-xs font-medium flex items-center gap-1 ${STATUS_COLORS[status] || 'text-gray-400'}`}>
      {dots[status]} {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

/**
 * PPELiveStream
 * Connects to the FastAPI WebSocket at /ws/stream and renders each
 * annotated JPEG frame as a data-URI in an <img> tag.
 */
function PPELiveStream() {
  const [imgSrc, setImgSrc] = useState(null);
  const [status, setStatus] = useState('disconnected');
  const [statusMsg, setStatusMsg] = useState('');
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    setStatus('connecting');

    const ws = new WebSocket(`${WS_URL}/ws/stream`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setStatus('connected');
      setStatusMsg('');
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'frame') {
          setImgSrc(`data:image/jpeg;base64,${msg.image}`);
        } else if (msg.type === 'status') {
          setStatusMsg(msg.message);
        } else if (msg.type === 'error') {
          setStatus('error');
          setStatusMsg(msg.message);
        }
      } catch {
        // ignore non-JSON messages
      }
    };

    ws.onerror = () => {
      if (!mountedRef.current) return;
      setStatus('error');
      setStatusMsg('WebSocket connection error. Is the backend running?');
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setStatus('disconnected');
      // Auto-reconnect after 3 s
      reconnectRef.current = setTimeout(connect, 3000);
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect loop on unmount
        wsRef.current.close();
      }
    };
  }, [connect]);

  const handleDisconnect = () => {
    clearTimeout(reconnectRef.current);
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }
    setStatus('disconnected');
    setImgSrc(null);
    setStatusMsg('Manually disconnected.');
  };

  const handleReconnect = () => {
    clearTimeout(reconnectRef.current);
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }
    connect();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <ConnectionBadge status={status} />
        <div className="flex gap-2">
          <button
            onClick={handleReconnect}
            className="px-3 py-1 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            Reconnect
          </button>
          <button
            onClick={handleDisconnect}
            className="px-3 py-1 text-xs rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* Status message */}
      {statusMsg && (
        <p className="text-xs app-text-muted bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg px-3 py-2">
          {statusMsg}
        </p>
      )}

      {/* Video frame */}
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-gray-700 shadow-lg">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt="Live PPE camera feed"
            className="w-full h-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 gap-3">
            {status === 'connecting' ? (
              <>
                <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span className="text-sm">Connecting to camera…</span>
              </>
            ) : (
              <>
                <svg className="h-10 w-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
                <span className="text-sm">No video feed</span>
              </>
            )}
          </div>
        )}

        {/* Live badge */}
        {status === 'connected' && imgSrc && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600/90 text-white text-xs font-semibold px-2 py-1 rounded-md shadow">
            <span className="animate-pulse w-2 h-2 rounded-full bg-white inline-block" />
            LIVE
          </div>
        )}
      </div>

      {/* Info strip */}
      <p className="text-xs app-text-muted">
        Stream: <code className="font-mono">{WS_URL}/ws/stream</code> &nbsp;·&nbsp;
        Detects: Helmet · Vest · Harness · Hook violations
      </p>
    </div>
  );
}

export default PPELiveStream;
