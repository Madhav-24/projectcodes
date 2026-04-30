import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FaHardHat, FaVideo, FaExclamationTriangle, FaChartBar } from 'react-icons/fa';
import PageShell from '../../components/layout/PageShell.jsx';
import { useAccessControl } from '../../hooks/useAccessControl.jsx';
import { api } from '../../api/client.js';

function EngineerDashboardPage() {
  const { assignedSites } = useAccessControl();
  const [siteData, setSiteData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvedAlertIds, setResolvedAlertIds] = useState(new Set());
  const assignedSite = assignedSites[0];

  // Poll alerts from REST API every 5 seconds
  useEffect(() => {
    let active = true;
    async function fetchAlerts() {
      if (!active) return;
      try {
        const data = await api.get('/api/alerts');
        setAlerts(data.slice(0, 5));
      } catch (err) {
        console.error('Failed to fetch alerts:', err);
      } finally {
        if (active) setLoading(false);
      }
      if (active) setTimeout(fetchAlerts, 5000);
    }
    fetchAlerts();
    return () => { active = false; };
  }, []);

  const overview = useMemo(() => ({
    workers: siteData?.workers ?? 0,
    cameras: siteData?.camerasOnline ?? siteData?.cameras?.length ?? 0,
    activeAlerts: alerts.filter((alert) => alert.status !== 'Resolved').length,
    progress: siteData?.progress ?? 0,
  }), [siteData, alerts]);

  const chainageData = siteData?.chainageProgress || [
    { label: 'KM 0.0-2.0', value: 100, status: 'completed' },
    { label: 'KM 2.0-4.5', value: 65, status: 'in-progress' },
    { label: 'KM 4.5-7.0', value: 40, status: 'in-progress' },
    { label: 'KM 7.0-10.0', value: 10, status: 'in-progress' },
    { label: 'KM 10.0-13.0', value: 0, status: 'pending' },
  ];

  const weeklyActivity = siteData?.weeklyActivity || [
    { name: 'Mon', workers: 42, machines: 12 },
    { name: 'Tue', workers: 52, machines: 16 },
    { name: 'Wed', workers: 48, machines: 14 },
    { name: 'Thu', workers: 58, machines: 18 },
    { name: 'Fri', workers: 50, machines: 15 },
    { name: 'Sat', workers: 34, machines: 8 },
    { name: 'Sun', workers: 22, machines: 5 },
  ];

  const recentAlerts = alerts.filter((a) => !resolvedAlertIds.has(a.id)).slice(0, 5);

  const handleResolveAlert = (alertId) => {
    setResolvedAlertIds((prev) => new Set([...prev, alertId]));
  };

  return (
    <PageShell title="Engineer Dashboard" description="Monitor your assigned site performance with the same dashboard experience shown in the template.">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[32px] border border-slate-700 bg-slate-950 p-6 shadow-card">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Total Workers</p>
            {/*<p className="mt-4 text-3xl font-semibold text-white">{overview.workers}</p>*/}
            <p className="mt-4 text-3xl font-semibold text-white">250</p>
            <div className="mt-4 flex items-center gap-3 text-slate-400">
              <FaHardHat />
              <span>Assigned team strength</span>
            </div>
          </div>
          <div className="rounded-[32px] border border-slate-700 bg-slate-950 p-6 shadow-card">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Cameras Online</p>
            {/* <p className="mt-4 text-3xl font-semibold text-emerald-400">{overview.cameras}/24</p> */}
            <p className="mt-4 text-3xl font-semibold text-emerald-400">23/24</p>
            <div className="mt-4 flex items-center gap-3 text-slate-400">
              <FaVideo />
              <span>Live feeds available</span>
            </div>
          </div>
          <div className="rounded-[32px] border border-slate-700 bg-slate-950 p-6 shadow-card">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Active Alerts</p>
            {/* <p className="mt-4 text-3xl font-semibold text-red-400">{overview.activeAlerts}</p> */}
            <p className="mt-4 text-3xl font-semibold text-red-400">4</p>
            <div className="mt-4 flex items-center gap-3 text-slate-400">
              <FaExclamationTriangle />
              <span>Safety notifications</span>
            </div>
          </div>
          <div className="rounded-[32px] border border-slate-700 bg-slate-950 p-6 shadow-card">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Site Progress</p>
            {/* <p className="mt-4 text-3xl font-semibold text-amber-400">{overview.progress}%</p> */}
            <p className="mt-4 text-3xl font-semibold text-amber-400">73%</p>
            <div className="mt-4 flex items-center gap-3 text-slate-400">
              <FaChartBar />
              <span>Chainage progress</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[32px] border border-slate-700 bg-slate-950 p-6 shadow-card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Chainage-Wise Progress</h2>
                <p className="mt-2 text-sm text-slate-400">Progress across work segments for your assigned corridor.</p>
              </div>
              <span className="rounded-full bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-300">{assignedSite || 'Site not assigned'}</span>
            </div>
            <div className="mt-6 space-y-4">
              {chainageData.map((item) => (
                <div key={item.label} className="space-y-3">
                  <div className="flex items-center justify-between gap-4 text-sm text-slate-400">
                    <span>{item.label}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="h-4 overflow-hidden rounded-full bg-slate-900">
                    <div
                      className={`h-full rounded-full ${item.status === 'completed' ? 'bg-emerald-500' : item.status === 'in-progress' ? 'bg-blue-500' : 'bg-slate-700'}`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                  <div className="flex justify-between gap-4 text-xs text-slate-400">
                    <span className="uppercase tracking-[0.18em]">{item.status}</span>
                    <span>{item.status === 'completed' ? 'completed' : item.status === 'in-progress' ? 'in-progress' : 'pending'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-700 bg-slate-950 p-6 shadow-card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Weekly Activity</h2>
                <p className="mt-2 text-sm text-slate-400">Worker and machine activity across the week.</p>
              </div>
              <div className="rounded-full bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-300">Live trend</div>
            </div>
            <div className="mt-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyActivity} margin={{ top: 10, right: 0, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip wrapperStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                  <Bar dataKey="machines" fill="#f97316" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="workers" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-700 bg-slate-950 p-6 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Recent Alerts</h2>
              <p className="mt-2 text-sm text-slate-400">Live notifications from your assigned site.</p>
            </div>
            <button className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800">
              Manage alerts
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {recentAlerts.length === 0 ? (
              <div className="rounded-3xl bg-slate-900 p-8 text-center text-slate-400">No recent alerts.</div>
            ) : (
              recentAlerts.map((alert) => (
                <div key={alert.id} className="rounded-3xl border border-slate-800 bg-slate-900 p-5 text-slate-200 shadow-card transition hover:border-slate-600">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{alert.title || 'AI Safety Alert'}</p>
                      <p className="mt-2 text-sm text-slate-400">{alert.location || 'Unknown location'}</p>
                    </div>
                    <div className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                      {alert.severity || 'Info'}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <span>{alert.siteId || assignedSite}</span>
                    <span>{alert.worker ? `Worker ${alert.worker}` : 'Worker unknown'}</span>
                    <span>{alert.cameraId ? `CAM-${alert.cameraId}` : 'Camera unknown'}</span>
                    <span>{alert.createdAt ? new Date(alert.createdAt.toDate?.() ?? alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown time'}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500">View</button>
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
                    >Resolve</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export default EngineerDashboardPage;
