import { useState } from 'react';
import { FaMapMarkerAlt, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import Sidebar from '../../components/layout/Sidebar.jsx';

function SiteAllocationPage() {
  const [sites, setSites] = useState([
    { id: 1, name: 'S1 - Earthwork & Structural', location: 'Ennore Port Corridor', workers: 45, status: 'Active' },
    { id: 2, name: 'S2 - Girder Casting Yard', location: 'Ennore Port Corridor', workers: 32, status: 'Active' },
    { id: 3, name: 'S3 - Piling Process', location: 'Ennore Port Corridor', workers: 28, status: 'Active' },
    { id: 4, name: 'S4 - Express Highway', location: 'Highway Zone', workers: 52, status: 'Active' },
    { id: 5, name: 'S5 - Asphalt / DBM', location: 'Highway Zone', workers: 38, status: 'Paused' },
    { id: 6, name: 'S6 - Safety Command', location: 'Control Center', workers: 15, status: 'Active' },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', location: '', workers: '', status: 'Active' });

  const handleAdd = () => {
    setEditingId(null);
    setFormData({ name: '', location: '', workers: '', status: 'Active' });
    setShowModal(true);
  };

  const handleEdit = (site) => {
    setEditingId(site.id);
    setFormData(site);
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingId) {
      setSites(sites.map(s => s.id === editingId ? { ...formData, id: editingId } : s));
    } else {
      setSites([...sites, { ...formData, id: Math.max(...sites.map(s => s.id), 0) + 1 }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    setSites(sites.filter(s => s.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="lg:ml-72">
        <div className="px-6 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <FaMapMarkerAlt className="text-cyan-400" /> Site Allocation
              </h1>
              <p className="mt-2 text-sm text-slate-400">Manage worker allocation across construction sites</p>
            </div>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <FaPlus /> Add Site
            </button>
          </div>

          {/* Sites Table */}
          <div className="rounded-2xl border border-slate-700 bg-slate-800/50 overflow-hidden backdrop-blur">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-200">Site Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-200">Location</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-200">Workers Assigned</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-200">Status</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sites.map((site) => (
                    <tr key={site.id} className="border-b border-slate-700/50 hover:bg-slate-900/30 transition">
                      <td className="px-6 py-4 text-sm font-medium text-slate-100">{site.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-400">{site.location}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        <span className="inline-block rounded-full bg-blue-500/20 px-3 py-1 text-blue-300">{site.workers} workers</span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                          site.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {site.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(site)}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm text-blue-400 hover:bg-blue-500/20 transition"
                        >
                          <FaEdit /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(site.id)}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm text-red-400 hover:bg-red-500/20 transition"
                        >
                          <FaTrash /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
              <div className="rounded-2xl bg-slate-800 border border-slate-700 p-8 max-w-md w-full">
                <h2 className="text-xl font-bold text-white mb-6">{editingId ? 'Edit Site' : 'Add New Site'}</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Site Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg bg-slate-700/50 border border-slate-600 px-4 py-2 text-slate-100 placeholder-slate-500"
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full rounded-lg bg-slate-700/50 border border-slate-600 px-4 py-2 text-slate-100 placeholder-slate-500"
                  />
                  <input
                    type="number"
                    placeholder="Workers"
                    value={formData.workers}
                    onChange={(e) => setFormData({ ...formData, workers: e.target.value })}
                    className="w-full rounded-lg bg-slate-700/50 border border-slate-600 px-4 py-2 text-slate-100 placeholder-slate-500"
                  />
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded-lg bg-slate-700/50 border border-slate-600 px-4 py-2 text-slate-100"
                  >
                    <option value="Active">Active</option>
                    <option value="Paused">Paused</option>
                  </select>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleSave}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 transition"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 rounded-lg border border-slate-600 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-700 transition"
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

export default SiteAllocationPage;
