import { useMemo, useState } from 'react';

function AIPredictiveCard() {
  const [badWeather, setBadWeather] = useState(false);
  const [workerSlider, setWorkerSlider] = useState(20);
  const [machineSlider, setMachineSlider] = useState(50);

  const today = new Date();
  const baseDays = 30;
  const addedDays = badWeather ? 14 : 0;
  const riskProbability = badWeather ? 85 : 67;
  const productivityIdx = badWeather ? 71 : 78;
  const riskLevel = badWeather ? 'HIGH' : 'NORMAL';
  const riskColor = badWeather ? 'text-red-400' : 'text-emerald-400';

  const completionDate = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() + baseDays + addedDays);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }, [today, addedDays]);

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 backdrop-blur-lg shadow-inner">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
            <span className="text-cyan-400">🤖</span> AI Predictive Intelligence
          </h3>
          <p className="mt-2 text-sm text-slate-400">SCENARIO - All Sites (avg)</p>
        </div>
        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
          LIVE
        </span>
      </div>

      <div className="space-y-6">
        <div className="space-y-4 rounded-2xl bg-slate-950/70 p-4 border border-slate-700">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span className="flex items-center gap-2">
              <span className="text-yellow-400">👷</span> Additional Workers
            </span>
            <span className="rounded-full bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-300">Base</span>
          </div>
          <input
            type="range"
            value={workerSlider}
            min="0"
            max="50"
            onChange={(e) => setWorkerSlider(Number(e.target.value))}
            className="w-full accent-sky-400"
          />
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>0</span>
            <span>+{workerSlider}</span>
            <span>+50</span>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl bg-slate-950/70 p-4 border border-slate-700">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span className="flex items-center gap-2">
              <span className="text-purple-400">⚙️</span> Additional Machines
            </span>
            <span className="rounded-full bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-300">Base</span>
          </div>
          <input
            type="range"
            value={machineSlider}
            min="0"
            max="50"
            onChange={(e) => setMachineSlider(Number(e.target.value))}
            className="w-full accent-violet-400"
          />
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>0</span>
            <span>+{machineSlider}</span>
            <span>+50</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-950/80 p-4">
          <label className="flex items-center gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              id="weather"
              checked={badWeather}
              onChange={(e) => setBadWeather(e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-orange-400 accent-orange-400"
            />
            <span className="flex-1">Bad Weather Conditions</span>
            {badWeather ? <span className="text-sm text-orange-400">+14 day risk</span> : null}
          </label>
        </div>
      </div>

      <div className="mt-8 grid gap-4 rounded-3xl border border-slate-700 bg-slate-950/80 p-5 text-sm text-slate-300">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-slate-900/80 p-4 border border-slate-700">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Est. Completion</p>
            <p className="mt-3 text-lg font-semibold text-slate-100">{completionDate}</p>
          </div>
          <div className="rounded-2xl bg-slate-900/80 p-4 border border-slate-700">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Delay Probability</p>
            <p className="mt-3 text-lg font-semibold text-red-400">{riskProbability}%</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-slate-900/80 p-4 border border-slate-700">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Risk Level</p>
            <p className={`mt-3 text-lg font-semibold ${riskColor}`}>{riskLevel}</p>
          </div>
          <div className="rounded-2xl bg-slate-900/80 p-4 border border-slate-700">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Productivity IDX</p>
            <p className="mt-3 text-lg font-semibold text-amber-400">{productivityIdx}</p>
          </div>
        </div>

        <p className="text-sm text-slate-400">{badWeather ? 'Bad weather → adds +14 days' : 'Baseline estimate based on current conditions'}</p>
      </div>
    </div>
  );
}

export default AIPredictiveCard;
