import { FaBell, FaExclamationTriangle } from 'react-icons/fa';

function AlertBar() {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-700 bg-slate-900 px-6 py-3">
      <div className="flex items-center gap-3">
        <FaExclamationTriangle className="text-xl text-red-500" />
        <p className="text-sm font-semibold text-red-500">
          [EMERGENCY] PPE violation detected - Piling Zone A, Worker #14.
        </p>
      </div>
      <div className="flex items-center gap-6 text-sm text-slate-400">
        <span className="font-medium">{new Date().toLocaleTimeString()}</span>
        <div className="relative">
          <FaBell className="text-lg text-slate-300" />
          <span className="absolute -right-2 -top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-semibold text-white">1</span>
        </div>
      </div>
    </div>
  );
}

export default AlertBar;
