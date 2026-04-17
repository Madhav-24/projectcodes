function KpiCard({ title, value, subtitle, icon, accent }) {
  return (
    <div className="rounded-3xl border border-slate-700 bg-slate-950 p-5 shadow-card transition hover:-translate-y-1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-400">{title}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
          {subtitle && <p className="mt-2 text-sm text-slate-400">{subtitle}</p>}
        </div>
        <div className={`rounded-2xl p-3 text-white ${accent || 'bg-primary'}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default KpiCard;
