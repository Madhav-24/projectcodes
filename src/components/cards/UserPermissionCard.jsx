import { useState, useEffect } from 'react';
import { FaChevronDown, FaChevronUp, FaSave, FaSpinner } from 'react-icons/fa';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';
import app from '../../firebase/firebaseConfig.js';
import { toast } from 'react-toastify';

const db = getFirestore(app);

function UserPermissionCard({ user, messageRoles, onUpdate, isUpdating }) {
  const [expanded, setExpanded] = useState(false);
  const [permissions, setPermissions] = useState({
    canViewDashboard: true,
    canViewCharts: true,
    canMessageRoles: [],
  });
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize permissions from user data
  useEffect(() => {
    if (user?.permissions) {
      setPermissions({
        canViewDashboard: user.permissions.canViewDashboard ?? true,
        canViewCharts: user.permissions.canViewCharts ?? true,
        canMessageRoles: user.permissions.canMessageRoles ?? [],
      });
    }
  }, [user]);

  // Toggle dashboard access
  const toggleDashboardAccess = () => {
    setPermissions((prev) => ({
      ...prev,
      canViewDashboard: !prev.canViewDashboard,
    }));
    setHasChanges(true);
  };

  // Toggle chart visibility
  const toggleChartVisibility = () => {
    setPermissions((prev) => ({
      ...prev,
      canViewCharts: !prev.canViewCharts,
    }));
    setHasChanges(true);
  };

  // Toggle messaging role
  const toggleMessageRole = (roleId) => {
    setPermissions((prev) => {
      const updatedRoles = prev.canMessageRoles.includes(roleId)
        ? prev.canMessageRoles.filter((r) => r !== roleId)
        : [...prev.canMessageRoles, roleId];

      return {
        ...prev,
        canMessageRoles: updatedRoles,
      };
    });
    setHasChanges(true);
  };

  // Save permissions to Firestore
  const handleSave = async () => {
    try {
      setSaving(true);
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        permissions: {
          canViewDashboard: permissions.canViewDashboard,
          canViewCharts: permissions.canViewCharts,
          canMessageRoles: permissions.canMessageRoles,
        },
      });
      setHasChanges(false);
      toast.success(`Permissions updated for ${user.name}`);
      onUpdate?.();
    } catch (err) {
      console.error('Error saving permissions:', err);
      toast.error('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900/50 hover:bg-slate-900 transition">
      {/* Card Header - Click to Expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/50 transition"
      >
        <div className="flex-1 text-left">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-600/30 border border-blue-500 flex items-center justify-center">
              <span className="text-sm font-semibold text-blue-300">
                {user.name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{user.name}</h3>
              <p className="text-sm text-slate-400">
                {user.employeeId && `ID: ${user.employeeId}`}
                {user.assignedSite && ` • Site: ${user.assignedSite}`}
              </p>
            </div>
          </div>
        </div>

        {/* Expand/Collapse Icon with Status */}
        <div className="flex items-center gap-3">
          {hasChanges && (
            <div className="h-2 w-2 rounded-full bg-yellow-500" title="Unsaved changes"></div>
          )}
          {expanded ? (
            <FaChevronUp className="text-slate-400 text-lg" />
          ) : (
            <FaChevronDown className="text-slate-400 text-lg" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      {expanded && (
        <div className="border-t border-slate-700 px-6 py-4 space-y-6 bg-slate-950/50">
          {/* Dashboard Access Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-300">Dashboard Access</label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={permissions.canViewDashboard}
                  onChange={toggleDashboardAccess}
                  className="w-5 h-5 rounded border-slate-600 bg-slate-700 accent-blue-500 cursor-pointer"
                />
                <span className="text-sm text-slate-400">
                  {permissions.canViewDashboard ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              {permissions.canViewDashboard
                ? 'User can view the dashboard'
                : 'User access to dashboard is restricted'}
            </p>
          </div>

          {/* Chart Visibility Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-300">Chart Visibility</label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={permissions.canViewCharts}
                  onChange={toggleChartVisibility}
                  className="w-5 h-5 rounded border-slate-600 bg-slate-700 accent-blue-500 cursor-pointer"
                />
                <span className="text-sm text-slate-400">
                  {permissions.canViewCharts ? 'Visible' : 'Hidden'}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              {permissions.canViewCharts
                ? 'User can view all charts and analytics'
                : 'Chart section is hidden from user'}
            </p>
          </div>

          {/* Messaging Permissions Section */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-300">Can Message</label>
            <div className="grid grid-cols-2 gap-3">
              {messageRoles.map((role) => (
                <label
                  key={role.id}
                  className="flex items-center gap-2 p-2 rounded hover:bg-slate-800 transition cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={permissions.canMessageRoles.includes(role.id)}
                    onChange={() => toggleMessageRole(role.id)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 accent-blue-500"
                  />
                  <span className="text-sm text-slate-300">{role.label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Select roles this user can send messages to
            </p>
          </div>

          {/* Save Button */}
          {hasChanges && (
            <div className="pt-4 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold rounded-lg transition"
              >
                {saving ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}

          {!hasChanges && (
            <p className="text-xs text-slate-500 text-right">No unsaved changes</p>
          )}
        </div>
      )}
    </div>
  );
}

export default UserPermissionCard;
