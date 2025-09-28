/**
 * Custom error types for better error handling and debugging
 */

export class LayrError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>,
    public recoverable: boolean = false
  ) {
    super(message);
    this.name = 'LayrError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends LayrError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', context, true);
    this.name = 'ValidationError';
  }
}

export class ConfigurationError extends LayrError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'CONFIGURATION_ERROR', context, false);
    this.name = 'ConfigurationError';
  }
}

export class ProvisioningError extends LayrError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'PROVISIONING_ERROR', context, true);
    this.name = 'ProvisioningError';
  }
}

export class DeploymentError extends LayrError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'DEPLOYMENT_ERROR', context, true);
    this.name = 'DeploymentError';
  }
}

export class NetworkError extends LayrError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'NETWORK_ERROR', context, true);
    this.name = 'NetworkError';
  }
}

/**
 * Error handler with retry logic for recoverable errors
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    backoff?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, backoff = 1000, onRetry } = options;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry non-recoverable errors
      if (error instanceof LayrError && !error.recoverable) {
        throw error;
      }

      if (attempt < maxRetries) {
        const delay = backoff * Math.pow(2, attempt - 1); // Exponential backoff
        if (onRetry) {
          onRetry(attempt, lastError);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Type guard for LayrError
 */
export function isLayrError(error: unknown): error is LayrError {
  return error instanceof LayrError;
}

/**
 * Format error for logging
 */
export function formatError(error: unknown): string {
  if (isLayrError(error)) {
    return `[${error.code}] ${error.message}${
      error.context ? `\nContext: ${JSON.stringify(error.context, null, 2)}` : ''
    }`;
  }

  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  return String(error);
}