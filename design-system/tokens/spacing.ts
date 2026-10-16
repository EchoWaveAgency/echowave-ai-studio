// ECHOWAVE Design Tokens — Spacing
// 4px base unit (8px scale)

export const spacing = {
  // Base unit: 4px
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  '2xl': '3rem', // 48px
  '3xl': '4rem', // 64px
  '4xl': '6rem', // 96px
  '5xl': '8rem', // 128px

  // Aliases for common patterns
  gutter: '1rem', // 16px - standard page margin
  gutterLarge: '2rem', // 32px - large sections
  gridGap: '1.5rem', // 24px - grid column gap
  componentGap: '0.75rem', // 12px - gap between form fields

  // Padding presets
  padding: {
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
  },

  // Margin presets
  margin: {
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    auto: 'auto',
    zero: '0',
  },

  // Gap (flex/grid)
  gap: {
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
  },

  // Border radius
  radius: {
    none: '0px',
    sm: '0.25rem', // 4px
    md: '0.5rem', // 8px
    lg: '1rem', // 16px
    xl: '1.5rem', // 24px
    full: '9999px',
  },

  // Box shadows
  shadow: {
    none: 'none',
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    elevated: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },

  // Z-index scale
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },

  // Breakpoints (mobile-first)
  breakpoint: {
    xs: '0px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Container widths
  container: {
    xs: '100%',
    sm: '540px',
    md: '720px',
    lg: '960px',
    xl: '1140px',
    '2xl': '1320px',
  },

  // Content width (for readable text)
  contentWidth: '65ch', // ~80 characters at default font size
  narrowWidth: '50ch',
  wideWidth: '90ch',
} as const;

export type Spacing = typeof spacing;
export type SpacingSize = keyof Omit<typeof spacing, 'padding' | 'margin' | 'gap' | 'radius' | 'shadow' | 'zIndex' | 'breakpoint' | 'container'>;
