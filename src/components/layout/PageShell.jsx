import Sidebar from './Sidebar.jsx';
import LiveClock from '../common/LiveClock.jsx';
import ThemeToggle from '../common/ThemeToggle.jsx';

function PageShell({ title, description, children }) {
  return (
    <div className="min-h-screen app-bg transition-colors duration-300">
      <div className="flex min-h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 min-h-screen min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:ml-72">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold app-text">{title}</h2>
              {description && <p className="mt-1 text-sm app-text-muted">{description}</p>}
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden lg:block">
                <LiveClock />
              </div>
              <ThemeToggle />
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

export default PageShell;
