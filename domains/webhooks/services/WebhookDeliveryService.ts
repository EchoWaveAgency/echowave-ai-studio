import { WebhookDelivery } from '../models/index';
import { ValidationError } from '../../platform/errors/errors';
import crypto from 'crypto';

export class WebhookDeliveryService {
  async recordDelivery(organizationId: string, data: Partial<WebhookDelivery>, userId?: string): Promise<WebhookDelivery> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    if (!data.webhookEventId || !data.endpointId) {
      throw new ValidationError('Webhook event ID and endpoint ID are required');
    }
    if (!data.requestBody || data.requestBody.trim().length === 0) {
      throw new ValidationError('Request body is required');
    }

    const delivery: WebhookDelivery = {
      id: `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      webhookEventId: data.webhookEventId,
      endpointId: data.endpointId,
      attempt: data.attempt || 1,
      requestHeaders: data.requestHeaders || {},
      requestBody: data.requestBody,
      responseCode: data.responseCode,
      responseHeaders: data.responseHeaders,
      responseBody: data.responseBody,
      duration: data.duration || 0,
      success: data.success || false,
      errorMessage: data.errorMessage,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      timestamp: new Date(),
      metadata: data.metadata || {},
    };

    // Mock storage - in production would use database
    return delivery;
  }

  async getDeliveryById(organizationId: string, deliveryId: string): Promise<WebhookDelivery | null> {
    if (!organizationId || !deliveryId) {
      return null;
    }
    // Mock storage - in production would query database with org isolation
    return null;
  }

  async getEventDeliveries(organizationId: string, webhookEventId: string, limit: number = 50, offset: number = 0): Promise<{ items: WebhookDelivery[]; total: number }> {
    if (!organizationId || !webhookEventId) {
      throw new ValidationError('Organization ID and webhook event ID are required');
    }
    // Mock storage - in production would query database with org isolation
    return { items: [], total: 0 };
  }

  async getEndpointDeliveries(organizationId: string, endpointId: string, limit: number = 50, offset: number = 0): Promise<{ items: WebhookDelivery[]; total: number }> {
    if (!organizationId || !endpointId) {
      throw new ValidationError('Organization ID and endpoint ID are required');
    }
    // Mock storage - in production would query database with org isolation
    return { items: [], total: 0 };
  }

  async getFailedDeliveries(organizationId: string, limit: number = 50, offset: number = 0): Promise<{ items: WebhookDelivery[]; total: number }> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    // Mock storage - in production would query database where success = false
    return { items: [], total: 0 };
  }

  async getSuccessfulDeliveries(organizationId: string, limit: number = 50, offset: number = 0): Promise<{ items: WebhookDelivery[]; total: number }> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    // Mock storage - in production would query database where success = true
    return { items: [], total: 0 };
  }

  async getDeliveriesByDateRange(organizationId: string, startDate: Date, endDate: Date, limit: number = 50, offset: number = 0): Promise<{ items: WebhookDelivery[]; total: number }> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    if (!startDate || !endDate) {
      throw new ValidationError('Start and end dates are required');
    }
    if (startDate > endDate) {
      throw new ValidationError('Start date must be before end date');
    }
    // Mock storage - in production would query database with date range
    return { items: [], total: 0 };
  }

  async getDeliveryStats(organizationId: string, endpointId?: string): Promise<{
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    averageResponseTime: number;
    successRate: number;
  }> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    // Mock storage - in production would calculate from webhook_deliveries
    return {
      totalDeliveries: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      averageResponseTime: 0,
      successRate: 0,
    };
  }

  async generateWebhookSignature(payload: string, secret: string, algorithm: string = 'sha256'): Promise<string> {
    return crypto
      .createHmac(algorithm, secret)
      .update(payload)
      .digest('hex');
  }

  async verifyWebhookSignature(payload: string, signature: string, secret: string, algorithm: string = 'sha256'): Promise<boolean> {
    const expectedSignature = await this.generateWebhookSignature(payload, secret, algorithm);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  async getDeliveryRetryHistory(organizationId: string, webhookEventId: string): Promise<WebhookDelivery[]> {
    if (!organizationId || !webhookEventId) {
      throw new ValidationError('Organization ID and webhook event ID are required');
    }
    // Mock storage - in production would query database and order by attempt
    return [];
  }

  async cleanupOldDeliveries(organizationId: string, daysToKeep: number = 30): Promise<number> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    if (daysToKeep < 1) {
      throw new ValidationError('Days to keep must be 1 or greater');
    }
    // Mock storage - in production would delete from database where timestamp < now() - interval
    return 0;
  }
}

export const webhookDeliveryService = new WebhookDeliveryService();
