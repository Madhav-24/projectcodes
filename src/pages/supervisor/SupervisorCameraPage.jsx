import { useState } from 'react';
import { FaCamera, FaUpload, FaCircle, FaHardHat, FaTools } from 'react-icons/fa';
import { MdConstruction } from 'react-icons/md';
import PageShell from '../../components/layout/PageShell.jsx';

// Static site + camera data matching the image
const SITES = [
  {
    id: 'site1',
    name: 'Site 1 – Earthwork & Structural',
    status: 'On Track',
    statusColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    dotColor: 'bg-emerald-400',
    icon: <FaHardHat className="text-slate-400" />,
    cameras: [
      { id: 1, name: 'Main Entrance', status: 'LIVE', streamId: 'CAM-01', details: ['8 Persons', '2 Helmets'] },
      { id: 2, name: 'Excavation A',  status: 'LIVE', streamId: 'CAM-02', details: ['3 Machines', '5 Workers'] },
    ],
  },
  {
    id: 'site2',
    name: 'Site 2 – Girder Casting Yard',
    status: 'Caution',
    statusColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    dotColor: 'bg-amber-400',
    icon: <FaTools className="text-slate-400" />,
    cameras: [
      { id: 3, name: 'Casting Yard A', status: 'LIVE',    streamId: 'CAM-03', details: ['4 Workers', '1 Crane'] },
      { id: 4, name: 'Storage Zone',   status: 'OFFLINE', streamId: 'CAM-04', details: ['—', '—'] },
    ],
  },
  {
    id: 'site3',
    name: 'Site 3 – Piling Process',
    status: 'On Hold',
    statusColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    dotColor: 'bg-rose-400',
    icon: <MdConstruction className="text-slate-400" />,
    cameras: [
      { id: 5, name: 'Pile Drive Zone', status: 'LIVE', streamId: 'CAM-05', details: ['2 Workers', '1 Rig'] },
    ],
  },
];

function CameraCard({ camera }) {
  const isLive = camera.status === 'LIVE';
  return (
    <div className="group cursor-pointer rounded-2xl border border-slate-700/60 bg-slate-900/70 overflow-hidden transition-all duration-200 hover:border-slate-500 hover:shadow-lg hover:shadow-slate-900/50">
      {/* Camera feed placeholder */}
      <div className="relative aspect-video bg-slate-950 flex items-center justify-center">
        <FaCamera className="text-3xl text-slate-700" />
        {/* Status badge top-left */}
        <div
          className={`absolute top-2 left-2 flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            isLive
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'bg-slate-700/80 text-slate-400 border border-slate-600/40'
          }`}
        >
          <FaCircle className={`text-[5px] ${isLive ? 'text-emerald-400' : 'text-slate-500'}`} />
          {camera.status}
        </div>
        {/* AI badge top-right */}
        <div className="absolute top-2 right-2 rounded-full bg-violet-600/30 border border-violet-500/40 px-2 py-0.5 text-[10px] font-bold text-violet-300 uppercase tracking-wide">
          AI
        </div>
        {/* Stream ID bottom-right */}
        <div className="absolute bottom-2 right-2 text-[10px] text-slate-600 font-mono">
          {camera.streamId}
        </div>
      </div>
      {/* Camera info */}
      <div className="px-3 py-2.5">
        <h4 className="text-sm font-semibold text-white leading-tight">{camera.name}</h4>
        <div className="mt-1.5 flex gap-2">
          {camera.details.map((d, i) => (
            <span key={i} className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
              {d}
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
      {/* Site header row */}
      <div className="flex items-center gap-3">
        <span className="text-lg">{site.icon}</span>
        <h3 className="text-base font-semibold text-white">{site.name}</h3>
        <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${site.statusColor}`}>
          {site.status}
        </span>
      </div>
      {/* Cameras grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {site.cameras.map((cam) => (
          <CameraCard key={cam.id} camera={cam} />
        ))}
      </div>
    </div>
  );
}

function SupervisorCameraPage() {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) console.log('File uploaded:', files[0]);
  };

  return (
    <PageShell
      title="Live Camera Feed"
      description="Upload image/video for YOLO v8 AI analysis · Click any camera for details"
    >
      <div className="space-y-6">

        {/* YOLO Upload Zone */}
        <div
          className={`rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200 ${
            dragActive
              ? 'border-violet-500 bg-violet-500/10'
              : 'border-slate-700 bg-slate-900/40'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <label htmlFor="yolo-upload-supervisor" className="cursor-pointer">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600/20 border border-violet-500/30">
              <FaUpload className="text-xl text-violet-400" />
            </div>
            <h3 className="mb-1 text-base font-semibold text-white">
              Upload Image or Video for YOLO v8 Analysis
            </h3>
            <p className="text-xs text-slate-500">
              Detects: Hard Hat, Safety Vest, PPE Compliance, Persons, Machinery
            </p>
            <input
              id="yolo-upload-supervisor"
              type="file"
              className="hidden"
              accept="image/*,video/*"
            />
          </label>
        </div>

        {/* All Sites & Cameras */}
        <div className="space-y-8">
          {SITES.map((site) => (
            <SiteSection key={site.id} site={site} />
          ))}
        </div>

      </div>
    </PageShell>
  );
}

export default SupervisorCameraPage;
