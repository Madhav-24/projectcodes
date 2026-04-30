// Module: Alert Report Service
// Purpose: REST API CRUD and polling-based subscription for safety alert reports (PostgreSQL backend).
import { api } from '../api/client.js';

const POLL_INTERVAL_MS = 2_000;

export function getSafetyReports() {
  return [];
}

export async function createSafetyReport(reportPayload, senderProfile) {
  if (!senderProfile?.uid || !senderProfile?.role || !reportPayload?.site) {
    throw new Error('Cannot create alert without user role and assigned site.');
  }

  return api.post('/api/alerts', {
    site: reportPayload.site,
    problem: reportPayload.problem,
    severity: reportPayload.severity || 'Critical',
    status: reportPayload.status || 'Active',
    senderName: reportPayload.senderName || senderProfile.name || 'Unknown User',
  });
}

// Returns an unsubscribe function — mirrors the Firebase onSnapshot contract.
export function subscribeToSafetyReports(_viewer, onChange) {
  let active = true;

  async function poll() {
    if (!active) return;
    try {
      const alerts = await api.get('/api/alerts');
      onChange(alerts);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
    if (active) setTimeout(poll, POLL_INTERVAL_MS);
  }

  poll();

  return function unsubscribe() {
    active = false;
  };
}


