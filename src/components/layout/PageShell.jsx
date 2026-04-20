import Sidebar from './Sidebar.jsx';
import LiveClock from '../common/LiveClock.jsx';

function PageShell({ title, description, children, showClock = false }) {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="flex min-h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 min-h-screen min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:ml-72">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">{title}</h2>
              {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
            </div>
            {showClock && (
              <div className="hidden lg:block">
                <LiveClock />
              </div>
            )}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

export default PageShell;
