import { useState, useEffect } from 'react';
import ThemeModeToggle from './ThemeModeToggle.jsx';

function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDay = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  return (
    <div className="flex items-center gap-4 rounded-xl bg-slate-800/50 border border-slate-700 px-4 py-3 backdrop-blur">
      <ThemeModeToggle />
      <div className="text-right">
        <p className="text-sm font-medium text-slate-400">{formatDay(time)}</p>
        <p className="text-sm font-semibold text-slate-200">{formatDate(time)}</p>
      </div>
      <div className="h-12 w-px bg-slate-700"></div>
      <div className="text-center">
        <p className="text-2xl font-bold text-white font-mono">{formatTime(time)}</p>
      </div>
    </div>
  );
}

export default LiveClock;
