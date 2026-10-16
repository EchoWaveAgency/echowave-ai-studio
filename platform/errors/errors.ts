import { v4 as uuid } from 'uuid';
import { logger } from '../logging/logger';

export class AppError extends Error {
  readonly id: string;
  readonly statusCode: number;
  readonly context: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    context: Record<string, any> = {}
  ) {
    super(message);
    this.id = uuid();
    this.statusCode = statusCode;
    this.context = context;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      error: this.message,
      error_id: this.id,
      status: this.statusCode,
    };
  }
}

export class ValidationError extends AppError {
  readonly fields: Record<string, string[]>;

  constructor(message: string, fields: Record<string, string[]> = {}) {
    super(message, 400, { fields });
    this.fields = fields;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  toJSON() {
    return {
      error: this.message,
      error_id: this.id,
      status: 400,
      fields: this.fields,
    };
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, {});
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }

  toJSON() {
    return {
      error: 'Authentication required',
      error_id: this.id,
      status: 401,
    };
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, {});
    Object.setPrototypeOf(this, AuthorizationError.prototype);
    // Log authorization attempts for security audit
    logger.audit('AUTHORIZATION_DENIED', 'resource_access', { reason: message });
  }

  toJSON() {
    return {
      error: 'Access denied',
      error_id: this.id,
      status: 403,
    };
  }
}

export class NotFoundError extends AppError {
  readonly resource: string;

  constructor(resource: string, id?: string) {
    const message = id ? `${resource} not found: ${id}` : `${resource} not found`;
    super(message, 404, { resource, id });
    this.resource = resource;
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }

  toJSON() {
    return {
      error: this.message,
      error_id: this.id,
      status: 404,
    };
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context: Record<string, any> = {}) {
    super(message, 409, context);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export function handleError(error: unknown, context: Record<string, any> = {}) {
  if (error instanceof AppError) {
    logger.error(error.message, error, context);
    return {
      statusCode: error.statusCode,
      body: error.toJSON(),
    };
  }

  const appError = new AppError(
    error instanceof Error ? error.message : 'Internal server error',
    500,
    context
  );

  logger.error(appError.message, error, context);

  return {
    statusCode: 500,
    body: appError.toJSON(),
  };
}
