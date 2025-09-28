import { BaseAdapter } from './base-adapter';
import Stripe from 'stripe';

export class StripeAdapter extends BaseAdapter {
  private stripeSDK?: Stripe;

  getServiceName(): string {
    return 'stripe';
  }

  protected async initializeSDK(): Promise<void> {
    // Initialize Stripe SDK if API key is provided
    if (this.config.secretKey) {
      this.stripeSDK = new Stripe(this.config.secretKey, {
        apiVersion: '2023-10-16',
      });
    }
  }

  /**
   * Create Stripe products
   */
  async createProducts(products: ProductConfig[]): Promise<Product[]> {
    return this.executeWithFallback(
      async () => {
        const result = await this.mcpClient.execute('stripe', 'createProducts', { products });
        return result.products;
      },
      async () => {
        if (this.stripeSDK) {
          const createdProducts = [];
          for (const product of products) {
            const stripeProduct = await this.stripeSDK.products.create({
              name: product.name,
              description: product.description,
              metadata: product.metadata,
            });
            createdProducts.push({
              id: stripeProduct.id,
              name: stripeProduct.name,
              description: stripeProduct.description || '',
            });
          }
          return createdProducts;
        } else {
          console.log('Would create products:', products);
          return products.map(p => ({
            id: `prod_${p.name.toLowerCase().replace(/\s+/g, '_')}`,
            name: p.name,
            description: p.description || '',
          }));
        }
      }
    );
  }

  /**
   * Create pricing plans
   */
  async createPrices(prices: PriceConfig[]): Promise<Price[]> {
    return this.executeWithFallback(
      async () => {
        const result = await this.mcpClient.execute('stripe', 'createPrices', { prices });
        return result.prices;
      },
      async () => {
        if (this.stripeSDK) {
          const createdPrices = [];
          for (const price of prices) {
            const stripePrice = await this.stripeSDK.prices.create({
              product: price.productId,
              unit_amount: price.unitAmount,
              currency: price.currency,
              recurring: price.recurring ? {
                interval: price.recurring.interval,
                interval_count: price.recurring.intervalCount,
              } : undefined,
            });
            createdPrices.push({
              id: stripePrice.id,
              productId: price.productId,
              unitAmount: price.unitAmount,
              currency: price.currency,
            });
          }
          return createdPrices;
        } else {
          console.log('Would create prices:', prices);
          return prices.map(p => ({
            id: `price_${Date.now()}`,
            productId: p.productId,
            unitAmount: p.unitAmount,
            currency: p.currency,
          }));
        }
      }
    );
  }

  /**
   * Set up webhooks
   */
  async setupWebhooks(endpoints: WebhookEndpoint[]): Promise<boolean> {
    return this.executeWithFallback(
      async () => {
        await this.mcpClient.execute('stripe', 'setupWebhooks', { endpoints });
        return true;
      },
      async () => {
        if (this.stripeSDK) {
          for (const endpoint of endpoints) {
            await this.stripeSDK.webhookEndpoints.create({
              url: endpoint.url,
              enabled_events: endpoint.events as Stripe.WebhookEndpointCreateParams.EnabledEvent[],
            });
          }
          return true;
        } else {
          console.log('Would set up webhooks:', endpoints);
          return true;
        }
      }
    );
  }

  /**
   * Create a checkout session
   */
  async createCheckoutSession(config: CheckoutConfig): Promise<CheckoutSession> {
    return this.executeWithFallback(
      async () => {
        const result = await this.mcpClient.execute('stripe', 'createCheckoutSession', config);
        return {
          id: result.sessionId,
          url: result.url,
          success: true,
        };
      },
      async () => {
        if (this.stripeSDK) {
          const session = await this.stripeSDK.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: config.lineItems,
            mode: config.mode,
            success_url: config.successUrl,
            cancel_url: config.cancelUrl,
            customer_email: config.customerEmail,
          });
          return {
            id: session.id,
            url: session.url || '',
            success: true,
          };
        } else {
          console.log('Would create checkout session:', config);
          return {
            id: `cs_test_${Date.now()}`,
            url: 'https://checkout.stripe.com/test',
            success: true,
          };
        }
      }
    );
  }

  /**
   * Create a customer portal configuration
   */
  async setupCustomerPortal(config: PortalConfig): Promise<boolean> {
    return this.executeWithFallback(
      async () => {
        await this.mcpClient.execute('stripe', 'setupCustomerPortal', config);
        return true;
      },
      async () => {
        if (this.stripeSDK) {
          await this.stripeSDK.billingPortal.configurations.create({
            business_profile: {
              headline: config.headline,
            },
            features: {
              customer_update: {
                enabled: true,
                allowed_updates: ['email', 'tax_id'],
              },
              invoice_history: {
                enabled: true,
              },
              payment_method_update: {
                enabled: true,
              },
              subscription_cancel: {
                enabled: config.allowCancel || false,
              },
              subscription_pause: {
                enabled: config.allowPause || false,
              },
            },
          });
          return true;
        } else {
          console.log('Would set up customer portal:', config);
          return true;
        }
      }
    );
  }
}

interface ProductConfig {
  name: string;
  description?: string;
  metadata?: Record<string, string>;
}

interface Product {
  id: string;
  name: string;
  description: string;
}

interface PriceConfig {
  productId: string;
  unitAmount: number;
  currency: string;
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
    intervalCount: number;
  };
}

interface Price {
  id: string;
  productId: string;
  unitAmount: number;
  currency: string;
}

interface WebhookEndpoint {
  url: string;
  events: string[];
}

interface CheckoutConfig {
  lineItems: Array<{
    price: string;
    quantity: number;
  }>;
  mode: 'payment' | 'subscription';
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}

interface CheckoutSession {
  id: string;
  url: string;
  success: boolean;
}

interface PortalConfig {
  headline?: string;
  allowCancel?: boolean;
  allowPause?: boolean;
}