import { FaCamera, FaCircle } from 'react-icons/fa';
import Sidebar from '../../components/layout/Sidebar.jsx';

function ProjectManagerCameraPage() {
  const sites = [
    {
      name: 'Site 1 - Earthwork & Structural',
      status: 'On Track',
      statusColor: 'text-green-400',
      cameras: [
        { id: 1, name: 'Main Entrance', status: 'LIVE' },
        { id: 2, name: 'Excavation A', status: 'LIVE' },
      ],
    },
    {
      name: 'Site 2 - Girder Casting Yard',
      status: 'Caution',
      statusColor: 'text-yellow-400',
      cameras: [
        { id: 3, name: 'Casting Yard A', status: 'LIVE' },
        { id: 4, name: 'Storage Zone', status: 'OFFLINE' },
      ],
    },
    {
      name: 'Site 3 - Piling Process',
      status: 'Delayed',
      statusColor: 'text-red-400',
      cameras: [
        { id: 5, name: 'Piling Site', status: 'LIVE' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="lg:ml-72">
        <div className="px-6 py-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <FaCamera className="text-cyan-400" /> Live Camera Feed
            </h1>
            <p className="mt-2 text-xs text-blue-400">Click any camera for details</p>
          </div>

          {/* Sites Grid */}
          <div className="space-y-8">
            {sites.map((site) => (
              <div key={site.name} className="space-y-4">
                {/* Site Header */}
                <div className="flex items-center gap-3">
                  <FaCircle className={`text-sm ${site.statusColor}`} />
                  <h2 className="text-lg font-semibold text-white">{site.name}</h2>
                  <span className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold ${
                    site.status === 'On Track' ? 'bg-green-500/20 text-green-400' :
                    site.status === 'Caution' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {site.status}
                  </span>
                </div>

                {/* Camera Grid */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {site.cameras.map((camera) => (
                    <div
                      key={camera.id}
                      className="group cursor-pointer rounded-lg border border-slate-700 bg-slate-900/50 overflow-hidden transition hover:border-slate-600 hover:bg-slate-900/70"
                    >
                      {/* Camera Feed Placeholder */}
                      <div className="relative h-48 bg-slate-950 flex items-center justify-center overflow-hidden">
                        <div className="flex flex-col items-center justify-center w-full h-full group-hover:bg-slate-900/50 transition">
                          <FaCamera className="mb-2 text-4xl text-slate-600 group-hover:text-slate-500" />
                          <p className="text-xs text-slate-500">CAM-0{camera.id}</p>
                        </div>

                        {/* Status Badge */}
                        <div className={`absolute top-3 right-3 flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${
                          camera.status === 'LIVE'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-slate-700/50 text-slate-400'
                        }`}>
                          <FaCircle className="text-[6px]" />
                          {camera.status}
                        </div>
                      </div>

                      {/* Camera Info */}
                      <div className="p-3">
                        <p className="font-medium text-slate-200">{camera.name}</p>
                        <p className="mt-1 text-xs text-slate-500">Click to view analysis</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectManagerCameraPage;
