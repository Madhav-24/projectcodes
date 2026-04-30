import { useState, useEffect } from 'react';

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
    <div className="flex items-center gap-6 rounded-xl border px-6 py-3 backdrop-blur app-surface app-border transition-colors duration-300">
      <div className="text-right">
        <p className="text-sm font-medium app-text-muted">{formatDay(time)}</p>
        <p className="text-sm font-semibold app-text">{formatDate(time)}</p>
      </div>
      <div className="h-12 w-px app-divider"></div>
      <div className="text-center">
        <p className="text-2xl font-bold app-text font-mono">{formatTime(time)}</p>
      </div>
    </div>
  );
}

export default LiveClock;
