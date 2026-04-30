// Module: Authentication & Permissions Page
// Purpose: Allow admin to manage per-role permissions with batch save to Firestore.

import { useEffect, useMemo, useState } from 'react';
import { FaSave, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import PageShell from '../../components/layout/PageShell.jsx';
import Tabs from '../../components/auth/Tabs.jsx';
import UserPermissionCard from '../../components/auth/UserPermissionCard.jsx';
import { ROLES } from '../../constants/roles.js';
import { toast } from 'react-toastify';
import { getAllUsers, updateUserPermissions } from '../../services/userService.js';

const ROLE_TABS = [
  { id: ROLES.PROJECT_MANAGER, label: 'Project Managers' },
  { id: ROLES.SUPERVISOR, label: 'Supervisors' },
  { id: ROLES.ENGINEER, label: 'Engineers' },
];

const MESSAGE_ROLES = [
  { id: 'admin', label: 'Admin' },
  { id: 'project_manager', label: 'Project Manager' },
  { id: 'supervisor', label: 'Supervisor' },
  { id: 'engineer', label: 'Engineer' },
];

// Apply defaults for any missing permission fields
const normalizePermissions = (user) => {
  const p = user.permissions || {};
  return {
    canViewDashboard: p.canViewDashboard ?? true,
    canViewCharts: p.canViewCharts ?? true,
    canMessageRoles: Array.isArray(p.canMessageRoles) ? p.canMessageRoles : [],
  };
};

function Authentication() {
  const [users, setUsers] = useState([]);
  const [selectedTab, setSelectedTab] = useState(ROLES.PROJECT_MANAGER);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [modifiedUsers, setModifiedUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError('');
    try {
      setUsers(await getAllUsers());
    } catch {
      setError('Unable to load users. Please refresh.');
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = useMemo(
    () => users.filter((user) => user.role === selectedTab),
    [users, selectedTab]
  );

  const hasChanges = Object.keys(modifiedUsers).length > 0;

  // Return local draft permissions if edited, otherwise use Firestore-persisted values
  const getEffectivePermissions = (user) =>
    modifiedUsers[user.uid] || normalizePermissions(user);

  const handlePermissionChange = (userUid, nextPermissions) => {
    setModifiedUsers((prev) => ({ ...prev, [userUid]: nextPermissions }));
  };

  const handleSaveChanges = async () => {
    if (!hasChanges) return;
    setSaving(true);
    try {
      await Promise.all(
        Object.entries(modifiedUsers).map(([uid, permissions]) =>
          updateUserPermissions(uid, permissions)
        )
      );
      setModifiedUsers({});
      toast.success('Permissions saved successfully.');
    } catch {
      toast.error('Unable to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderEmptyState = () => (
    <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/50 p-10 text-center text-slate-400">
      <p className="text-lg font-semibold text-slate-200">No users found</p>
      <p className="mt-2 text-sm text-slate-500">There are no users registered for the selected role yet.</p>
    </div>
  );

  return (
    <PageShell title="Authentication & Permissions" description="Manage user access, dashboard visibility, and messaging permissions.">
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Access Control</h1>
            <p className="mt-2 text-slate-400">Edit permissions for project managers, supervisors, and engineers from one place.</p>
          </div>
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={!hasChanges || saving}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:bg-slate-700"
          >
            {saving ? <><FaSpinner className="animate-spin" /> Saving...</> : <><FaSave /> Save Changes</>}
          </button>
        </div>

        <Tabs tabs={ROLE_TABS} activeTabId={selectedTab} onTabChange={setSelectedTab} />

        <div className="rounded-3xl border border-slate-700 bg-slate-950/70 p-5">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-20 text-slate-300">
              <FaSpinner className="animate-spin text-xl text-blue-400" /> Loading users...
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-red-700 bg-red-900/20 p-6 text-red-200">
              <div className="flex items-center gap-3 mb-4">
                <FaExclamationTriangle />
                <span>{error}</span>
              </div>
              <button type="button" onClick={loadUsers} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500">
                Retry
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <UserPermissionCard
                  key={user.uid}
                  user={user}
                  permissions={getEffectivePermissions(user)}
                  messageRoles={MESSAGE_ROLES}
                  expanded={expandedUserId === user.uid}
                  onToggleExpand={() => setExpandedUserId((prev) => (prev === user.uid ? null : user.uid))}
                  onChange={(nextPermissions) => handlePermissionChange(user.uid, nextPermissions)}
                  hasChanges={Boolean(modifiedUsers[user.uid])}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

export default Authentication;