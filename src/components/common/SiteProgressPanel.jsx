import { FaCheckCircle, FaExclamationCircle, FaTimesCircle } from 'react-icons/fa';

function SiteProgressPanel() {
  const sites = [
    { name: 'Site 1 - Earthwork & Structural', progress: 72, status: 'on-track', alert: 'On Track' },
    { name: 'Site 2 - Girder Casting Yard', progress: 58, status: 'caution', alert: 'Caution' },
    { name: 'Site 3 - Piling Process', progress: 44, status: 'delayed', alert: 'Delayed' },
    { name: 'Site 4 - Express Highway', progress: 81, status: 'on-track', alert: 'On Track' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'on-track':
        return 'text-green-400 border-l-4 border-green-400';
      case 'caution':
        return 'text-orange-400 border-l-4 border-orange-400';
      case 'delayed':
        return 'text-red-400 border-l-4 border-red-400';
      default:
        return 'border-l-4 border-slate-600';
    }
  };

  const getProgressColor = (status) => {
    switch (status) {
      case 'on-track':
        return 'bg-green-500';
      case 'caution':
        return 'bg-orange-500';
      case 'delayed':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur">
      <h3 className="text-lg font-semibold text-white">Site Progress</h3>
      <div className="mt-6 space-y-6">
        {sites.map((site) => (
          <div key={site.name} className={`space-y-2 pb-4 ${getStatusColor(site.status)}`}>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-200">{site.name}</p>
              <span className={`text-sm font-bold ${site.status === 'on-track' ? 'text-green-400' : site.status === 'caution' ? 'text-orange-400' : 'text-red-400'}`}>
                {site.progress}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-700">
              <div className={`h-full ${getProgressColor(site.status)}`} style={{ width: `${site.progress}%` }} />
            </div>
            <p className="text-xs text-slate-400">
              {site.status === 'on-track' ? '✓ On Track' : site.status === 'caution' ? '⚠ Caution' : '✕ Delayed'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SiteProgressPanel;
