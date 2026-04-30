// Module: PPE Alert WebSocket Dedup Registry
// Purpose: Prevent duplicate toast notifications when the same PPE violation arrives via both
//          the live WebSocket (AdminCamera) and the REST polling path (AlertNotificationListener).
//          Any violation shown immediately via WebSocket is suppressed in the polling path
//          for DEDUP_WINDOW_MS milliseconds.

const DEDUP_WINDOW_MS = 30_000; // 30 seconds

/** @type {Map<string, number>} problem_key → timestamp */
const registry = new Map();

/**
 * Call this immediately after showing a PPE WS notification.
 * @param {string} problem - The violation/problem text from the WebSocket alert.
 */
export function markWsAlertShown(problem) {
  const key = normalise(problem);
  if (key) registry.set(key, Date.now());
}

/**
 * Returns true if the problem was recently shown via WebSocket and the polling path should skip it.
 * Automatically removes stale entries.
 * @param {string} problem
 * @returns {boolean}
 */
export function wasRecentlyShownViaWs(problem) {
  const key = normalise(problem);
  if (!key) return false;
  const ts = registry.get(key);
  if (!ts) return false;
  if (Date.now() - ts > DEDUP_WINDOW_MS) {
    registry.delete(key);
    return false;
  }
  return true;
}

function normalise(str) {
  return (str || '').toLowerCase().trim();
}
