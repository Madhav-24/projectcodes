// Module: App
// Purpose: Root component — renders global listeners and top-level route shell.

import { Routes, Route, Navigate } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import UnauthorizedPage from './pages/auth/UnauthorizedPage.jsx';
import { useAuth } from './hooks/useAuth.jsx';
import AlertNotificationListener from './components/alerts/AlertNotificationListener.jsx';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center app-bg">
        <div className="text-center app-text-muted">Loading application...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-bg app-text transition-colors duration-300">
      <AlertNotificationListener />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/*" element={<AppRoutes />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;
