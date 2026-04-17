import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function BudgetBurnChart() {
  const data = [
    { month: 'Jan', burn: 15 },
    { month: 'Feb', burn: 28 },
    { month: 'Mar', burn: 42 },
    { month: 'Apr', burn: 58 },
    { month: 'May', burn: 71 },
    { month: 'Jun', burn: 79 },
  ];

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
        <span className="text-orange-400">💰</span> Budget Burn Rate
      </h3>
      <div className="mt-6 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#f3f4f6' }} />
            <Line type="monotone" dataKey="burn" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default BudgetBurnChart;
