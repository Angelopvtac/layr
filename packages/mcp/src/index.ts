export * from './vercel-adapter';
export * from './supabase-adapter';
export * from './clerk-adapter';
export * from './stripe-adapter';
export * from './base-adapter';
export * from './mcp-client';

import { VercelAdapter } from './vercel-adapter';
import { SupabaseAdapter } from './supabase-adapter';
import { ClerkAdapter } from './clerk-adapter';
import { StripeAdapter } from './stripe-adapter';
import { MCPClient } from './mcp-client';

/**
 * Factory for creating MCP adapters with fallback to SDK/CLI
 */
export class AdapterFactory {
  private mcpClient: MCPClient;

  constructor() {
    this.mcpClient = new MCPClient();
  }

  async createVercelAdapter(config?: any): Promise<VercelAdapter> {
    const adapter = new VercelAdapter(this.mcpClient);
    await adapter.initialize(config);
    return adapter;
  }

  async createSupabaseAdapter(config?: any): Promise<SupabaseAdapter> {
    const adapter = new SupabaseAdapter(this.mcpClient);
    await adapter.initialize(config);
    return adapter;
  }

  async createClerkAdapter(config?: any): Promise<ClerkAdapter> {
    const adapter = new ClerkAdapter(this.mcpClient);
    await adapter.initialize(config);
    return adapter;
  }

  async createStripeAdapter(config?: any): Promise<StripeAdapter> {
    const adapter = new StripeAdapter(this.mcpClient);
    await adapter.initialize(config);
    return adapter;
  }

  /**
   * Check MCP availability for all adapters
   */
  async checkMCPAvailability(): Promise<{
    vercel: boolean;
    supabase: boolean;
    clerk: boolean;
    stripe: boolean;
  }> {
    return {
      vercel: await this.mcpClient.isAvailable('vercel'),
      supabase: await this.mcpClient.isAvailable('supabase'),
      clerk: await this.mcpClient.isAvailable('clerk'),
      stripe: await this.mcpClient.isAvailable('stripe'),
    };
  }
}