import { useEffect, useState } from 'react';
import { FaLock, FaSpinner, FaExclamationCircle } from 'react-icons/fa';
import { collection, getFirestore, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import app from '../../firebase/firebaseConfig.js';
import Sidebar from '../../components/layout/Sidebar.jsx';
import PageShell from '../../components/common/SiteDashboardTemplate.jsx';
import UserPermissionCard from '../../components/cards/UserPermissionCard.jsx';
import { ROLES } from '../../constants/roles.js';
import { toast } from 'react-toastify';

const db = getFirestore(app);

// Define tabs for each role
const ROLE_TABS = [
  { id: 'supervisors', label: 'Supervisors', role: ROLES.SUPERVISOR },
  { id: 'engineers', label: 'Engineers', role: ROLES.ENGINEER },
  { id: 'project_managers', label: 'Project Managers', role: ROLES.PROJECT_MANAGER },
];

// Message roles for permission selection
const MESSAGE_ROLES = [
  { id: 'admin', label: 'Admin' },
  { id: 'supervisor', label: 'Supervisor' },
  { id: 'engineer', label: 'Engineer' },
  { id: 'project_manager', label: 'Project Manager' },
];

function AuthenticationPage() {
  const [activeTab, setActiveTab] = useState('supervisors');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState({});

  // Get the active role based on selected tab
  const getActiveRole = () => {
    const activeTabConfig = ROLE_TABS.find((tab) => tab.id === activeTab);
    return activeTabConfig?.role;
  };

  // Fetch users for the active role
  useEffect(() => {
    const activeRole = getActiveRole();
    if (!activeRole) return;

    setLoading(true);
    setError('');

    const q = query(
      collection(db, 'users'),
      where('role', '==', activeRole),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedUsers = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(fetchedUsers);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again.');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [activeTab]);

  // Handle permission update
  const handlePermissionUpdate = async (userId, updatedPermissions) => {
    try {
      setUpdating((prev) => ({ ...prev, [userId]: true }));
      
      // The actual Firestore update will be handled in the UserPermissionCard
      // This callback is just to show loading state
      setUpdating((prev) => ({ ...prev, [userId]: false }));
    } catch (err) {
      console.error('Error updating permissions:', err);
      toast.error('Failed to update permissions');
      setUpdating((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const activeRoleLabel = ROLE_TABS.find((tab) => tab.id === activeTab)?.label;

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 lg:ml-72">
        <PageShell title="Authentication & Permissions" icon={<FaLock />}>
          <div className="space-y-6">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">User Access Control</h1>
              <p className="text-slate-400">Manage user permissions, dashboard visibility, and messaging access.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-700">
              {ROLE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 font-semibold transition border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="space-y-4">
              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <FaSpinner className="mr-3 text-2xl text-blue-500 animate-spin" />
                  <span className="text-slate-300">Loading {activeRoleLabel.toLowerCase()}...</span>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-700 rounded-lg">
                  <FaExclamationCircle className="text-red-500 text-xl" />
                  <span className="text-red-300">{error}</span>
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && users.length === 0 && (
                <div className="text-center py-12">
                  <FaLock className="mx-auto text-4xl text-slate-600 mb-4" />
                  <p className="text-slate-400 mb-2">No {activeRoleLabel.toLowerCase()} found</p>
                  <p className="text-slate-500 text-sm">Add users from the Settings panel to manage their permissions.</p>
                </div>
              )}

              {/* Users List */}
              {!loading &&
                !error &&
                users.length > 0 &&
                users.map((user) => (
                  <UserPermissionCard
                    key={user.id}
                    user={user}
                    messageRoles={MESSAGE_ROLES}
                    onUpdate={() => handlePermissionUpdate(user.id, {})}
                    isUpdating={updating[user.id]}
                  />
                ))}
            </div>
          </div>
        </PageShell>
      </main>
    </div>
  );
}

export default AuthenticationPage;
