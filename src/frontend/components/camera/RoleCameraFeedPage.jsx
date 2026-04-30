// Module: Role Camera Feed Page
// Purpose: Render a reusable camera feed dashboard for role-specific pages.
import { FaCamera, FaCircle, FaHardHat, FaTools } from 'react-icons/fa';
import { MdConstruction } from 'react-icons/md';
import PageShell from '../../../components/layout/PageShell.jsx';

const statusClassMap = {
  'On Track': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  Caution: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  Delayed: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
};

const iconMap = {
  helmet: <FaHardHat className="text-slate-400" />,
  tools: <FaTools className="text-slate-400" />,
  construction: <MdConstruction className="text-slate-400" />,
};

function CameraCard({ camera }) {
  const isLive = camera.status === 'LIVE';

  return (
    <div className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/70 transition-all duration-200 hover:border-slate-500 hover:shadow-lg hover:shadow-slate-900/50">
      <div className="relative flex aspect-video items-center justify-center bg-slate-950">
        <FaCamera className="text-3xl text-slate-700" />
        <div
          className={`absolute left-2 top-2 flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            isLive
              ? 'border border-emerald-500/40 bg-emerald-500/20 text-emerald-400'
              : 'border border-slate-600/40 bg-slate-700/80 text-slate-400'
          }`}
        >
          <FaCircle className={`text-[5px] ${isLive ? 'text-emerald-400' : 'text-slate-500'}`} />
          {camera.status}
        </div>
        <div className="absolute right-2 top-2 rounded-full border border-violet-500/40 bg-violet-600/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-300">
          AI
        </div>
        <div className="absolute bottom-2 right-2 font-mono text-[10px] text-slate-600">{camera.streamId}</div>
      </div>
      <div className="px-3 py-2.5">
        <h4 className="text-sm font-semibold leading-tight text-white">{camera.name}</h4>
        <div className="mt-1.5 flex gap-2">
          {camera.details.map((item) => (
            <span key={`${camera.id}-${item}`} className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SiteSection({ site }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-lg">{iconMap[site.icon] || iconMap.construction}</span>
        <h3 className="text-base font-semibold text-white">{site.name}</h3>
        <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${statusClassMap[site.status] || statusClassMap.Delayed}`}>
          {site.status}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {site.cameras.map((camera) => (
          <CameraCard key={camera.id} camera={camera} />
        ))}
      </div>
    </div>
  );
}

function RoleCameraFeedPage({ title = 'Live Camera Feed', description = 'Click any camera for details', sites }) {
  return (
    <PageShell title={title} description={description}>
      <div className="space-y-8">
        {sites.map((site) => (
          <SiteSection key={site.id} site={site} />
        ))}
      </div>
    </PageShell>
  );
}

export default RoleCameraFeedPage;
