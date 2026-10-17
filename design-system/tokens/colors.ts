// ECHOWAVE Design Tokens — Colors
// Egyptian Roots. Global Impact.
// Black + Gold cinematic direction

export const colors = {
  // Primary brand colors
  primary: {
    gold: '#D4AF37',
    darkGold: '#AA8C2A',
    lightGold: '#E8D4A2',
  },

  // Neutral palette (black/white foundation)
  neutral: {
    black: '#000000',
    darkGray: '#1A1A1A',
    gray: '#4A4A4A',
    lightGray: '#D9D9D9',
    offWhite: '#F5F5F5',
    white: '#FFFFFF',
  },

  // Semantic colors
  success: {
    dark: '#065F46',
    main: '#10B981',
    light: '#D1FAE5',
  },

  error: {
    dark: '#7F1D1D',
    main: '#EF4444',
    light: '#FEE2E2',
  },

  warning: {
    dark: '#92400E',
    main: '#F59E0B',
    light: '#FEF3C7',
  },

  info: {
    dark: '#0C4A6E',
    main: '#0EA5E9',
    light: '#E0F2FE',
  },

  // Background & Surface
  background: {
    default: '#FFFFFF',
    paper: '#F9FAFB',
    dark: '#000000',
    darkPaper: '#1F2937',
  },

  // Text colors
  text: {
    primary: '#000000',
    secondary: '#4A4A4A',
    tertiary: '#9CA3AF',
    onDark: '#FFFFFF',
    onDarkSecondary: '#E5E7EB',
  },

  // Borders & Dividers
  border: {
    light: '#E5E7EB',
    main: '#D1D5DB',
    dark: '#9CA3AF',
  },

  // Alpha/Transparency
  alpha: {
    transparent: 'transparent',
    black05: 'rgba(0, 0, 0, 0.05)',
    black10: 'rgba(0, 0, 0, 0.10)',
    black20: 'rgba(0, 0, 0, 0.20)',
    black50: 'rgba(0, 0, 0, 0.50)',
    black80: 'rgba(0, 0, 0, 0.80)',
    white05: 'rgba(255, 255, 255, 0.05)',
    white10: 'rgba(255, 255, 255, 0.10)',
    white20: 'rgba(255, 255, 255, 0.20)',
    white50: 'rgba(255, 255, 255, 0.50)',
  },

  // Gradients
  gradient: {
    cinematic: 'linear-gradient(135deg, #000000 0%, #1A1A1A 50%, #D4AF37 100%)',
    gold: 'linear-gradient(90deg, #AA8C2A 0%, #D4AF37 50%, #E8D4A2 100%)',
    dark: 'linear-gradient(180deg, #000000 0%, #1A1A1A 100%)',
  },
} as const;

export type Colors = typeof colors;
export type ColorKey = keyof Colors;
