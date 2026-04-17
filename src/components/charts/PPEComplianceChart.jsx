function PPEComplianceChart() {
  const data = [
    { name: 'S1 - Earthwork & Structural', value: 97, color: '#22c55e' },
    { name: 'S2 - Girder Casting Yard', value: 92, color: '#f59e0b' },
    { name: 'S3 - Piling Process', value: 85, color: '#fb923c' },
    { name: 'S4 - Express Highway', value: 99, color: '#22c55e' },
    { name: 'S5 - Asphalt / DBM', value: 88, color: '#f59e0b' },
    { name: 'S6 - Safety Command', value: 99, color: '#22c55e' },
  ];

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
        <span className="text-cyan-400">🛡️</span> PPE Compliance - By Site
      </h3>
      <div className="mt-6 space-y-4">
        {data.map((item) => (
          <div key={item.name} className="rounded-2xl bg-slate-900/80 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-200">{item.name}</p>
                <p className="text-xs text-slate-500">Compliance rate</p>
              </div>
              <span className="text-sm font-semibold text-white">{item.value}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-700">
              <div className="h-full rounded-full" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PPEComplianceChart;
