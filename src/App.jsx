import { Routes, Route, Navigate } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import UnauthorizedPage from './pages/auth/UnauthorizedPage.jsx';
import { useAuth } from './hooks/useAuth.jsx';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center text-slate-400">Loading application...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
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
