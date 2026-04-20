import { FaMoon, FaSun } from 'react-icons/fa';
import { useThemeMode } from '../../hooks/useThemeMode.jsx';

function ThemeModeToggle() {
  const { isDarkMode, toggleTheme } = useThemeMode();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`flex items-center gap-3 rounded-2xl border px-3 py-2 transition ${
        isDarkMode
          ? 'border-slate-700 bg-[#121212] text-slate-100'
          : 'border-slate-200 bg-white text-slate-800 shadow-sm'
      }`}
    >
      <span
        className={`relative flex h-9 w-16 items-center rounded-full px-1 transition ${
          isDarkMode ? 'bg-[#2a2a2a]' : 'bg-slate-200'
        }`}
      >
        <span
          className={`h-7 w-7 rounded-full transition ${
            isDarkMode
              ? 'translate-x-7 bg-gradient-to-br from-indigo-500 to-violet-500'
              : 'translate-x-0 bg-gradient-to-br from-amber-400 to-orange-500'
          }`}
        />
      </span>
      {isDarkMode ? <FaMoon className="text-lg text-white" /> : <FaSun className="text-lg text-slate-900" />}
    </button>
  );
}

export default ThemeModeToggle;