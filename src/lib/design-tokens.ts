/**
 * Design Tokens for T-Fiber Orders
 *
 * Single source of truth for design decisions
 * Implements Kreatorflow aesthetic adapted to T-Mobile brand
 */

export const colors = {
  // T-Mobile Magenta - Primary Brand Color
  magenta: {
    base: '#E20074',
    light: '#FF4DA6',
    dark: '#B8005C',
    50: 'rgba(226, 0, 116, 0.1)',
    100: 'rgba(226, 0, 116, 0.2)',
    200: 'rgba(226, 0, 116, 0.3)',
    300: 'rgba(226, 0, 116, 0.5)',
    400: 'rgba(226, 0, 116, 0.7)',
    500: '#E20074',
    600: '#B8005C',
    700: '#8A0045',
    800: '#5C002E',
    900: '#2E0017',
  },

  // Teal - Complementary Secondary Color
  teal: {
    base: '#00D9D9',
    light: '#33E6E6',
    dark: '#00A3A3',
  },

  // Semantic Colors
  success: {
    base: '#10B981',
    light: '#34D399',
    dark: '#059669',
    bgLight: '#D1FAE5',
    bgDark: 'rgba(16, 185, 129, 0.15)',
  },
  warning: {
    base: '#F59E0B',
    light: '#FBBF24',
    dark: '#D97706',
    bgLight: '#FEF3C7',
    bgDark: 'rgba(245, 158, 11, 0.15)',
  },
  error: {
    base: '#EF4444',
    light: '#F87171',
    dark: '#DC2626',
    bgLight: '#FEE2E2',
    bgDark: 'rgba(239, 68, 68, 0.15)',
  },
  info: {
    base: '#3B82F6',
    light: '#60A5FA',
    dark: '#2563EB',
    bgLight: '#DBEAFE',
    bgDark: 'rgba(59, 130, 246, 0.15)',
  },

  // Dark Mode Neutrals
  dark: {
    bg: {
      base: '#000000',
      elevated: '#0F0F0F',
      card: '#1A1A1A',
      interactive: '#1F1F1F',
      input: '#262626',
    },
    border: {
      subtle: '#2D2D2D',
      medium: '#404040',
      strong: '#525252',
    },
    text: {
      primary: 'rgba(255, 255, 255, 1)',
      secondary: 'rgba(255, 255, 255, 0.7)',
      tertiary: 'rgba(255, 255, 255, 0.5)',
      quaternary: 'rgba(255, 255, 255, 0.4)',
      disabled: 'rgba(255, 255, 255, 0.3)',
    },
  },

  // Light Mode Neutrals
  light: {
    bg: {
      base: '#FFFFFF',
      subtle: '#FAFAFA',
      elevated: '#F5F5F5',
      input: '#FAFAFA',
    },
    border: {
      subtle: '#E5E7EB',
      medium: '#D1D5DB',
      strong: '#9CA3AF',
    },
    text: {
      primary: '#0F0F0F',
      secondary: '#404040',
      tertiary: '#6B7280',
      quaternary: '#9CA3AF',
      disabled: '#D1D5DB',
    },
  },
} as const;

export const typography = {
  fontFamily: {
    sans: 'var(--font-inter)',
    heading: 'var(--font-heading)',
    body: 'var(--font-body)',
    mono: 'JetBrains Mono, monospace',
  },
  fontSize: {
    xs: { size: '0.75rem', lineHeight: '1rem' },      // 12px/16px
    sm: { size: '0.875rem', lineHeight: '1.25rem' },  // 14px/20px
    base: { size: '1rem', lineHeight: '1.5rem' },     // 16px/24px
    lg: { size: '1.125rem', lineHeight: '1.75rem' },  // 18px/28px
    xl: { size: '1.25rem', lineHeight: '1.75rem' },   // 20px/28px
    '2xl': { size: '1.5rem', lineHeight: '2rem' },    // 24px/32px
    '3xl': { size: '1.875rem', lineHeight: '2.25rem' }, // 30px/36px
    '4xl': { size: '2.25rem', lineHeight: '2.5rem' }, // 36px/40px
    '5xl': { size: '3rem', lineHeight: '1' },         // 48px/48px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
} as const;

export const borderRadius = {
  none: '0',
  sm: '0.375rem',   // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.25rem', // 20px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

export const shadows = {
  dark: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.5), 0 1px 3px rgba(0, 0, 0, 0.4)',
    md: '0 4px 6px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.5), 0 4px 8px rgba(0, 0, 0, 0.4)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.6), 0 10px 15px rgba(0, 0, 0, 0.5)',
    '2xl': '0 25px 50px rgba(0, 0, 0, 0.7), 0 12px 24px rgba(0, 0, 0, 0.6)',
    glowMagenta: '0 0 20px rgba(226, 0, 116, 0.3), 0 0 40px rgba(226, 0, 116, 0.15)',
    glowMagentaLg: '0 0 30px rgba(226, 0, 116, 0.4), 0 0 60px rgba(226, 0, 116, 0.2)',
  },
  light: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.03)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 15px rgba(0, 0, 0, 0.06)',
    '2xl': '0 25px 50px rgba(0, 0, 0, 0.12), 0 12px 24px rgba(0, 0, 0, 0.08)',
  },
} as const;

export const transitions = {
  duration: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  timing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

export const breakpoints = {
  xs: '390px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Order status colors mapping
export const orderStatusColors = {
  new: {
    bg: colors.info.bgLight,
    bgDark: colors.info.bgDark,
    text: colors.info.dark,
    textDark: colors.info.light,
  },
  scheduled: {
    bg: colors.warning.bgLight,
    bgDark: colors.warning.bgDark,
    text: colors.warning.dark,
    textDark: colors.warning.light,
  },
  installed: {
    bg: colors.success.bgLight,
    bgDark: colors.success.bgDark,
    text: colors.success.dark,
    textDark: colors.success.light,
  },
  completed: {
    bg: '#F3F4F6',
    bgDark: 'rgba(156, 163, 175, 0.15)',
    text: '#6B7280',
    textDark: '#9CA3AF',
  },
  cancelled: {
    bg: colors.error.bgLight,
    bgDark: colors.error.bgDark,
    text: colors.error.dark,
    textDark: colors.error.light,
  },
} as const;
