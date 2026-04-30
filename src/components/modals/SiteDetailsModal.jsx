import { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaTimes, FaCheckCircle, FaExclamationCircle, FaTimesCircle } from 'react-icons/fa';

function SiteDetailsModal({ site, onClose }) {
  if (!site) return null;

  // Mock data for Planned vs Actual chart
  const plannedVsActualData = [
    { week: 'W1', planned: 12, actual: 10 },
    { week: 'W2', planned: 24, actual: 22 },
    { week: 'W3', planned: 36, actual: 35 },
    { week: 'W4', planned: 48, actual: 45 },
    { week: 'W5', planned: 60, actual: 58 },
    { week: 'W6', planned: 72, actual: `${site.progress || 72}` },
  ];

  // Layer progress data
  const layerProgressData = [
    { name: 'Subgrade', progress: 100, color: '#10b981' },
    { name: 'GSB', progress: 95, color: '#3b82f6' },
    { name: 'WMM', progress: 82, color: '#f59e0b' },
    { name: 'DBM', progress: 65, color: '#f97316' },
    { name: 'Prime', progress: 40, color: '#ef4444' },
    { name: 'Binder', progress: 25, color: '#94a3b8' },
  ];

  // Chainage data
  const chainageData = [
    { km: 'KM 0-2', completion: 100 },
    { km: 'KM 2-4', completion: 95 },
    { km: 'KM 4-6', completion: 85 },
    { km: 'KM 6-8', completion: 72 },
    { km: 'KM 8-10', completion: 45 },
  ];

  const statusColor = (status) => {
    if (status === 'On Track') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (status === 'Caution') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    if (status === 'Delayed') return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  const riskColor = (risk) => {
    if (risk === 'LOW') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (risk === 'MEDIUM') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    if (risk === 'HIGH') return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-800/95 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scaleIn">
        
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-slate-700 bg-slate-900/50 px-8 py-6 flex items-center justify-between backdrop-blur">
          <div>
            <h2 className="text-2xl font-bold text-white">{site.name}</h2>
            <p className="mt-1 text-sm text-slate-400">Detailed site analytics & performance metrics</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 px-8 py-6 space-y-6">
          
          {/* Top Cards - KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-slate-500">Progress</p>
              <p className="mt-2 text-3xl font-bold text-cyan-400">{site.progress || 72}%</p>
              <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${site.progress || 72}%` }} />
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-slate-500">Workers</p>
              <p className="mt-2 text-3xl font-bold text-emerald-400">{site.workers || 85}</p>
              <p className="mt-1 text-xs text-slate-400">/{site.totalWorkers || 100}</p>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-slate-500">Machines</p>
              <p className="mt-2 text-3xl font-bold text-sky-400">{site.machines || 12}</p>
              <p className="mt-1 text-xs text-slate-400">Active units</p>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-slate-500">Safety Score</p>
              <p className="mt-2 text-3xl font-bold text-lime-400">{site.safetyScore || 97}%</p>
              <p className="mt-1 text-xs text-slate-400">Excellent</p>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-slate-500">Budget</p>
              <p className="mt-2 text-2xl font-bold text-orange-400">{site.budget || '₹4.2Cr'}</p>
              <p className="mt-1 text-xs text-slate-400">Allocated</p>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-3">
            <div className={`rounded-full border px-4 py-2 text-sm font-semibold flex items-center gap-2 ${statusColor(site.status || 'On Track')}`}>
              {site.status === 'On Track' && <FaCheckCircle size={14} />}
              {site.status === 'Caution' && <FaExclamationCircle size={14} />}
              {site.status === 'Delayed' && <FaTimesCircle size={14} />}
              {site.status || 'On Track'}
            </div>
            <div className={`rounded-full border px-4 py-2 text-sm font-semibold ${riskColor(site.risk || 'LOW')}`}>
              Risk: {site.risk || 'LOW'}
            </div>
            <div className="rounded-full border border-slate-600 bg-slate-900/50 px-4 py-2 text-sm font-semibold text-slate-300">
              Layer: {site.layer || 'GSB'}
            </div>
          </div>

          {/* Planned vs Actual Chart */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              <span>📊</span> Planned vs Actual Progress
            </h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={plannedVsActualData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="week" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#f3f4f6' }} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Line type="monotone" dataKey="planned" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 3 }} name="Planned" />
                  <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} name="Actual" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Prediction Panel */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              <span>🤖</span> AI Prediction (this site)
            </h3>
            <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-lg border border-slate-600 bg-slate-950/50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Est. Completion</p>
                <p className="mt-2 text-lg font-bold text-cyan-400">18 Sep 2026</p>
                <p className="text-xs text-slate-500 mt-1">Baseline estimate</p>
              </div>
              <div className="rounded-lg border border-slate-600 bg-slate-950/50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Delay Probability</p>
                <p className="mt-2 text-lg font-bold text-red-400">{site.delayProbability || 67}%</p>
                <p className="text-xs text-slate-500 mt-1">Risk of overrun</p>
              </div>
              <div className="rounded-lg border border-slate-600 bg-slate-950/50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Risk Level</p>
                <p className="mt-2 text-lg font-bold text-amber-400">{site.risk || 'LOW'}</p>
                <p className="text-xs text-slate-500 mt-1">Current status</p>
              </div>
              <div className="rounded-lg border border-slate-600 bg-slate-950/50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Productivity Index</p>
                <p className="mt-2 text-lg font-bold text-emerald-400">{site.productivityIndex || 78}</p>
                <p className="text-xs text-slate-500 mt-1">Out of 100</p>
              </div>
            </div>
          </div>

          {/* Layer Progress Breakdown */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              <span>📍</span> Layer Progress Breakdown
            </h3>
            <div className="mt-4 space-y-3">
              {layerProgressData.map((layer) => (
                <div key={layer.name}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-slate-300">{layer.name}</p>
                    <p className="text-sm font-bold" style={{ color: layer.color }}>{layer.progress}%</p>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${layer.progress}%`, backgroundColor: layer.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PPE Breakdown */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              <span>🦺</span> PPE Compliance Breakdown
            </h3>
            <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-lg border border-slate-600 bg-slate-950/50 p-4 text-center">
                <p className="text-sm text-slate-400">Hard Hat</p>
                <p className="mt-2 text-2xl font-bold text-amber-400">{site.ppe?.helmet || 88}%</p>
                <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${site.ppe?.helmet || 88}%` }} />
                </div>
              </div>
              <div className="rounded-lg border border-slate-600 bg-slate-950/50 p-4 text-center">
                <p className="text-sm text-slate-400">Safety Vest</p>
                <p className="mt-2 text-2xl font-bold text-sky-400">{site.ppe?.vest || 92}%</p>
                <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-400 rounded-full" style={{ width: `${site.ppe?.vest || 92}%` }} />
                </div>
              </div>
              <div className="rounded-lg border border-slate-600 bg-slate-950/50 p-4 text-center">
                <p className="text-sm text-slate-400">Gloves</p>
                <p className="mt-2 text-2xl font-bold text-emerald-400">{site.ppe?.gloves || 76}%</p>
                <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${site.ppe?.gloves || 76}%` }} />
                </div>
              </div>
              <div className="rounded-lg border border-slate-600 bg-slate-950/50 p-4 text-center">
                <p className="text-sm text-slate-400">Safety Boots</p>
                <p className="mt-2 text-2xl font-bold text-red-400">{site.ppe?.boots || 95}%</p>
                <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-red-400 rounded-full" style={{ width: `${site.ppe?.boots || 95}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Chainage Status */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              <span>🗺️</span> Chainage Status
            </h3>
            <div className="mt-4 space-y-3">
              {chainageData.map((item) => (
                <div key={item.km} className="flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-950/50">
                  <span className="font-semibold text-slate-300">{item.km}</span>
                  <div className="flex-1 mx-4 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full"
                      style={{ width: `${item.completion}%` }}
                    />
                  </div>
                  <span className="font-bold text-cyan-400 min-w-12 text-right">{item.completion}%</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}

export default SiteDetailsModal;
