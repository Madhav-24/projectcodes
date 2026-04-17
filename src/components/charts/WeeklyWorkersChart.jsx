import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function WeeklyWorkersChart() {
  const data = [
    { day: 'Mon', workers: 320 },
    { day: 'Tue', workers: 350 },
    { day: 'Wed', workers: 380 },
    { day: 'Thu', workers: 420 },
    { day: 'Fri', workers: 400 },
    { day: 'Sat', workers: 350 },
    { day: 'Sun', workers: 280 },
  ];

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
        <span className="text-green-400">👥</span> Weekly Workers - All Sites
      </h3>
      <div className="mt-6 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="day" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#f3f4f6' }} />
            <Line type="monotone" dataKey="workers" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default WeeklyWorkersChart;
