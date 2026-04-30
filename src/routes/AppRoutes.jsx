// Module: App Routes
// Purpose: Map role-protected URL paths to page components.

import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import RoleRoute from './RoleRoute.jsx';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.jsx';
import CameraPage from '../pages/admin/CameraPage.jsx';
import AlertsPage from '../pages/admin/AlertsPage.jsx';
import ReportsPage from '../pages/admin/ReportsPage.jsx';
import MessagesPage from '../pages/admin/MessagesPage.jsx';
import AuthenticationPage from '../pages/admin/Authentication.jsx';
import SettingsPage from '../pages/admin/SettingsPage.jsx';
import SupervisorDashboardPage from '../pages/supervisor/SupervisorDashboardPage.jsx';
import SupervisorCameraPage from '../pages/supervisor/SupervisorCameraPage.jsx';
import SupervisorAlertsPage from '../pages/supervisor/SupervisorAlertsPage.jsx';
import SupervisorReportsPage from '../pages/supervisor/SupervisorReportsPage.jsx';
import SupervisorMessagesPage from '../pages/supervisor/SupervisorMessagesPage.jsx';
import SupervisorSettingsPage from '../pages/supervisor/SupervisorSettingsPage.jsx';
import EngineerDashboardPage from '../pages/engineer/EngineerDashboardPage.jsx';
import EngineerCameraPage from '../pages/engineer/EngineerCameraPage.jsx';
import EngineerAlertsPage from '../pages/engineer/EngineerAlertsPage.jsx';
import EngineerReportsPage from '../pages/engineer/EngineerReportsPage.jsx';
import EngineerMessagesPage from '../pages/engineer/EngineerMessagesPage.jsx';
import EngineerSettingsPage from '../pages/engineer/EngineerSettingsPage.jsx';
import ProjectManagerDashboardPage from '../pages/project-manager/ProjectManagerDashboardPage.jsx';
import ProjectManagerCameraPage from '../pages/project-manager/ProjectManagerCameraPage.jsx';
import ProjectManagerAlertsPage from '../pages/project-manager/ProjectManagerAlertsPage.jsx';
import ProjectManagerReportsPage from '../pages/project-manager/ProjectManagerReportsPage.jsx';
import ProjectManagerMessagesPage from '../pages/project-manager/ProjectManagerMessagesPage.jsx';
import ProjectManagerSettingsPage from '../pages/project-manager/ProjectManagerSettingsPage.jsx';
import UnauthorizedPage from '../pages/auth/UnauthorizedPage.jsx';

function AppRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={['admin']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/camera" element={<CameraPage />} />
          <Route path="/admin/alerts" element={<AlertsPage />} />
          <Route path="/admin/reports" element={<ReportsPage />} />
          <Route path="/admin/messages" element={<MessagesPage />} />
          <Route path="/admin/authentication" element={<AuthenticationPage />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
        </Route>
        <Route element={<RoleRoute allowedRoles={['supervisor']} />}>
          <Route path="/supervisor/dashboard" element={<SupervisorDashboardPage />} />
          <Route path="/supervisor/camera" element={<SupervisorCameraPage />} />
          <Route path="/supervisor/alerts" element={<SupervisorAlertsPage />} />
          <Route path="/supervisor/reports" element={<SupervisorReportsPage />} />
          <Route path="/supervisor/messages" element={<SupervisorMessagesPage />} />
          <Route path="/supervisor/settings" element={<SupervisorSettingsPage />} />
        </Route>
        <Route element={<RoleRoute allowedRoles={['engineer']} />}>
          <Route path="/engineer/dashboard" element={<EngineerDashboardPage />} />
          <Route path="/engineer/camera" element={<EngineerCameraPage />} />
          <Route path="/engineer/alerts" element={<EngineerAlertsPage />} />
          <Route path="/engineer/reports" element={<EngineerReportsPage />} />
          <Route path="/engineer/messages" element={<EngineerMessagesPage />} />
          <Route path="/engineer/settings" element={<EngineerSettingsPage />} />
        </Route>
        {/* Project Manager Routes */}
        <Route element={<RoleRoute allowedRoles={['project_manager']} />}>
          <Route path="/project-manager/dashboard" element={<ProjectManagerDashboardPage />} />
          <Route path="/project-manager/camera" element={<ProjectManagerCameraPage />} />
          <Route path="/project-manager/alerts" element={<ProjectManagerAlertsPage />} />
          <Route path="/project-manager/reports" element={<ProjectManagerReportsPage />} />
          <Route path="/project-manager/messages" element={<ProjectManagerMessagesPage />} />
          <Route path="/project-manager/settings" element={<ProjectManagerSettingsPage />} />
        </Route>
      </Route>
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;
