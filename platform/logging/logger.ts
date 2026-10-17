import pino from 'pino';

interface LogContext {
  organizationId?: string;
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

export const logger = pino({
  level: LOG_LEVEL,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
});

export class StructuredLogger {
  private context: LogContext;

  constructor(context?: LogContext) {
    this.context = context || {};
  }

  withContext(ctx: LogContext): StructuredLogger {
    return new StructuredLogger({ ...this.context, ...ctx });
  }

  debug(message: string, data?: any) {
    logger.debug({ ...this.context, ...data }, message);
  }

  info(message: string, data?: any) {
    logger.info({ ...this.context, ...data }, message);
  }

  warn(message: string, data?: any) {
    logger.warn({ ...this.context, ...data }, message);
  }

  error(message: string, error?: Error | any, data?: any) {
    logger.error(
      {
        ...this.context,
        ...data,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      },
      message
    );
  }

  audit(operation: string, subject: string, data: any) {
    logger.info(
      {
        ...this.context,
        operation,
        subject,
        auditData: data,
      },
      `Audit: ${operation} on ${subject}`
    );
  }
}

export const defaultLogger = new StructuredLogger();
