// Couleurs TTAMASS — Dark mode uniquement
export const Colors = {
  // Fonds
  background: "#0A0A0A",
  surface: "#141414",
  surface2: "#1E1E1E",
  surface3: "#2A2A2A",

  // Texte
  textPrimary: "#FFFFFF",
  textSecondary: "#9CA3AF",
  textMuted: "#4B5563",

  // Accents
  red: "#E53935",
  redLight: "#FF5252",
  redDim: "#B71C1C",
  violet: "#7C3AED",
  violetLight: "#9F67FF",

  // Feedback
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",

  // Bordures
  border: "#2A2A2A",
  borderLight: "#3A3A3A",
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 40,
  hero: 56,
} as const;
