import Ajv from 'ajv';
import { z } from 'zod';
import intentSchema from '../intent.schema.json';
import type { Intent } from './blueprint-chooser';

const ajv = new Ajv({ allErrors: true });
const validateIntent = ajv.compile(intentSchema);

/**
 * Validate intent JSON against schema
 */
export function validateIntentJson(data: unknown): { valid: boolean; errors?: string[] } {
  const valid = validateIntent(data);

  if (!valid) {
    const errors = validateIntent.errors?.map(err =>
      `${err.instancePath} ${err.message}`
    ) || [];
    return { valid: false, errors };
  }

  return { valid: true };
}

/**
 * Zod schema for runtime validation
 */
export const IntentSchema = z.object({
  goal: z.string().min(1, 'Goal is required'),
  audience: z.enum(['personal', 'community', 'business', 'nonprofit', 'education']),
  capabilities: z.array(z.string()),
  entities: z.array(z.object({
    name: z.string(),
    fields: z.array(z.object({
      name: z.string(),
      type: z.enum(['string', 'text', 'number', 'boolean', 'date', 'email', 'url', 'image', 'json']),
      required: z.boolean().optional()
    }))
  })).optional(),
  auth: z.enum(['none', 'magic_link', 'social_login', 'email_password']).optional(),
  payments: z.object({
    model: z.enum(['none', 'one_time', 'subscription', 'usage']),
    plans: z.array(z.object({
      name: z.string(),
      priceMonthly: z.number(),
      features: z.array(z.string())
    })).optional()
  }).optional(),
  brand: z.object({
    name: z.string(),
    tagline: z.string().optional()
  }).optional(),
  nonGoals: z.array(z.string()).optional()
});

export function parseIntent(data: unknown): Intent {
  return IntentSchema.parse(data);
}