import { MCPClient } from './mcp-client';

/**
 * Base adapter interface for all service integrations
 */
export abstract class BaseAdapter {
  protected mcpClient: MCPClient;
  protected mcpAvailable: boolean = false;
  protected config: any;

  constructor(mcpClient: MCPClient) {
    this.mcpClient = mcpClient;
  }

  /**
   * Initialize the adapter with configuration
   */
  async initialize(config?: any): Promise<void> {
    this.config = config || {};
    this.mcpAvailable = await this.mcpClient.isAvailable(this.getServiceName());

    if (!this.mcpAvailable) {
      console.log(`MCP not available for ${this.getServiceName()}, falling back to SDK/CLI`);
      await this.initializeSDK();
    }
  }

  /**
   * Get the service name for this adapter
   */
  abstract getServiceName(): string;

  /**
   * Initialize SDK/CLI fallback
   */
  protected abstract initializeSDK(): Promise<void>;

  /**
   * Execute an operation with MCP fallback to SDK
   */
  protected async executeWithFallback<T>(
    mcpOperation: () => Promise<T>,
    sdkOperation: () => Promise<T>
  ): Promise<T> {
    if (this.mcpAvailable) {
      try {
        return await mcpOperation();
      } catch (error) {
        console.warn(`MCP operation failed, falling back to SDK: ${error}`);
        this.mcpAvailable = false;
      }
    }

    return await sdkOperation();
  }
}