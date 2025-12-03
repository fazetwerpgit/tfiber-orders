'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Apply theme to document - extracted as a function
  const applyThemeToDocument = useCallback((isDark: boolean) => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('light');
      root.classList.add('dark');
      setResolvedTheme('dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      setResolvedTheme('light');
    }
  }, []);

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      setThemeState(saved);
    }
    setMounted(true);
  }, []);

  // Apply theme to document whenever theme changes
  useEffect(() => {
    if (!mounted) return;

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyThemeToDocument(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => applyThemeToDocument(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyThemeToDocument(theme === 'dark');
    }
  }, [theme, mounted, applyThemeToDocument]);

  const setTheme = useCallback((newTheme: Theme) => {
    // Update state
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);

    // Immediately apply the theme to DOM using the shared function
    if (newTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyThemeToDocument(prefersDark);
    } else {
      applyThemeToDocument(newTheme === 'dark');
    }
  }, [applyThemeToDocument]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  // Return safe defaults during SSR/pre-rendering
  if (!context) {
    return {
      theme: 'system' as Theme,
      setTheme: () => {},
      resolvedTheme: 'light' as const,
    };
  }
  return context;
}
