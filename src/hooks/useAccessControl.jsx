import { useState, useEffect } from 'react';
import { doc, getFirestore, onSnapshot } from 'firebase/firestore';
import app from '../firebase/firebaseConfig.js';
import { useAuthContext } from '../context/AuthContext.jsx';

const db = getFirestore(app);

/**
 * Custom hook to access control permissions for a user
 * Handles both permission-based access (dashboard visibility, messaging) and site-based access
 *
 * @param {string} userId - Optional: the user ID to fetch permissions for. If not provided, uses current auth user.
 * @returns {object} Access control object with permissions and helper functions
 */
export function useAccessControl(userId) {
  const { profile } = useAuthContext();
  const targetUserId = userId || profile?.uid;
  
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

    // Subscribe to user permissions in real-time
    const userRef = doc(db, 'users', targetUserId);
    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.data();
          
          // Permissions-based access control
          if (userData.permissions) {
            setPermissions({
              canViewDashboard: userData.permissions.canViewDashboard ?? true,
              canViewCharts: userData.permissions.canViewCharts ?? true,
              canMessageRoles: userData.permissions.canMessageRoles ?? [],
            });
          }

          // Site-based access control
          const assignedSites = userData.assignedSite ? [userData.assignedSite] : [];
          const canViewAllSites = userData.role === 'admin' || userData.role === 'project_manager';
          const canEditDashboard = userData.role === 'admin' || userData.role === 'supervisor';

          setSiteAccess({
            assignedSites,
            canViewAllSites,
            canEditDashboard,
          });
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching permissions:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [targetUserId]);

  /**
   * Check if user can view dashboard
   */
  const canViewDashboard = () => permissions.canViewDashboard === true;

  /**
   * Check if user can view charts
   */
  const canViewCharts = () => permissions.canViewCharts === true;

  /**
   * Check if user can message a specific role
   * @param {string} roleId - The role ID to check (e.g., 'admin', 'supervisor')
   */
  const canMessageRole = (roleId) => {
    if (!Array.isArray(permissions.canMessageRoles)) {
      return false;
    }
    return permissions.canMessageRoles.includes(roleId);
  };

  /**
   * Check if user can message any of the provided roles
   * @param {array} roleIds - Array of role IDs to check
   */
  const canMessageAnyRole = (roleIds) => {
    if (!Array.isArray(roleIds) || !Array.isArray(permissions.canMessageRoles)) {
      return false;
    }
    return roleIds.some((roleId) => permissions.canMessageRoles.includes(roleId));
  };

  /**
   * Check if user can message all of the provided roles
   * @param {array} roleIds - Array of role IDs to check
   */
  const canMessageAllRoles = (roleIds) => {
    if (!Array.isArray(roleIds) || !Array.isArray(permissions.canMessageRoles)) {
      return false;
    }
    return roleIds.every((roleId) => permissions.canMessageRoles.includes(roleId));
  };

  return {
    // Permissions-based access
    permissions,
    loading,
    error,
    canViewDashboard,
    canViewCharts,
    canMessageRole,
    canMessageAnyRole,
    canMessageAllRoles,
    
    // Site-based access (for existing components)
    assignedSites: siteAccess.assignedSites,
    canViewAllSites: siteAccess.canViewAllSites,
    canEditDashboard: siteAccess.canEditDashboard,
  };
}

export default useAccessControl;
