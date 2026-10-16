// ECHOWAVE Design Tokens — Typography
// Supports Arabic (RTL) and English (LTR)

export const typography = {
  // Font families
  fonts: {
    sans: 'system-ui, -apple-system, sans-serif',
    serif: 'Georgia, serif',
    mono: 'Menlo, monospace',
  },

  // Scales (font-size, line-height, letter-spacing)
  scales: {
    // Headings
    h1: {
      fontSize: '3.5rem',
      lineHeight: '1.2',
      letterSpacing: '-0.02em',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2.8rem',
      lineHeight: '1.3',
      letterSpacing: '-0.01em',
      fontWeight: 700,
    },
    h3: {
      fontSize: '2rem',
      lineHeight: '1.4',
      letterSpacing: '-0.005em',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      lineHeight: '1.4',
      letterSpacing: '0em',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      lineHeight: '1.5',
      letterSpacing: '0em',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      lineHeight: '1.5',
      letterSpacing: '0em',
      fontWeight: 600,
    },

    // Body text
    body1: {
      fontSize: '1rem',
      lineHeight: '1.6',
      letterSpacing: '0em',
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: '1.6',
      letterSpacing: '0em',
      fontWeight: 400,
    },

    // Small text
    small: {
      fontSize: '0.75rem',
      lineHeight: '1.5',
      letterSpacing: '0.01em',
      fontWeight: 400,
    },
    xsmall: {
      fontSize: '0.625rem',
      lineHeight: '1.4',
      letterSpacing: '0.02em',
      fontWeight: 500,
    },

    // Captions & labels
    caption: {
      fontSize: '0.75rem',
      lineHeight: '1.4',
      letterSpacing: '0.01em',
      fontWeight: 500,
    },
    label: {
      fontSize: '0.875rem',
      lineHeight: '1.5',
      letterSpacing: '0.005em',
      fontWeight: 600,
    },

    // Button text
    button: {
      fontSize: '1rem',
      lineHeight: '1.5',
      letterSpacing: '0.01em',
      fontWeight: 600,
    },

    // Code/monospace
    code: {
      fontSize: '0.875rem',
      lineHeight: '1.5',
      letterSpacing: '0em',
      fontWeight: 400,
      fontFamily: '"Menlo", "Monaco", monospace',
    },
  },

  // Text styles (ready-made combinations)
  styles: {
    // Headings
    h1: {
      fontSize: '3.5rem',
      fontWeight: 700,
      lineHeight: '1.2',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2.8rem',
      fontWeight: 700,
      lineHeight: '1.3',
    },
    h3: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: '1.4',
    },

    // Body
    body: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: '1.6',
    },
    bodySmall: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: '1.6',
    },

    // UI
    button: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: '1.5',
      letterSpacing: '0.01em',
    },
    label: {
      fontSize: '0.875rem',
      fontWeight: 600,
      lineHeight: '1.5',
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 500,
      lineHeight: '1.4',
      letterSpacing: '0.01em',
    },
  },
} as const;

export type Typography = typeof typography;
export type TypographyScale = keyof typeof typography.scales;
export type TypographyStyle = keyof typeof typography.styles;
