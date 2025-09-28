/**
 * Configuration management with validation and type safety
 */

import { z } from 'zod';
import { ConfigurationError } from './errors';

// Environment configuration schema
const envSchema = z.object({
  // MCP Configuration
  MCP_ENABLED: z.enum(['0', '1']).optional().default('0'),

  // Supabase Configuration
  LAYR_SUPABASE_URL: z.string().url().optional(),
  LAYR_SUPABASE_ANON_KEY: z.string().optional(),
  LAYR_SUPABASE_SERVICE_KEY: z.string().optional(),

  // Clerk Configuration
  LAYR_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  LAYR_CLERK_SECRET_KEY: z.string().optional(),

  // Stripe Configuration
  LAYR_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  LAYR_STRIPE_SECRET_KEY: z.string().optional(),
  LAYR_STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Vercel Configuration
  LAYR_VERCEL_TOKEN: z.string().optional(),
  LAYR_VERCEL_TEAM_ID: z.string().optional(),

  // OpenAI Configuration
  LAYR_OPENAI_API_KEY: z.string().optional(),
  LAYR_OPENAI_MODEL: z.string().default('gpt-4-turbo-preview'),

  // Application Configuration
  LAYR_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  LAYR_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LAYR_PREVIEW_URL: z.string().url().optional(),
  LAYR_MAX_RETRIES: z.string().transform(Number).pipe(z.number().min(0).max(10)).default('3'),
  LAYR_TIMEOUT: z.string().transform(Number).pipe(z.number().min(1000)).default('30000'),
});

export type EnvConfig = z.infer<typeof envSchema>;

// Application configuration schema
const appConfigSchema = z.object({
  retryOptions: z.object({
    maxRetries: z.number().default(3),
    backoff: z.number().default(1000),
    maxBackoff: z.number().default(30000),
  }),

  timeouts: z.object({
    provisioning: z.number().default(60000),
    deployment: z.number().default(120000),
    verification: z.number().default(30000),
  }),

  limits: z.object({
    maxFileSize: z.number().default(10 * 1024 * 1024), // 10MB
    maxTasks: z.number().default(100),
    maxParallelTasks: z.number().default(5),
  }),

  features: z.object({
    enableMCP: z.boolean(),
    enableCache: z.boolean().default(true),
    enableMetrics: z.boolean().default(false),
  }),
});

export type AppConfig = z.infer<typeof appConfigSchema>;

/**
 * Configuration manager singleton
 */
class ConfigManager {
  private envConfig: EnvConfig | null = null;
  private appConfig: AppConfig | null = null;

  /**
   * Load and validate environment configuration
   */
  loadEnv(env: NodeJS.ProcessEnv = process.env): EnvConfig {
    try {
      this.envConfig = envSchema.parse(env);
      return this.envConfig;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ConfigurationError(
          'Invalid environment configuration',
          {
            errors: error.errors.map(e => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          }
        );
      }
      throw error;
    }
  }

  /**
   * Load application configuration
   */
  loadApp(config: Partial<AppConfig> = {}): AppConfig {
    const envConfig = this.getEnv();

    // Derive app config from environment
    const derivedConfig: Partial<AppConfig> = {
      retryOptions: {
        maxRetries: envConfig.LAYR_MAX_RETRIES,
        backoff: 1000,
        maxBackoff: 30000,
      },
      timeouts: {
        provisioning: 60000,
        deployment: 120000,
        verification: envConfig.LAYR_TIMEOUT,
      },
      features: {
        enableMCP: envConfig.MCP_ENABLED === '1',
        enableCache: true,
        enableMetrics: envConfig.LAYR_ENV === 'production',
      },
    };

    try {
      this.appConfig = appConfigSchema.parse({
        ...derivedConfig,
        ...config,
      });
      return this.appConfig;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ConfigurationError(
          'Invalid application configuration',
          {
            errors: error.errors.map(e => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          }
        );
      }
      throw error;
    }
  }

  /**
   * Get environment configuration
   */
  getEnv(): EnvConfig {
    if (!this.envConfig) {
      this.loadEnv();
    }
    return this.envConfig!;
  }

  /**
   * Get application configuration
   */
  getApp(): AppConfig {
    if (!this.appConfig) {
      this.loadApp();
    }
    return this.appConfig!;
  }

  /**
   * Check if a service is configured
   */
  isServiceConfigured(service: 'supabase' | 'clerk' | 'stripe' | 'vercel' | 'openai'): boolean {
    const env = this.getEnv();

    switch (service) {
      case 'supabase':
        return !!(env.LAYR_SUPABASE_URL && env.LAYR_SUPABASE_ANON_KEY);
      case 'clerk':
        return !!(env.LAYR_CLERK_PUBLISHABLE_KEY && env.LAYR_CLERK_SECRET_KEY);
      case 'stripe':
        return !!(env.LAYR_STRIPE_PUBLISHABLE_KEY && env.LAYR_STRIPE_SECRET_KEY);
      case 'vercel':
        return !!env.LAYR_VERCEL_TOKEN;
      case 'openai':
        return !!env.LAYR_OPENAI_API_KEY;
      default:
        return false;
    }
  }

  /**
   * Reset configuration (useful for testing)
   */
  reset(): void {
    this.envConfig = null;
    this.appConfig = null;
  }
}

// Export singleton instance
export const config = new ConfigManager();

// Export convenience functions
export const getEnvConfig = () => config.getEnv();
export const getAppConfig = () => config.getApp();
export const isServiceConfigured = (service: Parameters<typeof config.isServiceConfigured>[0]) =>
  config.isServiceConfigured(service);