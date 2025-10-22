import React, { useCallback, useContext, useMemo, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, Theme as NavigationTheme } from '@react-navigation/native';
import { darkTheme, lightTheme, type AppTheme, type ThemeMode } from '../lib/theme';
import { usePreferences } from '../db/repository';

type ThemeContextValue = {
  mode: ThemeMode;
  theme: AppTheme;
  navigationTheme: NavigationTheme;
  statusBarStyle: 'light' | 'dark';
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

const useInitialThemeMode = (): ThemeMode => {
  const deviceScheme = useColorScheme();
  if (deviceScheme === 'dark' || deviceScheme === 'light') {
    return deviceScheme;
  }
  return 'light';
};

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const initialMode = useInitialThemeMode();
  const [mode, setMode] = useState<ThemeMode>(initialMode);
  const { preferences, setTheme, touchLastOpened } = usePreferences();

  useEffect(() => {
    touchLastOpened();
  }, [touchLastOpened]);

  useEffect(() => {
    if (preferences?.theme && preferences.theme !== mode) {
      setMode(preferences.theme);
    }
  }, [mode, preferences?.theme]);

  const theme = useMemo<AppTheme>(() => (mode === 'dark' ? darkTheme : lightTheme), [mode]);

  const navigationTheme = useMemo<NavigationTheme>(() => {
    const base = mode === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.text,
        primary: theme.colors.primary,
        border: theme.colors.border,
      },
    };
  }, [mode, theme]);

  const statusBarStyle: 'light' | 'dark' = mode === 'dark' ? 'light' : 'dark';

  const toggleTheme = useCallback(() => {
    setMode((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      setTheme(next);
      return next;
    });
  }, [setTheme]);

  const setThemeMode = useCallback((value: ThemeMode) => {
    setMode(value);
    setTheme(value);
  }, [setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, theme, navigationTheme, statusBarStyle, toggleTheme, setThemeMode }),
    [mode, navigationTheme, statusBarStyle, theme, toggleTheme, setThemeMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
