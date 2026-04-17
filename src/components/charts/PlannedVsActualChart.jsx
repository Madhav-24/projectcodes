import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function PlannedVsActualChart() {
  const data = [
    { week: 'W1', planned: 20, actual: 18 },
    { week: 'W2', planned: 35, actual: 32 },
    { week: 'W3', planned: 50, actual: 48 },
    { week: 'W4', planned: 62, actual: 58 },
    { week: 'W5', planned: 75, actual: 70 },
    { week: 'W6', planned: 85, actual: 80 },
  ];

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
        <span className="text-cyan-400">📊</span> Planned vs Actual
      </h3>
      <div className="mt-6 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
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
  );
}

export default PlannedVsActualChart;
