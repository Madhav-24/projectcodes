const STORAGE_KEY = 'construction:safety-reports';

function readStoredReports() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getSafetyReports() {
  return readStoredReports();
}

export function createSafetyReport(reportPayload) {
  if (typeof window === 'undefined') {
    return null;
  }

  const report = {
    id: reportPayload.id || `report-${Date.now()}`,
    createdAt: reportPayload.createdAt || new Date().toISOString(),
    senderUid: reportPayload.senderUid || null,
    senderRole: reportPayload.senderRole,
    senderName: reportPayload.senderName,
    site: reportPayload.site,
    problem: reportPayload.problem,
    severity: reportPayload.severity || 'Critical',
    status: reportPayload.status || 'Active',
  };

  const current = readStoredReports();
  const updated = [report, ...current];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  window.dispatchEvent(new CustomEvent('safety-report-created', { detail: report }));
  return report;
}

export function subscribeToSafetyReports(onChange) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = () => {
    onChange(readStoredReports());
  };

  window.addEventListener('storage', handler);
  window.addEventListener('safety-report-created', handler);

  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener('safety-report-created', handler);
  };
}
