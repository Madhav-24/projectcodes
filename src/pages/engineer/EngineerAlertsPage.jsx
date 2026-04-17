import { useMemo, useState } from 'react';
import {
  FaHardHat, FaTools, FaCheck, FaBell, FaVolumeUp,
  FaUser, FaCamera, FaClock, FaMapMarkerAlt,
} from 'react-icons/fa';
import { MdConstruction } from 'react-icons/md';
import PageShell from '../../components/layout/PageShell.jsx';

// ─── Static data matching the image ────────────────────────────────────────
const STATIC_ALERTS = [
  {
    id: 1,
    title: 'No Helmet',
    severity: 'Critical',
    status: 'Active',
    site: 'Site 1 – Earthwork & Structural',
    worker: 'Worker #47',
    camera: 'CAM-01',
    time: '10:24 AM',
    icon: <FaHardHat />,
  },
  {
    id: 2,
    title: 'PPE Vest',
    severity: 'Warning',
    status: 'Resolved',
    site: 'Site 1 – Earthwork & Structural',
    worker: 'Worker #12',
    camera: 'CAM-01',
    time: '09:15 AM',
    icon: <FaTools />,
  },
  {
    id: 3,
    title: 'Unauthorized Entry',
    severity: 'Critical',
    status: 'Active',
    site: 'Site 2 – Girder Casting Yard',
    worker: 'Unknown',
    camera: 'CAM-02',
    time: '11:00 AM',
    icon: <FaUser />,
  },
  {
    id: 4,
    title: 'No Helmet',
    severity: 'Critical',
    status: 'Active',
    site: 'Site 2 – Girder Casting Yard',
    worker: 'Worker #08',
    camera: 'CAM-03',
    time: '10:30 AM',
    icon: <FaHardHat />,
  },
  {
    id: 5,
    title: 'Idle Equipment',
    severity: 'Warning',
    status: 'Resolved',
    site: 'Site 2 – Girder Casting Yard',
    worker: 'N/A',
    camera: 'CAM-04',
    time: '09:00 AM',
    icon: <MdConstruction />,
  },
  {
    id: 6,
    title: 'Near Miss',
    severity: 'Warning',
    status: 'Resolved',
    site: 'Site 2 – Girder Casting Yard',
    worker: 'Worker #13',
    camera: 'CAM-03',
    time: '08:20 AM',
    icon: <FaTools />,
  },
  {
    id: 7,
    title: 'PPE Violation',
    severity: 'Critical',
    status: 'Active',
    site: 'Site 3 – Piling Process',
    worker: 'Worker P',
    camera: 'CAM-05',
    time: '12:18 PM',
    icon: <FaHardHat />,
  },
  {
    id: 8,
    title: 'Rig Vibration',
    severity: 'Warning',
    status: 'Active',
    site: 'Site 3 – Piling Process',
    worker: 'N/A',
    camera: 'CAM-05',
    time: '11:45 AM',
    icon: <MdConstruction />,
  },
];

const TABS = ['All', 'Active', 'Critical', 'Warning'];

// ─── Badge helpers ──────────────────────────────────────────────────────────
function SeverityBadge({ severity }) {
  const styles =
    severity === 'Critical'
      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40';
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles}`}>
      {severity}
    </span>
  );
}

function StatusBadge({ status }) {
  const styles =
    status === 'Active'
      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40';
  return (
    <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles}`}>
      {status === 'Resolved' && <FaCheck className="text-[8px]" />}
      {status}
    </span>
  );
}

