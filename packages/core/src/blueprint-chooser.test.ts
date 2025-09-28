import { describe, it, expect } from 'vitest';
import { chooseBlueprint, type Intent } from './blueprint-chooser';

describe('Blueprint Chooser', () => {
  it('selects saas-starter when payments are configured', () => {
    const intent: Intent = {
      goal: 'Build a subscription service',
      audience: 'business',
      capabilities: ['auth', 'payments'],
      payments: { model: 'subscription' }
    };
    expect(chooseBlueprint(intent)).toBe('saas-starter');
  });

  it('selects form-to-db for simple data collection without auth', () => {
    const intent: Intent = {
      goal: 'Collect emails',
      audience: 'business',
      capabilities: ['collect_data'],
      auth: 'none'
    };
    expect(chooseBlueprint(intent)).toBe('form-to-db');
  });

  it('selects community-mini when community features are needed', () => {
    const intent: Intent = {
      goal: 'Create a forum',
      audience: 'community',
      capabilities: ['community', 'auth']
    };
    expect(chooseBlueprint(intent)).toBe('community-mini');
  });

  it('selects marketplace-lite for CRUD with auth', () => {
    const intent: Intent = {
      goal: 'Marketplace for products',
      audience: 'business',
      capabilities: ['crud', 'auth']
    };
    expect(chooseBlueprint(intent)).toBe('marketplace-lite');
  });

  it('defaults to static-landing for simple cases', () => {
    const intent: Intent = {
      goal: 'Landing page',
      audience: 'personal',
      capabilities: []
    };
    expect(chooseBlueprint(intent)).toBe('static-landing');
  });
});

describe('Edge cases', () => {
  it('handles intent with notifications', () => {
    const intent: Intent = {
      goal: 'App with notifications',
      audience: 'business',
      capabilities: ['notifications']
    };
    expect(chooseBlueprint(intent)).toBe('community-mini');
  });

  it('prioritizes payments over other features', () => {
    const intent: Intent = {
      goal: 'Community with subscriptions',
      audience: 'business',
      capabilities: ['community', 'crud'],
      payments: { model: 'subscription', plans: [] }
    };
    expect(chooseBlueprint(intent)).toBe('saas-starter');
  });
});