import { createContext, useCallback, useContext, useMemo, useState } from 'react';

// Module: Alert Context
// Purpose: Provide global in-memory alert state for admin pages.

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState([]);
  const [hasNewAlert, setHasNewAlert] = useState(false);

  const addAlert = useCallback((alert) => {
    setAlerts((prev) => [alert, ...prev].slice(0, 300));
    setHasNewAlert(true);
  }, []);

  const clearAlerts = useCallback(() => setAlerts([]), []);
  const markAlertsViewed = useCallback(() => setHasNewAlert(false), []);

  const value = useMemo(
    () => ({
      alerts,
      hasNewAlert,
      addAlert,
      clearAlerts,
      markAlertsViewed,
    }),
    [addAlert, alerts, clearAlerts, hasNewAlert, markAlertsViewed]
  );

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
}

export function useAlertContext() {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error('useAlertContext must be used within AlertProvider');
  }
  return ctx;
}
