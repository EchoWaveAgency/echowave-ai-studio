import { WebhookEndpoint, WEBHOOK_EVENTS, AUTHENTICATION_TYPES } from '../models/index';
import { ValidationError } from '../../platform/errors/errors';
import crypto from 'crypto';

export class WebhookEndpointService {
  async createEndpoint(organizationId: string, data: Partial<WebhookEndpoint>, userId: string): Promise<WebhookEndpoint> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Endpoint name is required');
    }
    if (!data.url || !this.isValidUrl(data.url)) {
      throw new ValidationError('Valid URL is required');
    }
    if (!data.events || data.events.length === 0) {
      throw new ValidationError('At least one event type is required');
    }

    for (const event of data.events) {
      if (!WEBHOOK_EVENTS.includes(event as any)) {
        throw new ValidationError(`Invalid event type: ${event}`);
      }
    }

    if (data.authentication) {
      if (!AUTHENTICATION_TYPES.includes(data.authentication.type as any)) {
        throw new ValidationError('Invalid authentication type');
      }
    }

    const endpoint: WebhookEndpoint = {
      id: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      name: data.name,
      url: data.url,
      active: true,
      events: data.events,
      retryPolicy: data.retryPolicy || {
        maxRetries: 5,
        backoffMultiplier: 2,
        initialDelayMs: 1000,
      },
      headers: data.headers || {},
      authentication: data.authentication,
      rateLimit: data.rateLimit,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      consecutiveFailures: 0,
      metadata: data.metadata || {},
    };

    // Mock storage - in production would use database
    return endpoint;
  }

  async getEndpointById(organizationId: string, endpointId: string): Promise<WebhookEndpoint | null> {
    if (!organizationId || !endpointId) {
      return null;
    }
    // Mock storage - in production would query database with org isolation
    return null;
  }

  async getOrganizationEndpoints(organizationId: string, limit: number = 50, offset: number = 0): Promise<{ items: WebhookEndpoint[]; total: number }> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    // Mock storage - in production would query database with org isolation
    return { items: [], total: 0 };
  }

  async getActiveEndpoints(organizationId: string, eventType: string): Promise<WebhookEndpoint[]> {
    if (!organizationId || !eventType) {
      throw new ValidationError('Organization ID and event type are required');
    }
    // Mock storage - in production would query database where active = true and events contains eventType
    return [];
  }

  async updateEndpoint(organizationId: string, endpointId: string, data: Partial<WebhookEndpoint>): Promise<WebhookEndpoint> {
    if (!organizationId || !endpointId) {
      throw new ValidationError('Organization ID and endpoint ID are required');
    }

    const endpoint = await this.getEndpointById(organizationId, endpointId);
    if (!endpoint) {
      throw new ValidationError('Endpoint not found');
    }

    if (data.name !== undefined) {
      if (data.name.trim().length === 0) {
        throw new ValidationError('Endpoint name cannot be empty');
      }
      endpoint.name = data.name;
    }

    if (data.url !== undefined) {
      if (!this.isValidUrl(data.url)) {
        throw new ValidationError('Invalid URL');
      }
      endpoint.url = data.url;
    }

    if (data.events !== undefined) {
      if (data.events.length === 0) {
        throw new ValidationError('At least one event type is required');
      }
      for (const event of data.events) {
        if (!WEBHOOK_EVENTS.includes(event as any)) {
          throw new ValidationError(`Invalid event type: ${event}`);
        }
      }
      endpoint.events = data.events;
    }

    if (data.active !== undefined) {
      endpoint.active = data.active;
    }

    if (data.retryPolicy !== undefined) {
      endpoint.retryPolicy = data.retryPolicy;
    }

    if (data.headers !== undefined) {
      endpoint.headers = data.headers;
    }

    if (data.authentication !== undefined) {
      endpoint.authentication = data.authentication;
    }

    if (data.metadata !== undefined) {
      endpoint.metadata = { ...endpoint.metadata, ...data.metadata };
    }

    endpoint.updatedAt = new Date();

    // Mock storage - in production would update database
    return endpoint;
  }

  async toggleEndpoint(organizationId: string, endpointId: string, active: boolean): Promise<WebhookEndpoint> {
    if (!organizationId || !endpointId) {
      throw new ValidationError('Organization ID and endpoint ID are required');
    }

    const endpoint = await this.getEndpointById(organizationId, endpointId);
    if (!endpoint) {
      throw new ValidationError('Endpoint not found');
    }

    endpoint.active = active;
    endpoint.updatedAt = new Date();

    // Mock storage - in production would update database
    return endpoint;
  }

  async testEndpoint(organizationId: string, endpointId: string): Promise<{ success: boolean; status: number; message: string }> {
    if (!organizationId || !endpointId) {
      throw new ValidationError('Organization ID and endpoint ID are required');
    }

    const endpoint = await this.getEndpointById(organizationId, endpointId);
    if (!endpoint) {
      throw new ValidationError('Endpoint not found');
    }

    // Mock test - in production would make actual HTTP request
    return {
      success: true,
      status: 200,
      message: 'Webhook endpoint is working correctly',
    };
  }

  async deleteEndpoint(organizationId: string, endpointId: string): Promise<void> {
    if (!organizationId || !endpointId) {
      throw new ValidationError('Organization ID and endpoint ID are required');
    }

    const endpoint = await this.getEndpointById(organizationId, endpointId);
    if (!endpoint) {
      throw new ValidationError('Endpoint not found');
    }

    // Mock storage - in production would delete from database
  }

  async getEndpointStats(organizationId: string, endpointId: string): Promise<{
    totalEvents: number;
    deliveredEvents: number;
    failedEvents: number;
    lastDelivery?: Date;
    lastFailure?: Date;
  }> {
    if (!organizationId || !endpointId) {
      throw new ValidationError('Organization ID and endpoint ID are required');
    }

    // Mock storage - in production would calculate from webhook_events and webhook_deliveries
    return {
      totalEvents: 0,
      deliveredEvents: 0,
      failedEvents: 0,
    };
  }

  async rotateAuthenticationSecret(organizationId: string, endpointId: string): Promise<WebhookEndpoint> {
    if (!organizationId || !endpointId) {
      throw new ValidationError('Organization ID and endpoint ID are required');
    }

    const endpoint = await this.getEndpointById(organizationId, endpointId);
    if (!endpoint) {
      throw new ValidationError('Endpoint not found');
    }

    if (!endpoint.authentication) {
      throw new ValidationError('Endpoint does not have authentication configured');
    }

    if (endpoint.authentication.type === 'api_key') {
      endpoint.authentication.credentials.api_key = this.generateSecret();
    } else if (endpoint.authentication.type === 'bearer') {
      endpoint.authentication.credentials.bearer_token = this.generateSecret();
    } else if (endpoint.authentication.type === 'hmac') {
      endpoint.authentication.credentials.hmac_secret = this.generateSecret();
    }

    endpoint.updatedAt = new Date();

    // Mock storage - in production would update database
    return endpoint;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  }

  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

export const webhookEndpointService = new WebhookEndpointService();
