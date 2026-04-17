import { FaCheckCircle, FaExclamationCircle, FaTimesCircle } from 'react-icons/fa';

function KpiMetric({ label, value, subtitle, icon, color, accent }) {
  const colorMap = {
    green: 'text-green-400',
    blue: 'text-blue-400',
    cyan: 'text-cyan-400',
    red: 'text-red-400',
    orange: 'text-orange-400',
    purple: 'text-purple-400',
    yellow: 'text-yellow-400',
  };

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-500">{label}</p>
          <p className={`mt-2 text-3xl font-bold ${colorMap[color] || colorMap.blue}`}>{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className={`mt-1 text-2xl ${colorMap[accent || color] || colorMap.blue}`}>{icon}</div>
      </div>
    </div>
  );
}

export default KpiMetric;
