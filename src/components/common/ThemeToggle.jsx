import { FaMoon, FaSun } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext.jsx';

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="group relative inline-flex h-12 w-[106px] items-center rounded-full border border-slate-600 bg-slate-900/95 p-1.5 transition-all duration-300 hover:border-slate-500"
    >
      <span
        className={`absolute top-1.5 h-9 w-9 rounded-full bg-indigo-500 transition-transform duration-300 ${
          isDark ? 'translate-x-[56px]' : 'translate-x-0'
        }`}
      />

      <span className="relative z-10 flex flex-1 items-center justify-start pl-2 text-amber-300">
        <FaSun className={`transition-opacity duration-300 ${isDark ? 'opacity-45' : 'opacity-100'}`} />
      </span>
      <span className="relative z-10 flex flex-1 items-center justify-end pr-2 text-slate-100">
        <FaMoon className={`transition-opacity duration-300 ${isDark ? 'opacity-100' : 'opacity-60'}`} />
      </span>
    </button>
  );
}

export default ThemeToggle;
