// Module: useAccessControl
// Purpose: Poll permissions from the REST API and expose access-check helpers.

import { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useAuthContext } from '../context/AuthContext.jsx';

const POLL_INTERVAL_MS = 30_000;

export function useAccessControl(userId) {
  const { profile } = useAuthContext();
  const targetUserId = userId || profile?.id || profile?.uid;

  const [permissions, setPermissions] = useState({
    canViewDashboard: true,
    canViewCharts: true,
    canMessageRoles: [],
  });
  const [siteAccess, setSiteAccess] = useState({
    assignedSites: [],
    canViewAllSites: false,
    canEditDashboard: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    let active = true;

    async function fetchPermissions() {
      if (!active) return;
      try {
        const data = await api.get(`/api/users/${targetUserId}`);

        if (data?.permissions) {
          setPermissions({
            canViewDashboard: data.permissions.canViewDashboard ?? true,
            canViewCharts:    data.permissions.canViewCharts ?? true,
            canMessageRoles:  data.permissions.canMessageRoles ?? [],
          });
        }

        setSiteAccess({
          assignedSites:    data?.assignedSite ? [data.assignedSite] : [],
          canViewAllSites:  data?.role === 'admin' || data?.role === 'project_manager',
          canEditDashboard: data?.role === 'admin' || data?.role === 'supervisor',
        });

        setError(null);
      } catch (err) {
        console.error('Error fetching permissions:', err);
        setError(err.message);
      } finally {
        if (active) setLoading(false);
      }

      if (active) setTimeout(fetchPermissions, POLL_INTERVAL_MS);
    }

    fetchPermissions();
    return () => { active = false; };
  }, [targetUserId]);

  const canViewDashboard = () => permissions.canViewDashboard === true;
  const canViewCharts    = () => permissions.canViewCharts === true;

  const canMessageRole = (roleId) =>
    Array.isArray(permissions.canMessageRoles) && permissions.canMessageRoles.includes(roleId);

  const canMessageAnyRole = (roleIds) =>
    Array.isArray(roleIds) && roleIds.some((id) => canMessageRole(id));

  const canMessageAllRoles = (roleIds) =>
    Array.isArray(roleIds) && roleIds.every((id) => canMessageRole(id));

  return {
    permissions,
    loading,
    error,
    canViewDashboard,
    canViewCharts,
    canMessageRole,
    canMessageAnyRole,
    canMessageAllRoles,
    assignedSites:    siteAccess.assignedSites,
    canViewAllSites:  siteAccess.canViewAllSites,
    canEditDashboard: siteAccess.canEditDashboard,
  };
}

export default useAccessControl;

