import { WebhookEvent, WEBHOOK_EVENTS, DELIVERY_STATUSES } from '../models/index';
import { ValidationError } from '../../platform/errors/errors';

export class WebhookEventService {
  async createEvent(organizationId: string, data: Partial<WebhookEvent>, endpointIds?: string[]): Promise<WebhookEvent> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    if (!data.eventType || !WEBHOOK_EVENTS.includes(data.eventType as any)) {
      throw new ValidationError('Valid event type is required');
    }
    if (!data.eventCategory) {
      throw new ValidationError('Event category is required');
    }

    // If no specific endpoint, this would be dispatched to all matching endpoints in production
    const endpointId = endpointIds?.[0] || `webhook_${Math.random().toString(36).substr(2, 9)}`;

    const event: WebhookEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      endpointId,
      eventType: data.eventType,
      eventCategory: data.eventCategory,
      payload: data.payload || {},
      status: 'pending',
      attempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: data.metadata || {},
    };

    // Mock storage - in production would use database
    return event;
  }

  async getEventById(organizationId: string, eventId: string): Promise<WebhookEvent | null> {
    if (!organizationId || !eventId) {
      return null;
    }
    // Mock storage - in production would query database with org isolation
    return null;
  }

  async getEndpointEvents(organizationId: string, endpointId: string, limit: number = 50, offset: number = 0): Promise<{ items: WebhookEvent[]; total: number }> {
    if (!organizationId || !endpointId) {
      throw new ValidationError('Organization ID and endpoint ID are required');
    }
    // Mock storage - in production would query database with org isolation
    return { items: [], total: 0 };
  }

  async getEventsByStatus(organizationId: string, status: string, limit: number = 50, offset: number = 0): Promise<{ items: WebhookEvent[]; total: number }> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    if (!DELIVERY_STATUSES.includes(status as any)) {
      throw new ValidationError('Invalid status');
    }
    // Mock storage - in production would query database
    return { items: [], total: 0 };
  }

  async getPendingEvents(organizationId: string, limit: number = 100): Promise<WebhookEvent[]> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    // Mock storage - in production would query database where status = 'pending' or status = 'failed'
    return [];
  }

  async getFailedEvents(organizationId: string, limit: number = 50, offset: number = 0): Promise<{ items: WebhookEvent[]; total: number }> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    // Mock storage - in production would query database where status = 'failed' or status = 'failed_max_retries'
    return { items: [], total: 0 };
  }

  async recordDeliveryAttempt(organizationId: string, eventId: string, responseCode: number, responseBody: string, success: boolean): Promise<WebhookEvent> {
    if (!organizationId || !eventId) {
      throw new ValidationError('Organization ID and event ID are required');
    }

    const event = await this.getEventById(organizationId, eventId);
    if (!event) {
      throw new ValidationError('Event not found');
    }

    event.attempts += 1;
    event.lastAttemptAt = new Date();
    event.responseCode = responseCode;
    event.responseBody = responseBody;
    event.updatedAt = new Date();

    if (success) {
      event.status = 'delivered';
      event.deliveredAt = new Date();
    } else {
      if (event.attempts >= 5) {
        event.status = 'failed_max_retries';
      } else {
        event.status = 'failed';
        event.nextRetryAt = this.calculateNextRetry(event.attempts);
      }
    }

    // Mock storage - in production would update database
    return event;
  }

  async retryEvent(organizationId: string, eventId: string): Promise<WebhookEvent> {
    if (!organizationId || !eventId) {
      throw new ValidationError('Organization ID and event ID are required');
    }

    const event = await this.getEventById(organizationId, eventId);
    if (!event) {
      throw new ValidationError('Event not found');
    }

    if (event.status !== 'failed' && event.status !== 'failed_max_retries') {
      throw new ValidationError('Only failed events can be retried');
    }

    event.status = 'pending';
    event.attempts = 0;
    event.failureReason = undefined;
    event.updatedAt = new Date();

    // Mock storage - in production would update database
    return event;
  }

  async retryAllFailedEvents(organizationId: string): Promise<{ retriedCount: number }> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }

    // Mock storage - in production would query and update all failed events
    return { retriedCount: 0 };
  }

  async markEventAsSkipped(organizationId: string, eventId: string, reason: string): Promise<WebhookEvent> {
    if (!organizationId || !eventId) {
      throw new ValidationError('Organization ID and event ID are required');
    }
    if (!reason || reason.trim().length === 0) {
      throw new ValidationError('Skip reason is required');
    }

    const event = await this.getEventById(organizationId, eventId);
    if (!event) {
      throw new ValidationError('Event not found');
    }

    event.status = 'failed';
    event.failureReason = `Skipped: ${reason}`;
    event.updatedAt = new Date();

    // Mock storage - in production would update database
    return event;
  }

  async getEventsByType(organizationId: string, eventType: string, limit: number = 50, offset: number = 0): Promise<{ items: WebhookEvent[]; total: number }> {
    if (!organizationId || !eventType) {
      throw new ValidationError('Organization ID and event type are required');
    }
    // Mock storage - in production would query database where eventType = $1
    return { items: [], total: 0 };
  }

  async getRecentFailures(organizationId: string, hours: number = 24): Promise<WebhookEvent[]> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    if (hours < 1) {
      throw new ValidationError('Hours must be 1 or greater');
    }
    // Mock storage - in production would query database where status like 'failed%' and updatedAt > now() - interval
    return [];
  }

  private calculateNextRetry(attemptCount: number): Date {
    const delays = [1000, 2000, 4000, 8000, 16000]; // milliseconds
    const delay = delays[Math.min(attemptCount - 1, delays.length - 1)];
    const nextRetry = new Date();
    nextRetry.setTime(nextRetry.getTime() + delay);
    return nextRetry;
  }
}

export const webhookEventService = new WebhookEventService();
