import { EventSubscription, WEBHOOK_EVENTS } from '../models/index';
import { ValidationError } from '../../platform/errors/errors';

export class EventSubscriptionService {
  async createSubscription(organizationId: string, userId: string, data: Partial<EventSubscription>): Promise<EventSubscription> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    if (!userId || userId.trim().length === 0) {
      throw new ValidationError('User ID is required');
    }
    if (!data.eventTypes || data.eventTypes.length === 0) {
      throw new ValidationError('At least one event type is required');
    }
    if (!data.channels || data.channels.length === 0) {
      throw new ValidationError('At least one channel is required');
    }

    for (const event of data.eventTypes) {
      if (!WEBHOOK_EVENTS.includes(event as any)) {
        throw new ValidationError(`Invalid event type: ${event}`);
      }
    }

    const validChannels = ['webhook', 'email', 'sms', 'in_app'];
    for (const channel of data.channels) {
      if (!validChannels.includes(channel)) {
        throw new ValidationError(`Invalid channel: ${channel}`);
      }
    }

    const subscription: EventSubscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      userId,
      eventTypes: data.eventTypes,
      channels: data.channels,
      filters: data.filters,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: data.metadata || {},
    };

    // Mock storage - in production would use database
    return subscription;
  }

  async getSubscriptionById(organizationId: string, subscriptionId: string): Promise<EventSubscription | null> {
    if (!organizationId || !subscriptionId) {
      return null;
    }
    // Mock storage - in production would query database with org isolation
    return null;
  }

  async getUserSubscriptions(organizationId: string, userId: string, limit: number = 50, offset: number = 0): Promise<{ items: EventSubscription[]; total: number }> {
    if (!organizationId || !userId) {
      throw new ValidationError('Organization ID and user ID are required');
    }
    // Mock storage - in production would query database with org isolation
    return { items: [], total: 0 };
  }

  async getOrganizationSubscriptions(organizationId: string, limit: number = 50, offset: number = 0): Promise<{ items: EventSubscription[]; total: number }> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    // Mock storage - in production would query database with org isolation
    return { items: [], total: 0 };
  }

  async updateSubscription(organizationId: string, subscriptionId: string, data: Partial<EventSubscription>): Promise<EventSubscription> {
    if (!organizationId || !subscriptionId) {
      throw new ValidationError('Organization ID and subscription ID are required');
    }

    const subscription = await this.getSubscriptionById(organizationId, subscriptionId);
    if (!subscription) {
      throw new ValidationError('Subscription not found');
    }

    if (data.eventTypes !== undefined) {
      if (data.eventTypes.length === 0) {
        throw new ValidationError('At least one event type is required');
      }
      for (const event of data.eventTypes) {
        if (!WEBHOOK_EVENTS.includes(event as any)) {
          throw new ValidationError(`Invalid event type: ${event}`);
        }
      }
      subscription.eventTypes = data.eventTypes;
    }

    if (data.channels !== undefined) {
      if (data.channels.length === 0) {
        throw new ValidationError('At least one channel is required');
      }
      const validChannels = ['webhook', 'email', 'sms', 'in_app'];
      for (const channel of data.channels) {
        if (!validChannels.includes(channel)) {
          throw new ValidationError(`Invalid channel: ${channel}`);
        }
      }
      subscription.channels = data.channels;
    }

    if (data.filters !== undefined) {
      subscription.filters = data.filters;
    }

    if (data.active !== undefined) {
      subscription.active = data.active;
    }

    if (data.metadata !== undefined) {
      subscription.metadata = { ...subscription.metadata, ...data.metadata };
    }

    subscription.updatedAt = new Date();

    // Mock storage - in production would update database
    return subscription;
  }

  async toggleSubscription(organizationId: string, subscriptionId: string, active: boolean): Promise<EventSubscription> {
    if (!organizationId || !subscriptionId) {
      throw new ValidationError('Organization ID and subscription ID are required');
    }

    const subscription = await this.getSubscriptionById(organizationId, subscriptionId);
    if (!subscription) {
      throw new ValidationError('Subscription not found');
    }

    subscription.active = active;
    subscription.updatedAt = new Date();

    // Mock storage - in production would update database
    return subscription;
  }

  async deleteSubscription(organizationId: string, subscriptionId: string): Promise<void> {
    if (!organizationId || !subscriptionId) {
      throw new ValidationError('Organization ID and subscription ID are required');
    }

    const subscription = await this.getSubscriptionById(organizationId, subscriptionId);
    if (!subscription) {
      throw new ValidationError('Subscription not found');
    }

    // Mock storage - in production would delete from database
  }

  async getSubscriptionsForEvent(organizationId: string, eventType: string): Promise<EventSubscription[]> {
    if (!organizationId || !eventType) {
      throw new ValidationError('Organization ID and event type are required');
    }
    // Mock storage - in production would query database where eventTypes contains eventType and active = true
    return [];
  }

  async addEventType(organizationId: string, subscriptionId: string, eventType: string): Promise<EventSubscription> {
    if (!organizationId || !subscriptionId || !eventType) {
      throw new ValidationError('Organization ID, subscription ID, and event type are required');
    }

    if (!WEBHOOK_EVENTS.includes(eventType as any)) {
      throw new ValidationError('Invalid event type');
    }

    const subscription = await this.getSubscriptionById(organizationId, subscriptionId);
    if (!subscription) {
      throw new ValidationError('Subscription not found');
    }

    if (!subscription.eventTypes.includes(eventType)) {
      subscription.eventTypes.push(eventType);
      subscription.updatedAt = new Date();
    }

    // Mock storage - in production would update database
    return subscription;
  }

  async removeEventType(organizationId: string, subscriptionId: string, eventType: string): Promise<EventSubscription> {
    if (!organizationId || !subscriptionId || !eventType) {
      throw new ValidationError('Organization ID, subscription ID, and event type are required');
    }

    const subscription = await this.getSubscriptionById(organizationId, subscriptionId);
    if (!subscription) {
      throw new ValidationError('Subscription not found');
    }

    if (subscription.eventTypes.length === 1) {
      throw new ValidationError('Cannot remove the last event type');
    }

    subscription.eventTypes = subscription.eventTypes.filter(e => e !== eventType);
    subscription.updatedAt = new Date();

    // Mock storage - in production would update database
    return subscription;
  }
}

export const eventSubscriptionService = new EventSubscriptionService();
