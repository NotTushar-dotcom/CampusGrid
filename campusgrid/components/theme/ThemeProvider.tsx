'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
  isDark: true,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  /* Sync html & body classes on mount */
  useEffect(() => {
    try {
      const stored = (localStorage.getItem('sih-theme') || localStorage.getItem('cg-dash-theme')) as Theme;
      const effectiveTheme: Theme = stored === 'light' ? 'light' : 'dark';
      setTheme(effectiveTheme);
      document.documentElement.classList.toggle('light', effectiveTheme === 'light');
      document.body.classList.toggle('light', effectiveTheme === 'light');
    } catch { /* ignore */ }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('sih-theme', next);
        localStorage.setItem('cg-dash-theme', next);
        document.documentElement.classList.toggle('light', next === 'light');
        document.body.classList.toggle('light', next === 'light');
      } catch { /* ignore */ }
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
