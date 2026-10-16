import React from 'react';
import { colors, spacing } from '../tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isDisabled?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: colors.primary.gold,
    color: colors.neutral.black,
    borderColor: colors.primary.darkGold,
  },
  secondary: {
    backgroundColor: colors.neutral.darkGray,
    color: colors.neutral.white,
    borderColor: colors.neutral.gray,
  },
  tertiary: {
    backgroundColor: 'transparent',
    color: colors.primary.gold,
    borderColor: colors.primary.gold,
  },
  danger: {
    backgroundColor: colors.error.main,
    color: colors.neutral.white,
    borderColor: colors.error.dark,
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: {
    padding: `${spacing.sm} ${spacing.md}`,
    fontSize: '0.875rem',
    minHeight: '32px',
  },
  md: {
    padding: `${spacing.md} ${spacing.lg}`,
    fontSize: '1rem',
    minHeight: '40px',
  },
  lg: {
    padding: `${spacing.lg} ${spacing.xl}`,
    fontSize: '1.125rem',
    minHeight: '48px',
  },
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isDisabled = false,
      fullWidth = false,
      className = '',
      disabled = isDisabled || isLoading,
      style = {},
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles: React.CSSProperties = {
      display: fullWidth ? 'w-full' : 'inline-block',
      width: fullWidth ? '100%' : 'auto',
      border: '1px solid',
      borderRadius: spacing.radius.md,
      fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      transition: 'all 0.2s ease-in-out',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      ...variantStyles[variant],
      ...sizeStyles[size],
      ...style,
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={className}
        style={baseStyles}
        {...props}
      >
        {isLoading ? (
          <span style={{ opacity: 0.6 }}>Loading...</span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
