import { useEffect, useState } from 'react';

const STORAGE_KEY = 'construction:theme-mode';

function readStoredTheme() {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY);
  return storedTheme === 'light' ? 'light' : 'dark';
}

function applyTheme(theme) {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.classList.toggle('theme-light', theme === 'light');
  root.classList.toggle('theme-dark', theme === 'dark');
  root.style.colorScheme = theme;
}

export function useThemeMode() {
  const [theme, setTheme] = useState(readStoredTheme);

  useEffect(() => {
    applyTheme(theme);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  };

  return {
    isDarkMode: theme === 'dark',
    theme,
    toggleTheme,
  };
}
