import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_PPE_WS_URL || 'ws://localhost:8000';

const VIOLATION_COLORS = {
  'No Helmet': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  'No Vest': 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  'No Harness': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  'No Hook': 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  'No Glove': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'No Shoe': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

function ViolationBadge({ type }) {
  const cls = VIOLATION_COLORS[type] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {type}
    </span>
  );
}

function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? 'bg-red-500' : pct >= 60 ? 'bg-orange-400' : 'bg-yellow-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono app-text-muted w-10 text-right">{pct}%</span>
    </div>
  );
}

/**
 * PPEAlertsFeed
 * Connects to the FastAPI WebSocket at /ws/alerts and displays incoming
 * PPE violation alerts in a live-updating table (newest first).
 */
function PPEAlertsFeed({ maxRows = 200 }) {
  const [alerts, setAlerts] = useState([]);
  const [wsStatus, setWsStatus] = useState('disconnected');
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    setWsStatus('connecting');

    const ws = new WebSocket(`${WS_URL}/ws/alerts`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setWsStatus('connected');
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'alert' && msg.data) {
          setAlerts((prev) => [msg.data, ...prev].slice(0, maxRows));
        }
        // ignore ping frames
      } catch {
        // ignore malformed messages
      }
    };

    ws.onerror = () => {
      if (!mountedRef.current) return;
      setWsStatus('error');
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setWsStatus('disconnected');
      reconnectRef.current = setTimeout(connect, 3000);
    };
  }, [maxRows]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  const handleClear = () => setAlerts([]);

  const statusDot = {
    connecting: 'bg-yellow-400',
    connected: 'bg-green-400',
    error: 'bg-red-500',
    disconnected: 'bg-gray-400',
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${statusDot[wsStatus]}`} />
          <span className="text-sm app-text-muted capitalize">{wsStatus}</span>
          {wsStatus === 'connected' && (
            <span className="text-xs text-green-500 font-medium">· Listening for violations…</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs app-text-muted">{alerts.length} alert{alerts.length !== 1 ? 's' : ''}</span>
          <button
            onClick={handleClear}
            className="px-3 py-1 text-xs rounded-lg border border-gray-300 dark:border-gray-600 app-text-muted hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {['Date', 'Time', 'Camera', 'Violation Type', 'Description', 'Confidence'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold app-text-muted uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
            {alerts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm app-text-muted">
                  {wsStatus === 'connected'
                    ? 'No violations detected yet. All clear ✓'
                    : 'Waiting for connection…'}
                </td>
              </tr>
            ) : (
              alerts.map((a) => (
                <tr
                  key={a.alert_id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors animate-fadeIn"
                >
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-xs app-text">{a.date}</td>
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-xs app-text">{a.time}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs app-text-muted">{a.camera_id}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <ViolationBadge type={a.violation_type} />
                  </td>
                  <td className="px-4 py-3 text-xs app-text max-w-xs truncate" title={a.description}>
                    {a.description}
                  </td>
                  <td className="px-4 py-3 min-w-[120px]">
                    <ConfidenceBar value={a.confidence} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs app-text-muted">
        Alerts endpoint: <code className="font-mono">{WS_URL}/ws/alerts</code> &nbsp;·&nbsp;
        Showing latest {maxRows} alerts
      </p>
    </div>
  );
}

export default PPEAlertsFeed;
