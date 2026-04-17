function SafetyLeaderboard() {
  const sites = [
    { name: 'S4 Express Highway', score: 99, icon: '🏎️', status: 'excellent' },
    { name: 'S6 Safety Command', score: 99, icon: '🛡️', status: 'excellent' },
    { name: 'S1 Earthwork & Structural', score: 97, icon: '🏗️', status: 'excellent' },
    { name: 'S2 Girder Casting Yard', score: 92, icon: '🛠️', status: 'good' },
    { name: 'S5 Asphalt / DBM', score: 88, icon: '🛣️', status: 'good' },
    { name: 'S3 Piling Process', score: 85, icon: '🧱', status: 'fair' },
  ];

  const getProgressColor = (score) => {
    if (score >= 95) return '#22c55e';
    if (score >= 90) return '#facc15';
    if (score >= 85) return '#fb923c';
    return '#f97316';
  };

  const getMedal = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-6 backdrop-blur-lg">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
        <span className="text-yellow-400">🏆</span> Safety Leaderboard
      </h3>
      <div className="mt-6 space-y-3">
        {sites.map((site, index) => (
          <div key={site.name} className="rounded-2xl bg-slate-950/80 border border-slate-700 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">{getMedal(index)}</span>
                <div className="rounded-full bg-slate-900/90 p-2 text-sm">
                  {site.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-100">{site.name}</p>
                  <p className="text-xs text-slate-500">Safety score</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-slate-200">{site.score}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full"
                style={{ width: `${site.score}%`, backgroundColor: getProgressColor(site.score) }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SafetyLeaderboard;
