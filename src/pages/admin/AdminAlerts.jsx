import { useEffect, useMemo } from 'react';
import PageShell from '../../components/layout/PageShell.jsx';
import { useAlertContext } from '../../context/AlertContext.jsx';

// Module: Admin Alerts Page
// Purpose: Render real-time PPE violations captured from the shared socket.

// Format date from YYYY-MM-DD to DD/MM/YYYY
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    // Handle YYYY-MM-DD format
    const [year, month, day] = dateString.split('-');
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
    return dateString;
  } catch {
    return dateString;
  }
};

function AdminAlerts() {
  const { alerts, clearAlerts, markAlertsViewed } = useAlertContext();
  const alertRows = useMemo(() => alerts, [alerts]);

  useEffect(() => {
    markAlertsViewed();
  }, [markAlertsViewed]);

  return (
    <PageShell
      title="PPE Violation Alerts"
      description="Live alerts from the same camera WebSocket stream"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm app-text-muted">Total alerts: {alerts.length}</p>
        <button
          type="button"
          onClick={clearAlerts}
          className="px-3 py-1.5 text-xs rounded-md border border-gray-300 dark:border-gray-600 app-text-muted hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Clear
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-left">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Person</th>
              <th className="px-4 py-3">Violation</th>
              <th className="px-4 py-3">Description</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length === 0 ? (
              <tr>
                <td className="px-4 py-6 app-text-muted" colSpan={5}>
                  No alerts yet. Open Camera page to start detection.
                </td>
              </tr>
            ) : (
              alertRows.map((alert, index) => (
                <tr key={`${alert.date}-${alert.time}-${index}`} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-3">{formatDate(alert.date)}</td>
                  <td className="px-4 py-3">{alert.time}</td>
                  <td className="px-4 py-3">#{alert.person_id ?? '-'}</td>
                  <td className="px-4 py-3 font-medium">{alert.violation}</td>
                  <td className="px-4 py-3">{alert.description}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

export default AdminAlerts;
