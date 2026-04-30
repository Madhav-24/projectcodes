// Module: Role Route
// Purpose: Restrict access to routes based on the user's role.

import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext.jsx';

function RoleRoute({ allowedRoles }) {
  const { profile } = useAuthContext();

  if (!profile) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

export default RoleRoute;
