export type ThemeMode = 'light' | 'dark';

export type ThemeColors = {
  background: string;
  surface: string;
  primary: string;
  text: string;
  subtitle: string;
  border: string;
  success: string;
  danger: string;
};

export type AppTheme = {
  mode: ThemeMode;
  colors: ThemeColors;
};

const shared = {
  primary: '#4B9EFF',
  success: '#2ecc71',
  danger: '#e74c3c',
};

export const lightTheme: AppTheme = {
  mode: 'light',
  colors: {
    background: '#F5F7FA',
    surface: '#FFFFFF',
    primary: shared.primary,
    text: '#1F2933',
    subtitle: '#64748B',
    border: '#E2E8F0',
    success: shared.success,
    danger: shared.danger,
  },
};

export const darkTheme: AppTheme = {
  mode: 'dark',
  colors: {
    background: '#0F172A',
    surface: '#1E293B',
    primary: shared.primary,
    text: '#F8FAFC',
    subtitle: '#CBD5F5',
    border: '#334155',
    success: shared.success,
    danger: shared.danger,
  },
};
