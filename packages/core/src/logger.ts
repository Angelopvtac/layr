/**
 * Structured logging utility with different levels and formatting
 */

import { getEnvConfig } from './config';
import { formatError } from './errors';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private logLevel: LogLevel = 'info';
  private context: LogContext = {};

  constructor(private name: string) {
    this.updateLogLevel();
  }

  private updateLogLevel(): void {
    try {
      const config = getEnvConfig();
      this.logLevel = config.LAYR_LOG_LEVEL;
    } catch {
      // Default to info if config not loaded
      this.logLevel = 'info';
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private format(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.name}]`;

    let output = `${prefix} ${message}`;

    const mergedContext = { ...this.context, ...context };
    if (Object.keys(mergedContext).length > 0) {
      output += `\n  Context: ${JSON.stringify(mergedContext, null, 2)}`;
    }

    return output;
  }

  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  clearContext(): void {
    this.context = {};
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.format('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.format('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.format('warn', message, context));
    }
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorMessage = error ? `${message}: ${formatError(error)}` : message;
      console.error(this.format('error', errorMessage, context));
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(name: string, context?: LogContext): Logger {
    const childLogger = new Logger(`${this.name}:${name}`);
    childLogger.setContext({ ...this.context, ...context });
    return childLogger;
  }

  /**
   * Time an operation and log the duration
   */
  async time<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const start = Date.now();
    this.debug(`Starting ${operation}`, context);

    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.info(`Completed ${operation} in ${duration}ms`, { ...context, duration });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`Failed ${operation} after ${duration}ms`, error, { ...context, duration });
      throw error;
    }
  }
}

// Factory function for creating loggers
export function createLogger(name: string, context?: LogContext): Logger {
  const logger = new Logger(name);
  if (context) {
    logger.setContext(context);
  }
  return logger;
}

// Default logger instance
export const logger = createLogger('layr');