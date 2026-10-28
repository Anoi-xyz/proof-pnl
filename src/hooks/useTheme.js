import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ppnl_theme';

/**
 * Reads / writes the theme preference.
 * - Defaults to the OS preference (prefers-color-scheme).
 * - Persists the user's choice to localStorage.
 * - Applies data-theme on <html> so CSS variables update immediately.
 *
 * The inline script in index.html sets data-theme BEFORE React loads,
 * so there is no flash of wrong theme on page load.
 */
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch { /* storage unavailable */ }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* ignore */ }
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  return { theme, toggleTheme };
}
