import { useEffect, useState } from 'react';
import { FaCogs, FaUsers, FaPlus, FaEllipsisV, FaTrash } from 'react-icons/fa';
import { collection, deleteDoc, doc, getFirestore, onSnapshot, query } from 'firebase/firestore';
import app from '../../firebase/firebaseConfig.js';
import Sidebar from '../../components/layout/Sidebar.jsx';
import { useAuthContext } from '../../context/AuthContext.jsx';
import { ROLE_OPTIONS, ROLES_REQUIRING_SITE } from '../../constants/roles.js';

const db = getFirestore(app);

function SettingsPage() {
  const { registerUser } = useAuthContext();
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'supervisor',
    employeeId: '',
    phoneNumber: '',
    site: ''
  });
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((user) => user.role !== 'admin'));
    });
    return unsubscribe;
  }, []);

  const handleAdd = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'supervisor',
      employeeId: '',
      phoneNumber: '',
      site: ''
    });
    setErrorMessage('');
    setShowModal(true);
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.name || !formData.email || !formData.password || !formData.employeeId || !formData.phoneNumber) {
      setErrorMessage('Name, email, password, employee ID, and phone number are required.');
      return;
    }

    if (!formData.role) {
      setErrorMessage('Please select a role.');
      return;
    }

    // Validate site assignment for roles that require it
    if (ROLES_REQUIRING_SITE.includes(formData.role.toLowerCase()) && !formData.site) {
      setErrorMessage('Site assignment is required for this role.');
      return;
    }

    // Check for uniqueness
    const existingUser = users.find(user =>
      user.email === formData.email ||
      user.employeeId === formData.employeeId ||
      user.phoneNumber === formData.phoneNumber
    );

    if (existingUser) {
      if (existingUser.email === formData.email) {
        setErrorMessage('Email address is already in use.');
      } else if (existingUser.employeeId === formData.employeeId) {
        setErrorMessage('Employee ID is already in use.');
      } else if (existingUser.phoneNumber === formData.phoneNumber) {
        setErrorMessage('Phone number is already in use.');
      }
      return;
    }

    setSaving(true);
    setErrorMessage('');
    try {
      await registerUser(
        formData.name,
        formData.email,
        formData.password,
        formData.role.toLowerCase(),
        formData.employeeId,
        formData.phoneNumber,
        formData.site || null
      );
      setShowModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'supervisor',
        employeeId: '',
        phoneNumber: '',
        site: ''
      });
    } catch (error) {
      setErrorMessage(error.message || 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id) => {
    setActiveMenuId(null);
    setConfirmDeleteId(id);
    setDeleteError('');
  };

  const handleDeleteConfirm = async (confirm) => {
    if (!confirm) {
      setConfirmDeleteId(null);
      return;
    }

    if (!confirmDeleteId) return;

    try {
      await deleteDoc(doc(db, 'users', confirmDeleteId));
      setConfirmDeleteId(null);
    } catch (error) {
      setDeleteError(error.message || 'Failed to delete user details.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="lg:ml-72">
        <div className="px-6 py-6 space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <FaCogs className="text-cyan-400" /> Settings
              </h1>
              <p className="mt-2 text-sm text-slate-400">Create supervisors/engineers and manage access.</p>
            </div>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 rounded-3xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <FaPlus /> Create User
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <FaCogs className="text-blue-400" /> General Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Project Name</label>
                  <input type="text" defaultValue="AI Road Construction Monitor" className="w-full rounded-3xl bg-slate-700/50 border border-slate-600 px-4 py-2 text-slate-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Support Email</label>
                  <input type="email" defaultValue="support@construction-ai.com" className="w-full rounded-3xl bg-slate-700/50 border border-slate-600 px-4 py-2 text-slate-100" />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input type="checkbox" defaultChecked className="rounded" />
                    Enable email notifications
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input type="checkbox" defaultChecked className="rounded" />
                    Alert on critical issues
                  </label>
                </div>
                <button className="w-full rounded-3xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                  Save Settings
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">🔒 Security</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Current Admin Password</label>
                  <input type="password" className="w-full rounded-3xl bg-slate-700/50 border border-slate-600 px-4 py-2 text-slate-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                  <input type="password" className="w-full rounded-3xl bg-slate-700/50 border border-slate-600 px-4 py-2 text-slate-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
                  <input type="password" className="w-full rounded-3xl bg-slate-700/50 border border-slate-600 px-4 py-2 text-slate-100" />
                </div>
                <button className="w-full rounded-3xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                  Change Password
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">User Directory</h2>
              <p className="text-sm text-slate-400">Manage all supervisor and engineer accounts.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {users.map((user) => (
                <div key={user.id} className="relative rounded-3xl border border-slate-700 bg-slate-900/70 p-5 shadow-xl">
                  <button
                    onClick={() => setActiveMenuId(activeMenuId === user.id ? null : user.id)}
                    className="absolute left-5 top-5 rounded-full p-2 text-slate-300 hover:bg-slate-700/80"
                  >
                    <FaEllipsisV />
                  </button>
                  {activeMenuId === user.id && (
                    <div className="absolute left-5 top-14 z-20 w-40 rounded-2xl border border-slate-700 bg-slate-900 p-2 shadow-2xl">
                      <button
                        onClick={() => handleDeleteClick(user.id)}
                        className="w-full rounded-xl px-3 py-2 text-left text-sm text-red-400 hover:bg-slate-800"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-300">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                      <p className="text-sm text-slate-400">{user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-slate-300">
                    <div>
                      <span className="text-slate-400">Email: </span>{user.email}
                    </div>
                    <div>
                      <span className="text-slate-400">Employee ID: </span>{user.employeeId || 'Not set'}
                    </div>
                    <div>
                      <span className="text-slate-400">Phone: </span>{user.phoneNumber || 'Not set'}
                    </div>
                    <div>
                      <span className="text-slate-400">Site: </span>{user.assignedSite || 'Not assigned'}
                    </div>
                    <div>
                      <span className="text-slate-400">Created: </span>{new Date(user.createdAt || Date.now()).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {confirmDeleteId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
              <div className="w-full max-w-xl rounded-3xl bg-slate-950 border border-slate-700 p-8">
                <h3 className="text-xl font-semibold text-white">Delete this user?</h3>
                <p className="mt-2 text-sm text-slate-400">This will remove the user from Firestore. If the account is an authenticated Firebase Auth user, deleting the auth record requires backend admin privileges.</p>
                {deleteError && <p className="mt-3 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">{deleteError}</p>}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => handleDeleteConfirm(true)}
                    className="flex-1 rounded-3xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => handleDeleteConfirm(false)}
                    className="flex-1 rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          )}

          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
              <div className="w-full max-w-md rounded-3xl bg-slate-950 border border-slate-700 p-8">
                <h2 className="text-xl font-semibold text-white">Create New User</h2>
                <div className="mt-5 space-y-4">
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full name"
                    className="w-full rounded-3xl bg-slate-900 border border-slate-700 px-4 py-3 text-slate-100"
                  />
                  <input
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Email address"
                    type="email"
                    className="w-full rounded-3xl bg-slate-900 border border-slate-700 px-4 py-3 text-slate-100"
                  />
                  <input
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    placeholder="Employee ID (unique)"
                    className="w-full rounded-3xl bg-slate-900 border border-slate-700 px-4 py-3 text-slate-100"
                  />
                  <input
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="Phone number (unique)"
                    type="tel"
                    className="w-full rounded-3xl bg-slate-900 border border-slate-700 px-4 py-3 text-slate-100"
                  />
                  <input
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Password"
                    type="password"
                    className="w-full rounded-3xl bg-slate-900 border border-slate-700 px-4 py-3 text-slate-100"
                  />
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value, site: '' })}
                    className="w-full rounded-3xl bg-slate-900 border border-slate-700 px-4 py-3 text-slate-100"
                  >
                    {ROLE_OPTIONS.filter((option) => option.value !== 'admin').map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  {/* Conditional Site Assignment Field */}
                  {ROLES_REQUIRING_SITE.includes(formData.role?.toLowerCase()) && (
                    <input
                      value={formData.site}
                      onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                      placeholder="Assigned site (required)"
                      className="w-full rounded-3xl bg-slate-900 border border-slate-700 px-4 py-3 text-slate-100"
                    />
                  )}

                  {errorMessage && <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-300">{errorMessage}</p>}
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 rounded-3xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-70"
                  >
                    {saving ? 'Creating user...' : 'Create User'}
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
