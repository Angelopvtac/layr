import { describe, it, expect, beforeEach } from 'vitest';
import { AdapterFactory } from '../src/index';
import { MCPClient } from '../src/mcp-client';

describe('MCP Adapters', () => {
  let factory: AdapterFactory;

  beforeEach(() => {
    factory = new AdapterFactory();
  });

  describe('AdapterFactory', () => {
    it('should check MCP availability for all services', async () => {
      const availability = await factory.checkMCPAvailability();

      expect(availability).toHaveProperty('vercel');
      expect(availability).toHaveProperty('supabase');
      expect(availability).toHaveProperty('clerk');
      expect(availability).toHaveProperty('stripe');

      // All should be false by default (MCP not available)
      expect(availability.vercel).toBe(false);
      expect(availability.supabase).toBe(false);
      expect(availability.clerk).toBe(false);
      expect(availability.stripe).toBe(false);
    });

    it('should create Vercel adapter', async () => {
      const adapter = await factory.createVercelAdapter();
      expect(adapter).toBeDefined();
      expect(adapter.getServiceName()).toBe('vercel');
    });

    it('should create Supabase adapter', async () => {
      const adapter = await factory.createSupabaseAdapter();
      expect(adapter).toBeDefined();
      expect(adapter.getServiceName()).toBe('supabase');
    });

    it('should create Clerk adapter', async () => {
      const adapter = await factory.createClerkAdapter();
      expect(adapter).toBeDefined();
      expect(adapter.getServiceName()).toBe('clerk');
    });

    it('should create Stripe adapter', async () => {
      const adapter = await factory.createStripeAdapter();
      expect(adapter).toBeDefined();
      expect(adapter.getServiceName()).toBe('stripe');
    });
  });

  describe('MCP Client', () => {
    let client: MCPClient;

    beforeEach(() => {
      client = new MCPClient();
    });

    it('should report services as unavailable by default', async () => {
      expect(await client.isAvailable('vercel')).toBe(false);
      expect(await client.isAvailable('supabase')).toBe(false);
      expect(await client.isAvailable('clerk')).toBe(false);
      expect(await client.isAvailable('stripe')).toBe(false);
    });

    it('should allow setting availability', async () => {
      client.setAvailability('vercel', true);
      expect(await client.isAvailable('vercel')).toBe(true);
    });

    it('should throw error when executing on unavailable service', async () => {
      await expect(
        client.execute('vercel', 'deploy')
      ).rejects.toThrow('MCP server for vercel is not available');
    });

    it('should execute command on available service', async () => {
      client.setAvailability('vercel', true);
      const result = await client.execute('vercel', 'deploy', { path: '/test' });

      expect(result).toEqual({
        success: true,
        service: 'vercel',
        command: 'deploy',
        params: { path: '/test' },
        result: 'Mock result from vercel MCP server'
      });
    });
  });

  describe('Adapter Fallback Behavior', () => {
    it('Vercel adapter should fallback to SDK when MCP unavailable', async () => {
      const adapter = await factory.createVercelAdapter();
      const result = await adapter.deploy('/test/project');

      // Should use fallback and return mock result
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('deploymentId');
      expect(result.success).toBe(true);
    });

    it('Supabase adapter should fallback to SDK when MCP unavailable', async () => {
      const adapter = await factory.createSupabaseAdapter();
      const result = await adapter.createProject('test-project');

      expect(result).toHaveProperty('projectId');
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('anonKey');
      expect(result.success).toBe(true);
    });

    it('Clerk adapter should fallback to SDK when MCP unavailable', async () => {
      const adapter = await factory.createClerkAdapter();
      const result = await adapter.createApp('test-app', 'nextjs');

      expect(result).toHaveProperty('appId');
      expect(result).toHaveProperty('publishableKey');
      expect(result).toHaveProperty('secretKey');
      expect(result.success).toBe(true);
    });

    it('Stripe adapter should fallback to SDK when MCP unavailable', async () => {
      const adapter = await factory.createStripeAdapter();
      const products = await adapter.createProducts([
        { name: 'Test Product', description: 'A test product' }
      ]);

      expect(products).toHaveLength(1);
      expect(products[0]).toHaveProperty('id');
      expect(products[0].name).toBe('Test Product');
    });
  });
});