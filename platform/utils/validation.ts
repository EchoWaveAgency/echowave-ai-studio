// Validation utilities for common patterns

import { ValidationError } from '../errors/errors';

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain special character (!@#$%^&*)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length <= 255;
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function validatePhoneNumber(phone: string): boolean {
  // Basic international phone number validation
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string[]>;
}

export function validateObject<T extends Record<string, any>>(
  data: T,
  schema: Record<keyof T, (value: any) => { valid: boolean; errors?: string[] }>
): ValidationResult {
  const errors: Record<string, string[]> = {};

  for (const [key, validator] of Object.entries(schema)) {
    const value = data[key as keyof T];
    const result = validator(value);

    if (!result.valid && result.errors) {
      errors[key] = result.errors;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function throwValidationError(
  errors: Record<string, string[]>,
  message: string = 'Validation failed'
): never {
  throw new ValidationError(message, errors);
}
