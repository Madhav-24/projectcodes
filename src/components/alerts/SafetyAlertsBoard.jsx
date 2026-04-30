import { useEffect, useMemo, useState } from 'react';
import {
  FaBell,
  FaCheck,
  FaClock,
  FaMapMarkerAlt,
  FaTimes,
  FaUser,
  FaCamera,
  FaExclamationTriangle,
  FaPaperPlane,
} from 'react-icons/fa';
import { createSafetyReport, subscribeToSafetyReports } from '../../services/alertReportService.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import { toast } from 'react-toastify';

const TABS = ['All', 'Active', 'Critical', 'Warning'];
const SOUND_PREF_KEY = 'construction:alert-sound-enabled';

function SeverityBadge({ severity }) {
  const styles =
    severity === 'Critical'
      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40';

  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles}`}>{severity}</span>;
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

function toAlertRows(reports) {
  return reports.map((report) => {
    const severity = report.severity === 'Not Critical' ? 'Warning' : 'Critical';
    return {
      id: `incoming-${report.id}`,
      title: report.problem,
      severity,
      status: report.status || 'Active',
      site: report.site,
      worker: report.senderName,
      camera: 'Manual Report',
      time: new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sourceRole: report.senderRole,
      createdAtMs: report.createdAtMs || Date.now(),
    };
  });
}

function AlertRow({ alert, onResolve }) {
  const isResolved = alert.status === 'Resolved';

  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-xl border px-5 py-4 transition-all ${
        isResolved ? 'border-slate-800 bg-slate-900/40' : 'border-slate-700/70 bg-slate-900/70 hover:border-slate-600'
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${
            alert.severity === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
          }`}
        >
          <FaExclamationTriangle />
        </div>

        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-white">{alert.title}</span>
            <SeverityBadge severity={alert.severity} />
            <StatusBadge status={alert.status} />
            {alert.sourceRole && (
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase text-cyan-300">
                {alert.sourceRole}
              </span>
            )}
          </div>

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

