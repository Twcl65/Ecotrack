export type ThemeColors = {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  danger: string;
  warning: string;
  info: string;
  white: string;
  headerText: string;
  tabBar: string;
};

export const lightColors: ThemeColors = {
  primary: "#056636",
  primaryDark: "#034d28",
  primaryLight: "#e8f5ee",
  accent: "#7cb518",
  background: "#f4f6f5",
  surface: "#ffffff",
  text: "#1a1a1a",
  textMuted: "#6b7280",
  border: "#e5e7eb",
  danger: "#dc2626",
  warning: "#f59e0b",
  info: "#3b82f6",
  white: "#ffffff",
  headerText: "#ffffff",
  tabBar: "#ffffff",
};

export const darkColors: ThemeColors = {
  primary: "#10b981",
  primaryDark: "#059669",
  primaryLight: "#064e3b",
  accent: "#84cc16",
  background: "#0f1419",
  surface: "#1a222d",
  text: "#f3f4f6",
  textMuted: "#9ca3af",
  border: "#374151",
  danger: "#f87171",
  warning: "#fbbf24",
  info: "#60a5fa",
  white: "#ffffff",
  headerText: "#ffffff",
  tabBar: "#1a222d",
};

/** @deprecated Use useTheme().colors instead */
export const colors = lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
};

export type ThemeMode = "light" | "dark";
