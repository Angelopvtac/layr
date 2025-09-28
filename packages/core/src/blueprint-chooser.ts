import { createLogger } from './logger';

export interface Intent {
  goal: string;
  audience: 'personal' | 'community' | 'business' | 'nonprofit' | 'education';
  capabilities: string[];
  entities?: Array<{
    name: string;
    fields: Array<{
      name: string;
      type: string;
      required?: boolean;
    }>;
  }>;
  auth?: 'none' | 'magic_link' | 'social_login' | 'email_password';
  payments?: {
    model: 'none' | 'one_time' | 'subscription' | 'usage';
    plans?: Array<{
      name: string;
      priceMonthly: number;
      features: string[];
    }>;
  };
  brand?: {
    name: string;
    tagline?: string;
  };
  nonGoals?: string[];
}

export type BlueprintId =
  | 'saas-starter'
  | 'form-to-db'
  | 'community-mini'
  | 'marketplace-lite'
  | 'static-landing';

// Cache for blueprint selection results
const blueprintCache = new Map<string, BlueprintId>();
const logger = createLogger('blueprint-chooser');

/**
 * Generate a cache key for an intent
 */
function getIntentCacheKey(intent: Intent): string {
  return JSON.stringify({
    audience: intent.audience,
    capabilities: intent.capabilities?.sort(),
    auth: intent.auth,
    payments: intent.payments?.model
  });
}

/**
 * Chooses the most appropriate blueprint based on intent
 */
export function chooseBlueprint(intent: Intent): BlueprintId {
  // Check cache first
  const cacheKey = getIntentCacheKey(intent);
  if (blueprintCache.has(cacheKey)) {
    const cached = blueprintCache.get(cacheKey)!;
    logger.debug('Using cached blueprint selection', { blueprint: cached });
    return cached;
  }

  const caps = new Set(intent.capabilities || []);

  let selected: BlueprintId;

  // Payment-based apps get full SaaS treatment
  if (intent.payments?.model && intent.payments.model !== 'none') {
    selected = 'saas-starter';
  }
  // Simple data collection without auth
  else if (caps.has('collect_data') && !caps.has('auth') && intent.auth === 'none') {
    selected = 'form-to-db';
  }
  // Community features
  else if (caps.has('community') || caps.has('notifications') || caps.has('social')) {
    selected = 'community-mini';
  }
  // CRUD with auth suggests marketplace
  else if (caps.has('crud') && caps.has('auth')) {
    selected = 'marketplace-lite';
  }
  // Default to landing page
  else {
    selected = 'static-landing';
  }

  // Cache the result
  blueprintCache.set(cacheKey, selected);
  logger.info('Blueprint selected', {
    blueprint: selected,
    audience: intent.audience,
    capabilities: Array.from(caps)
  });

  return selected;
}

/**
 * Blueprint metadata
 */
export const blueprintMetadata: Record<BlueprintId, {
  name: string;
  description: string;
  features: string[];
  stack: string[];
}> = {
  'saas-starter': {
    name: 'SaaS Starter',
    description: 'Full-featured SaaS application with auth, payments, and CRUD',
    features: ['Authentication', 'Payments', 'CRUD', 'Email', 'Admin'],
    stack: ['Next.js', 'Supabase', 'Clerk', 'Stripe', 'Resend']
  },
  'form-to-db': {
    name: 'Form to Database',
    description: 'Public form that saves to database',
    features: ['Data Collection', 'Public Access'],
    stack: ['Next.js', 'Supabase']
  },
  'community-mini': {
    name: 'Community Mini',
    description: 'Simple community with posts and comments',
    features: ['Authentication', 'Posts', 'Comments', 'Profiles'],
    stack: ['Next.js', 'Supabase', 'Clerk']
  },
  'marketplace-lite': {
    name: 'Marketplace Lite',
    description: 'Basic marketplace with listings and checkout',
    features: ['Authentication', 'Listings', 'Checkout', 'Search'],
    stack: ['Next.js', 'Supabase', 'Clerk', 'Stripe']
  },
  'static-landing': {
    name: 'Static Landing',
    description: 'Marketing landing page with waitlist',
    features: ['Landing Page', 'Waitlist', 'Contact Form'],
    stack: ['Next.js', 'Supabase']
  }
};