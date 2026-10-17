// ECHOWAVE Design Tokens — Central Export
// All design tokens for consistent theming

export { colors, type Colors, type ColorKey } from './colors';
export { typography, type Typography, type TypographyScale, type TypographyStyle } from './typography';
export { spacing, type Spacing, type SpacingSize } from './spacing';

import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';

// Combined design system
export const designTokens = {
  colors,
  typography,
  spacing,
} as const;

export type DesignTokens = typeof designTokens;
