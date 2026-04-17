import { useState } from 'react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import EditSiteDataModal from '../modals/EditSiteDataModal.jsx';
import KpiCard from '../cards/KpiCard.jsx';

function SiteDashboardTemplate({ site, onRefresh, canEdit = false }) {
  const [isEditing, setIsEditing] = useState(false);

  if (!site) {
    return <p className="rounded-3xl bg-slate-900 p-8 text-slate-400 shadow-card">Site data is not available.</p>;
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-4">
        <KpiCard title="Site" value={site.siteName} subtitle={site.workType} />
        <KpiCard title="Progress" value={`${site.progress}%`} subtitle="Daily completion rate" accent="bg-secondary" />
        <KpiCard title="Workers" value={site.workers} subtitle="Active personnel" accent="bg-success" />
        <KpiCard title="Alerts" value={site.issues?.length || 0} subtitle="Open issues" accent="bg-danger" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[32px] border border-slate-700 bg-slate-950 p-6 shadow-card">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Progress & Material Usage</h3>
              <p className="mt-1 text-sm text-slate-400">Review the current work progress and resource consumption.</p>
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-3xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900"
              >
                Edit Data
              </button>
            )}
          </div>
          <div className="mt-8 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={site.chartData || []} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip wrapperStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Line type="monotone" dataKey="progress" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-slate-700 bg-slate-950 p-6 shadow-card">
            <h3 className="text-lg font-semibold text-white">Material Usage</h3>
            <div className="mt-5 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={site.materialData || []} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip wrapperStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                  <Bar dataKey="value" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-700 bg-slate-950 p-6 shadow-card">
            <h3 className="text-lg font-semibold text-white">Latest remarks</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              {site.remarks?.length ? (
                site.remarks.slice(0, 3).map((remark) => (
                  <div key={remark.id} className="rounded-3xl border border-slate-700 bg-slate-900 p-4">
                    <p>{remark.comment}</p>
                    <p className="mt-2 text-xs text-slate-400">{remark.author} · {remark.timestamp}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500">No remarks have been published yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <EditSiteDataModal site={site} isOpen={isEditing} onClose={() => setIsEditing(false)} onRefresh={onRefresh} />
    </div>
  );
}

export default SiteDashboardTemplate;
