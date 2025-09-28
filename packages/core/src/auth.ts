/**
 * Authentication and authorization utilities
 */

import { createLogger } from './logger';
import { ValidationError } from './errors';
import crypto from 'crypto';

const logger = createLogger('auth');

/**
 * Generate secure API key
 */
export function generateApiKey(prefix: string = 'layr'): string {
  const randomBytes = crypto.randomBytes(32);
  const key = randomBytes.toString('base64url');
  return `${prefix}_${key}`;
}

/**
 * Hash sensitive data using SHA-256
 */
export function hashData(data: string, salt?: string): string {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(data, actualSalt, 100000, 64, 'sha512').toString('hex');
  return `${actualSalt}:${hash}`;
}

/**
 * Verify hashed data
 */
export function verifyHash(data: string, hashedData: string): boolean {
  try {
    const [salt, hash] = hashedData.split(':');
    const verifyHash = crypto.pbkdf2Sync(data, salt, 100000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  } catch (error) {
    logger.error('Hash verification failed', error);
    return false;
  }
}

/**
 * Generate secure session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(48).toString('base64url');
}

/**
 * JWT-like token structure (simplified)
 */
export interface TokenPayload {
  sub: string; // subject (user id)
  iat: number; // issued at
  exp: number; // expiration
  scope?: string[]; // permissions
}

/**
 * Create a simple signed token
 */
export function createToken(payload: TokenPayload, secret: string): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify and decode token
 */
export function verifyToken(token: string, secret: string): TokenPayload | null {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split('.');

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      logger.warn('Invalid token signature');
      return null;
    }

    // Decode payload
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString()) as TokenPayload;

    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      logger.warn('Token expired', { exp: payload.exp });
      return null;
    }

    return payload;
  } catch (error) {
    logger.error('Token verification failed', error);
    return null;
  }
}

/**
 * Permission checker
 */
export class PermissionChecker {
  constructor(private userScopes: string[] = []) {}

  hasPermission(requiredScope: string): boolean {
    return this.userScopes.includes(requiredScope) || this.userScopes.includes('admin');
  }

  hasAnyPermission(requiredScopes: string[]): boolean {
    return requiredScopes.some(scope => this.hasPermission(scope));
  }

  hasAllPermissions(requiredScopes: string[]): boolean {
    return requiredScopes.every(scope => this.hasPermission(scope));
  }

  requirePermission(requiredScope: string): void {
    if (!this.hasPermission(requiredScope)) {
      throw new ValidationError(`Insufficient permissions. Required: ${requiredScope}`);
    }
  }
}

/**
 * CORS configuration helper
 */
export function getCorsHeaders(origin?: string): Record<string, string> {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-Id',
    'Access-Control-Max-Age': '86400',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  };

  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  } else if (allowedOrigins.includes('*')) {
    headers['Access-Control-Allow-Origin'] = '*';
  }

  return headers;
}

/**
 * Request ID generator for tracing
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}