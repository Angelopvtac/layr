/**
 * Input sanitization and validation utilities
 */

import { ValidationError } from './errors';
import { createLogger } from './logger';

const logger = createLogger('sanitizer');

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Truncate to max length
  let sanitized = input.substring(0, maxLength);

  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Remove potential script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove SQL injection attempts
  sanitized = sanitized.replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION)\b)/gi, '');

  // Escape HTML special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  if (sanitized !== input) {
    logger.warn('Input was sanitized', {
      originalLength: input.length,
      sanitizedLength: sanitized.length
    });
  }

  return sanitized;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate and sanitize file paths
 */
export function sanitizePath(path: string): string {
  if (!path || typeof path !== 'string') {
    throw new ValidationError('Invalid path provided');
  }

  // Remove directory traversal attempts
  let sanitized = path.replace(/\.\.\//g, '');
  sanitized = sanitized.replace(/\.\.\\/, '');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Normalize slashes
  sanitized = sanitized.replace(/\\/g, '/');

  // Remove double slashes
  sanitized = sanitized.replace(/\/+/g, '/');

  if (sanitized !== path) {
    logger.warn('Path was sanitized', { original: path, sanitized });
  }

  return sanitized;
}

/**
 * Validate environment variables
 */
export function validateEnvVar(key: string, value: string | undefined, required: boolean = false): string | undefined {
  if (required && !value) {
    throw new ValidationError(`Required environment variable ${key} is not set`);
  }

  if (!value) {
    return undefined;
  }

  // Check for common misconfigurations
  if (value === 'YOUR_API_KEY_HERE' || value === 'CHANGEME' || value === 'TODO') {
    throw new ValidationError(`Environment variable ${key} contains placeholder value: ${value}`);
  }

  // Validate specific formats
  if (key.includes('URL')) {
    if (!validateUrl(value)) {
      throw new ValidationError(`Environment variable ${key} must be a valid URL`);
    }
  }

  if (key.includes('EMAIL')) {
    if (!validateEmail(value)) {
      throw new ValidationError(`Environment variable ${key} must be a valid email`);
    }
  }

  return value;
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private attempts = new Map<string, number[]>();

  constructor(
    private maxAttempts: number = 10,
    private windowMs: number = 60000 // 1 minute
  ) {}

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];

    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < this.windowMs);

    if (recentAttempts.length >= this.maxAttempts) {
      logger.warn('Rate limit exceeded', { key, attempts: recentAttempts.length });
      return false;
    }

    // Record this attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);

    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

/**
 * Content Security Policy builder
 */
export function buildCSP(): string {
  const policies = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co https://*.clerk.com https://*.stripe.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ];

  return policies.join('; ');
}