// ─── Single alert row ───────────────────────────────────────────────────────
function AlertRow({ alert, onResolve }) {
  const isResolved = alert.status === 'Resolved';
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-xl border px-5 py-4 transition-all ${
        isResolved
          ? 'border-slate-800 bg-slate-900/40'
          : 'border-slate-700/70 bg-slate-900/70 hover:border-slate-600'
      }`}
    >
      {/* Left – icon + content */}
      <div className="flex min-w-0 items-start gap-3">
        {/* Icon circle */}
        <div
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${
            alert.severity === 'Critical'
              ? 'bg-red-500/20 text-red-400'
              : 'bg-amber-500/20 text-amber-400'
          }`}
        >
          {alert.icon}
        </div>

        {/* Text */}
        <div className="min-w-0 space-y-1.5">
          {/* Title + badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-white">{alert.title}</span>
            <SeverityBadge severity={alert.severity} />
            <StatusBadge status={alert.status} />
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <FaMapMarkerAlt className="text-[9px]" />
              {alert.site}
            </span>
            <span className="flex items-center gap-1">
              <FaUser className="text-[9px]" />
              {alert.worker}
            </span>
            <span className="flex items-center gap-1">
              <FaCamera className="text-[9px]" />
              {alert.camera}
            </span>
            <span className="flex items-center gap-1">
              <FaClock className="text-[9px]" />
              {alert.time}
            </span>
          </div>
        </div>
      </div>

      {/* Right – Resolve button (only for active) */}
      {!isResolved && (
        <button
          onClick={() => onResolve(alert.id)}
          className="shrink-0 flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
        >
          <FaCheck className="text-[9px]" />
          Resolve
        </button>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────
function EngineerAlertsPage() {
  const [alerts, setAlerts] = useState(STATIC_ALERTS);
  const [selectedTab, setSelectedTab] = useState('All');
  const [soundOn, setSoundOn] = useState(true);

  const totals = useMemo(() => ({
    total: 12,
    active: 8,
    critical: 5,
    resolved: 4,
  }), []);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (selectedTab === 'All') return true;
      if (selectedTab === 'Active') return a.status === 'Active';
      if (selectedTab === 'Critical') return a.severity === 'Critical';
      if (selectedTab === 'Warning') return a.severity === 'Warning';
      return true;
    });
  }, [alerts, selectedTab]);

  const handleResolve = (id) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Resolved' } : a))
    );
  };

  return (
    <PageShell
      title="Safety Alerts"
      description="Real-time alerts across all sites"
    >
      <div className="space-y-5">

        {/* ── Top-right Alert Sound toggle (absolute position trick via flex) */}
        <div className="flex items-center justify-end gap-3">
          <FaBell className="text-amber-400 text-sm" />
          <span className="text-sm font-medium text-slate-300">Alert Sound</span>
          {/* Toggle switch */}
          <button
            onClick={() => setSoundOn((p) => !p)}
            className={`relative h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none ${
              soundOn ? 'bg-red-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                soundOn ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* ── Stats row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'TOTAL',    value: totals.total,    color: 'text-blue-400' },
            { label: 'ACTIVE',   value: totals.active,   color: 'text-red-400' },
            { label: 'CRITICAL', value: totals.critical, color: 'text-orange-400' },
            { label: 'RESOLVED', value: totals.resolved, color: 'text-emerald-400' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl border border-slate-800 bg-slate-900/70 px-5 py-4"
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
              <p className={`mt-2 text-4xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                selectedTab === tab
                  ? tab === 'All'
                    ? 'bg-blue-600 text-white'
                    : tab === 'Active'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : tab === 'Critical'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {tab === 'Active' && selectedTab === tab && (
                <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-red-400 align-middle" />
              )}
              {tab === 'Critical' && selectedTab === tab && (
                <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-orange-400 align-middle" />
              )}
              {tab === 'Warning' && selectedTab === tab && (
                <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-400 align-middle" />
              )}
              {tab}
            </button>
          ))}
        </div>

        {/* ── Alert list */}
        <div className="space-y-2">
          {filteredAlerts.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center text-sm text-slate-500">
              No alerts match the selected filter.
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} onResolve={handleResolve} />
            ))
          )}
        </div>

      </div>
    </PageShell>
  );
}

export default EngineerAlertsPage;
