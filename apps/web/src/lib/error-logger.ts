/**
 * Error logging utility
 *
 * Provides structured error logging with environment-aware behavior:
 * - Development: Verbose console logging
 * - Preview: Structured logging ready for external services
 * - Production: Minimal logging, sanitized data
 */

import { getEnvironment, isDevelopment, isProduction } from './env';

export type ErrorLevel = 'error' | 'warn' | 'info' | 'debug';

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  path?: string;
  userAgent?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  level: ErrorLevel;
  message: string;
  error?: Error | unknown;
  context?: ErrorContext;
  environment: string;
  timestamp: string;
}

/**
 * Sanitize sensitive information from error messages and context
 */
function sanitize(value: unknown): unknown {
  if (typeof value === 'string') {
    // Redact common sensitive patterns
    return value
      .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
      .replace(/token[=:]\s*[A-Za-z0-9._-]+/gi, 'token=[REDACTED]')
      .replace(/api[_-]?key[=:]\s*[A-Za-z0-9._-]+/gi, 'api_key=[REDACTED]')
      .replace(/password[=:]\s*\S+/gi, 'password=[REDACTED]')
      .replace(/secret[=:]\s*\S+/gi, 'secret=[REDACTED]')
      .replace(/client_secret[=:]\s*\S+/gi, 'client_secret=[REDACTED]')
      // Redact email addresses in production only
      .replace(isProduction() ? /[\w.-]+@[\w.-]+\.\w+/g : '', '[EMAIL]');
  }

  if (typeof value === 'object' && value !== null) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      // Skip sensitive keys entirely in production
      if (isProduction() && /password|secret|token|key|auth/i.test(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitize(val);
      }
    }
    return sanitized;
  }

  return value;
}

/**
 * Format error for logging
 */
function formatError(error: unknown): string {
  if (error instanceof Error) {
    if (isDevelopment()) {
      return `${error.name}: ${error.message}\n${error.stack || ''}`;
    }
    return `${error.name}: ${error.message}`;
  }

  if (typeof error === 'string') {
    return error;
  }

  return JSON.stringify(error, null, isDevelopment() ? 2 : 0);
}

/**
 * Create a structured log entry
 */
function createLogEntry(
  level: ErrorLevel,
  message: string,
  error?: Error | unknown,
  context?: ErrorContext
): LogEntry {
  const entry: LogEntry = {
    level,
    message: sanitize(message) as string,
    environment: getEnvironment(),
    timestamp: new Date().toISOString(),
  };

  if (error) {
    entry.error = isDevelopment() ? error : formatError(error);
  }

  if (context) {
    entry.context = sanitize(context) as ErrorContext;
  }

  return entry;
}

/**
 * Log to console with appropriate formatting
 */
function logToConsole(entry: LogEntry): void {
  const prefix = `[${entry.level.toUpperCase()}] [${entry.timestamp}]`;

  switch (entry.level) {
    case 'error':
      console.error(prefix, entry.message);
      if (entry.error) console.error('Error:', entry.error);
      if (entry.context) console.error('Context:', entry.context);
      break;

    case 'warn':
      console.warn(prefix, entry.message);
      if (entry.context) console.warn('Context:', entry.context);
      break;

    case 'info':
      console.info(prefix, entry.message);
      if (entry.context) console.info('Context:', entry.context);
      break;

    case 'debug':
      if (isDevelopment()) {
        console.debug(prefix, entry.message);
        if (entry.context) console.debug('Context:', entry.context);
      }
      break;
  }
}

/**
 * Log to external service (placeholder for future implementation)
 *
 * In production, you might want to send logs to services like:
 * - Sentry
 * - LogRocket
 * - Datadog
 * - CloudWatch
 * - etc.
 */
async function logToExternalService(entry: LogEntry): Promise<void> {
  // TODO: Implement external logging service integration
  // Example:
  // if (isProduction()) {
  //   await fetch('/api/logs', {
  //     method: 'POST',
  //     body: JSON.stringify(entry),
  //   });
  // }

  // For now, we just log to console in non-development environments
  if (!isDevelopment()) {
    // In production/preview, you might want to batch logs or send to monitoring service
    // For now, we'll just use console
    logToConsole(entry);
  }
}

/**
 * Main logging function
 */
async function log(
  level: ErrorLevel,
  message: string,
  error?: Error | unknown,
  context?: ErrorContext
): Promise<void> {
  const entry = createLogEntry(level, message, error, context);

  // Always log to console in development
  if (isDevelopment()) {
    logToConsole(entry);
    return;
  }

  // In preview/production, log to external service
  await logToExternalService(entry);
}

/**
 * Log an error
 */
export async function logError(
  message: string,
  error?: Error | unknown,
  context?: ErrorContext
): Promise<void> {
  await log('error', message, error, context);
}

/**
 * Log a warning
 */
export async function logWarning(
  message: string,
  context?: ErrorContext
): Promise<void> {
  await log('warn', message, undefined, context);
}

/**
 * Log info
 */
export async function logInfo(
  message: string,
  context?: ErrorContext
): Promise<void> {
  await log('info', message, undefined, context);
}

/**
 * Log debug information (only in development)
 */
export async function logDebug(
  message: string,
  context?: ErrorContext
): Promise<void> {
  await log('debug', message, undefined, context);
}

/**
 * Log authentication errors specifically
 */
export async function logAuthError(
  errorCode: string,
  message: string,
  context?: ErrorContext
): Promise<void> {
  await logError(`Authentication Error [${errorCode}]: ${message}`, undefined, {
    ...context,
    errorCode,
    errorType: 'authentication',
  });
}

/**
 * Create error context from request (for server-side use)
 */
export function createErrorContext(
  request?: Request,
  additionalContext?: Record<string, unknown>
): ErrorContext {
  const context: ErrorContext = {
    timestamp: new Date().toISOString(),
    ...additionalContext,
  };

  if (request) {
    context.path = new URL(request.url).pathname;
    context.userAgent = request.headers.get('user-agent') || undefined;
  }

  return context;
}
