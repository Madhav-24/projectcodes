import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function LayerComparisonChart() {
  const data = [
    { name: 'S1', BC: 40, DBM: 35, GSB: 88, Subgrade: 72, WMM: 60 },
    { name: 'S2', BC: 12, DBM: 18, GSB: 92, Subgrade: 58, WMM: 40 },
    { name: 'S3', BC: 18, DBM: 25, GSB: 85, Subgrade: 48, WMM: 35 },
    { name: 'S4', BC: 35, DBM: 28, GSB: 95, Subgrade: 85, WMM: 72 },
    { name: 'S5', BC: 30, DBM: 22, GSB: 90, Subgrade: 68, WMM: 55 },
    { name: 'S6', BC: 22, DBM: 20, GSB: 97, Subgrade: 80, WMM: 65 },
  ];

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <span className="text-cyan-400">🧱</span> Layer Comparison – All Sites
        </h3>
      </div>
      <div className="mt-6 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#f8fafc' }}
              cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
            />
            <Legend wrapperStyle={{ paddingTop: 12 }} iconType="circle" />
            <Bar dataKey="BC" fill="#64748b" radius={[8, 8, 0, 0]} />
            <Bar dataKey="DBM" fill="#94a3b8" radius={[8, 8, 0, 0]} />
            <Bar dataKey="GSB" fill="#f97316" radius={[8, 8, 0, 0]} />
            <Bar dataKey="Subgrade" fill="#fbbf24" radius={[8, 8, 0, 0]} />
            <Bar dataKey="WMM" fill="#9ca3af" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default LayerComparisonChart;