export default function SafetyAlertsBoard({ roleKey, allowGenerateReport = false }) {
  const { profile } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [selectedTab, setSelectedTab] = useState('All');
  const [soundOn, setSoundOn] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    const raw = window.localStorage.getItem(SOUND_PREF_KEY);
    return raw === null ? true : raw === 'true';
  });
  const [showReportModal, setShowReportModal] = useState(false);
  const [reporterName, setReporterName] = useState(profile?.name || '');
  const [problem, setProblem] = useState('');
  const [priority, setPriority] = useState('Critical');

  const assignedSite = Array.isArray(profile?.assignedSite)
    ? profile.assignedSite[0]
    : profile?.assignedSite || 'Assigned Site Not Available';

  useEffect(() => {
    if (!profile?.name) {
      return;
    }

    setReporterName((prev) => prev || profile.name);
  }, [profile?.name]);

  useEffect(() => {
    if (!profile?.uid || !profile?.role) {
      setAlerts([]);
      return;
    }

    const assignedSites = Array.isArray(profile?.assignedSites)
      ? profile.assignedSites.filter(Boolean)
      : Array.isArray(profile?.assignedSite)
      ? profile.assignedSite.filter(Boolean)
      : profile?.assignedSite
      ? [profile.assignedSite]
      : [];

    const viewer = {
      uid: profile.uid,
      role: profile.role,
      assignedSites,
    };

    const unsubscribe = subscribeToSafetyReports(viewer, (reports) => {
      setAlerts(toAlertRows(reports));
    });

    return unsubscribe;
  }, [profile?.uid, profile?.role, profile?.assignedSite, profile?.assignedSites]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SOUND_PREF_KEY, String(soundOn));
    }
  }, [soundOn]);

  const totals = useMemo(() => {
    const activeCount = alerts.filter((alert) => alert.status === 'Active').length;
    const criticalCount = alerts.filter((alert) => alert.severity === 'Critical').length;
    const resolvedCount = alerts.filter((alert) => alert.status === 'Resolved').length;

    return {
      total: alerts.length,
      active: activeCount,
      critical: criticalCount,
      resolved: resolvedCount,
    };
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (selectedTab === 'All') return true;
      if (selectedTab === 'Active') return alert.status === 'Active';
      if (selectedTab === 'Critical') return alert.severity === 'Critical';
      if (selectedTab === 'Warning') return alert.severity === 'Warning';
      return true;
    });
  }, [alerts, selectedTab]);

  const handleResolve = (id) => {
    setAlerts((prev) => prev.map((alert) => (alert.id === id ? { ...alert, status: 'Resolved' } : alert)));
  };

  const handleSendReport = async () => {
    if (!problem.trim()) {
      return;
    }

    try {
      await createSafetyReport(
        {
          senderRole: roleKey,
          senderName: reporterName || profile?.name || 'Unknown User',
          site: assignedSite,
          problem: problem.trim(),
          severity: priority,
          status: 'Active',
        },
        profile
      );
    } catch {
      toast.error('Unable to send alert. Please try again.');
      return;
    }

    setProblem('');
    setPriority('Critical');
    setShowReportModal(false);
  };

  return (
    <>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {allowGenerateReport ? (
            <button
              onClick={() => setShowReportModal(true)}
              className="rounded-xl border border-blue-500/40 bg-blue-500/15 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/25"
            >
              Generate Report
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-3">
            <FaBell className="text-amber-400 text-sm" />
            <span className="text-sm font-medium text-slate-300">Alert Sound</span>
            <button
              onClick={() => setSoundOn((previous) => !previous)}
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
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'TOTAL', value: totals.total, color: 'text-blue-400' },
            { label: 'ACTIVE', value: totals.active, color: 'text-red-400' },
            { label: 'CRITICAL', value: totals.critical, color: 'text-orange-400' },
            { label: 'RESOLVED', value: totals.resolved, color: 'text-emerald-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-slate-800 bg-slate-900/70 px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
              <p className={`mt-2 text-4xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

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
              {tab}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filteredAlerts.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center text-sm text-slate-500">
              No alerts available.
            </div>
          ) : (
            filteredAlerts.map((alert) => <AlertRow key={alert.id} alert={alert} onResolve={handleResolve} />)
          )}
        </div>
      </div>

      {allowGenerateReport && showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-blue-500/30 bg-[#0B1430] p-6 shadow-2xl shadow-blue-900/30">
            <div className="mb-4 flex items-start justify-between border-b border-slate-700/70 pb-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 text-blue-300">
                  <FaExclamationTriangle />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Alert</h3>
                  <p className="mt-1 text-sm text-slate-400">Site Area</p>
                </div>
              </div>

              <button
                onClick={() => setShowReportModal(false)}
                className="rounded-xl border border-slate-700 bg-slate-800/50 p-2 text-slate-400 transition hover:text-slate-200"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-slate-400">Name</label>
                <input
                  value={reporterName}
                  onChange={(event) => setReporterName(event.target.value)}
                  placeholder="Enter your name"
                  className="w-full rounded-2xl border border-slate-700 bg-[#0C1A3D] px-4 py-3 text-slate-100 outline-none transition focus:border-blue-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-slate-400">Site Name</label>
                <input
                  value={assignedSite}
                  readOnly
                  className="w-full rounded-2xl border border-slate-700 bg-[#0C1A3D] px-4 py-3 text-slate-300"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-slate-400">Description</label>
                <textarea
                  value={problem}
                  onChange={(event) => setProblem(event.target.value)}
                  placeholder="Enter problem"
                  rows={5}
                  className="w-full resize-none rounded-2xl border border-slate-700 bg-[#0C1A3D] px-4 py-3 text-slate-100 outline-none transition focus:border-blue-400"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Priority:</span>
                  <select
                    value={priority}
                    onChange={(event) => setPriority(event.target.value)}
                    className="rounded-xl border border-slate-700 bg-[#0C1A3D] px-3 py-2 text-amber-300 outline-none"
                  >
                    <option value="Critical">Critical</option>
                    <option value="Not Critical">Not Critical</option>
                  </select>
                </div>

                <button
                  onClick={handleSendReport}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-500"
                >
                  Send
                  <FaPaperPlane className="text-sm" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
