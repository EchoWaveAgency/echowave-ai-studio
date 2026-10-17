import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WebhookEndpointService } from '../../domains/webhooks/services/WebhookEndpointService';
import { WebhookEventService } from '../../domains/webhooks/services/WebhookEventService';
import { WebhookDeliveryService } from '../../domains/webhooks/services/WebhookDeliveryService';
import { EventSubscriptionService } from '../../domains/webhooks/services/EventSubscriptionService';
import { WebhookLogService } from '../../domains/webhooks/services/WebhookLogService';

describe('Phase 10: Webhooks & Real-time Events', () => {
  const mockDb = {
    query: async (sql: string, params: any[]) => ({ rows: [] }),
    transaction: async (fn: Function) => fn(mockDb),
  };

  let endpointService: WebhookEndpointService;
  let eventService: WebhookEventService;
  let deliveryService: WebhookDeliveryService;
  let subscriptionService: EventSubscriptionService;
  let logService: WebhookLogService;

  const organizationId = 'org-test-001';
  const userId = 'user-test-001';

  beforeEach(() => {
    endpointService = new WebhookEndpointService(mockDb as any);
    eventService = new WebhookEventService(mockDb as any);
    deliveryService = new WebhookDeliveryService(mockDb as any);
    subscriptionService = new EventSubscriptionService(mockDb as any);
    logService = new WebhookLogService(mockDb as any);
  });

  describe('WebhookEndpointService', () => {
    it('should create a webhook endpoint with valid data', async () => {
      const input = {
        url: 'https://example.com/webhook',
        description: 'Test webhook endpoint',
        eventTypes: ['subscription.created', 'invoice.issued'],
        authenticationType: 'hmac' as const,
        active: true,
        retryPolicy: { maxRetries: 3, backoffMultiplier: 2, initialDelayMs: 1000 },
        rateLimit: { requestsPerSecond: 100, burst: 1000 },
      };

      const endpoint = await endpointService.createEndpoint(organizationId, input);
      expect(endpoint).toBeDefined();
      expect(endpoint.url).toBe(input.url);
      expect(endpoint.organizationId).toBe(organizationId);
      expect(endpoint.active).toBe(true);
    });

    it('should validate webhook URL format', async () => {
      const input = {
        url: 'not-a-valid-url',
        description: 'Test',
        eventTypes: ['subscription.created'],
        authenticationType: 'hmac' as const,
        retryPolicy: { maxRetries: 3, backoffMultiplier: 2, initialDelayMs: 1000 },
        rateLimit: { requestsPerSecond: 100, burst: 1000 },
      };

      await expect(endpointService.createEndpoint(organizationId, input)).rejects.toThrow(
        'Invalid webhook URL'
      );
    });

    it('should require at least one event type', async () => {
      const input = {
        url: 'https://example.com/webhook',
        description: 'Test',
        eventTypes: [] as string[],
        authenticationType: 'hmac' as const,
        retryPolicy: { maxRetries: 3, backoffMultiplier: 2, initialDelayMs: 1000 },
        rateLimit: { requestsPerSecond: 100, burst: 1000 },
      };

      await expect(endpointService.createEndpoint(organizationId, input)).rejects.toThrow(
        'At least one event type is required'
      );
    });

    it('should support all authentication types', async () => {
      const authTypes = ['api_key', 'bearer', 'hmac', 'oauth'] as const;

      for (const authType of authTypes) {
        const endpoint = await endpointService.createEndpoint(organizationId, {
          url: `https://example.com/webhook/${authType}`,
          description: `Test ${authType}`,
          eventTypes: ['subscription.created'],
          authenticationType: authType,
          retryPolicy: { maxRetries: 3, backoffMultiplier: 2, initialDelayMs: 1000 },
          rateLimit: { requestsPerSecond: 100, burst: 1000 },
        });

        expect(endpoint.authenticationType).toBe(authType);
      }
    });

    it('should test webhook endpoint', async () => {
      const endpoint = await endpointService.createEndpoint(organizationId, {
        url: 'https://example.com/webhook',
        description: 'Test',
        eventTypes: ['subscription.created'],
        authenticationType: 'hmac' as const,
        retryPolicy: { maxRetries: 3, backoffMultiplier: 2, initialDelayMs: 1000 },
        rateLimit: { requestsPerSecond: 100, burst: 1000 },
      });

      const result = await endpointService.testEndpoint(organizationId, endpoint.id);
      expect(result).toBeDefined();
      expect(result.statusCode).toBeGreaterThanOrEqual(200);
    });

    it('should rotate authentication secret', async () => {
      const endpoint = await endpointService.createEndpoint(organizationId, {
        url: 'https://example.com/webhook',
        description: 'Test',
        eventTypes: ['subscription.created'],
        authenticationType: 'hmac' as const,
        retryPolicy: { maxRetries: 3, backoffMultiplier: 2, initialDelayMs: 1000 },
        rateLimit: { requestsPerSecond: 100, burst: 1000 },
      });

      const oldSecret = endpoint.authenticationSecret;
      const updated = await endpointService.rotateAuthenticationSecret(organizationId, endpoint.id);

      expect(updated.authenticationSecret).not.toBe(oldSecret);
      expect(updated.authenticationSecret).toBeDefined();
    });

    it('should toggle endpoint active status', async () => {
      const endpoint = await endpointService.createEndpoint(organizationId, {
        url: 'https://example.com/webhook',
        description: 'Test',
        eventTypes: ['subscription.created'],
        authenticationType: 'hmac' as const,
        retryPolicy: { maxRetries: 3, backoffMultiplier: 2, initialDelayMs: 1000 },
        rateLimit: { requestsPerSecond: 100, burst: 1000 },
      });

      const toggled = await endpointService.toggleEndpoint(organizationId, endpoint.id);
      expect(toggled.active).not.toBe(endpoint.active);
    });

    it('should retrieve endpoint statistics', async () => {
      const endpoint = await endpointService.createEndpoint(organizationId, {
        url: 'https://example.com/webhook',
        description: 'Test',
        eventTypes: ['subscription.created'],
        authenticationType: 'hmac' as const,
        retryPolicy: { maxRetries: 3, backoffMultiplier: 2, initialDelayMs: 1000 },
        rateLimit: { requestsPerSecond: 100, burst: 1000 },
      });

      const stats = await endpointService.getEndpointStats(organizationId, endpoint.id);
      expect(stats).toBeDefined();
      expect(stats.totalEvents).toBeGreaterThanOrEqual(0);
      expect(stats.successfulDeliveries).toBeGreaterThanOrEqual(0);
      expect(stats.failedDeliveries).toBeGreaterThanOrEqual(0);
    });
  });

  describe('WebhookEventService', () => {
    it('should create a webhook event', async () => {
      const event = await eventService.createEvent(organizationId, {
        eventType: 'subscription.created',
        payload: { subscriptionId: 'sub-001', customerId: 'cust-001' },
        triggeredBy: userId,
      });

      expect(event).toBeDefined();
      expect(event.organizationId).toBe(organizationId);
      expect(event.eventType).toBe('subscription.created');
      expect(event.status).toBe('pending');
    });

    it('should transition event status through lifecycle', async () => {
      const event = await eventService.createEvent(organizationId, {
        eventType: 'invoice.issued',
        payload: { invoiceId: 'inv-001' },
        triggeredBy: userId,
      });

      expect(event.status).toBe('pending');

      const updated = await eventService.recordDeliveryAttempt(organizationId, event.id, {
        success: true,
        statusCode: 200,
        duration: 150,
      });

      expect(updated.status).toBe('delivered');
    });

    it('should handle failed delivery attempts with exponential backoff', async () => {
      const event = await eventService.createEvent(organizationId, {
        eventType: 'payment.completed',
        payload: { paymentId: 'pay-001' },
        triggeredBy: userId,
      });

      let current = event;
      const expectedDelays = [1000, 2000, 4000, 8000, 16000];

      for (let i = 0; i < 5; i++) {
        current = await eventService.recordDeliveryAttempt(organizationId, current.id, {
          success: false,
          statusCode: 500,
          duration: 100,
        });

        if (i < 5) {
          const expectedNextRetry = new Date(current.createdAt).getTime() + expectedDelays[i];
          expect(current.nextRetryAt?.getTime()).toBeCloseTo(expectedNextRetry, -3);
        }
      }

      expect(current.status).toBe('failed_max_retries');
    });

    it('should mark event as skipped', async () => {
      const event = await eventService.createEvent(organizationId, {
        eventType: 'contact.created',
        payload: { contactId: 'cont-001' },
        triggeredBy: userId,
      });

      const skipped = await eventService.markEventAsSkipped(
        organizationId,
        event.id,
        'No active subscriptions for this event type'
      );

      expect(skipped.status).toBe('skipped');
    });

    it('should query events by status', async () => {
      const pending = await eventService.getPendingEvents(organizationId, 10, 0);
      expect(pending).toBeDefined();
      expect(Array.isArray(pending.items)).toBe(true);

      const failed = await eventService.getFailedEvents(organizationId, 10, 0);
      expect(failed).toBeDefined();
    });

    it('should retrieve recent failures', async () => {
      const failures = await eventService.getRecentFailures(organizationId, 10);
      expect(Array.isArray(failures)).toBe(true);
    });

    it('should retry all failed events', async () => {
      const result = await eventService.retryAllFailedEvents(organizationId);
      expect(result).toBeDefined();
      expect(result.retriedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('WebhookDeliveryService', () => {
    it('should record webhook delivery', async () => {
      const delivery = await deliveryService.recordDelivery(organizationId, {
        webhookEventId: 'event-001',
        endpointId: 'endpoint-001',
        requestBody: JSON.stringify({ test: 'payload' }),
        requestHeaders: { 'Content-Type': 'application/json' },
        responseCode: 200,
        responseBody: JSON.stringify({ success: true }),
        duration: 150,
      });

      expect(delivery).toBeDefined();
      expect(delivery.organizationId).toBe(organizationId);
      expect(delivery.responseCode).toBe(200);
      expect(delivery.success).toBe(true);
    });

    it('should track failed deliveries', async () => {
      const delivery = await deliveryService.recordDelivery(organizationId, {
        webhookEventId: 'event-002',
        endpointId: 'endpoint-001',
        requestBody: JSON.stringify({ test: 'payload' }),
        requestHeaders: {},
        responseCode: 500,
        responseBody: JSON.stringify({ error: 'Server error' }),
        duration: 200,
      });

      expect(delivery.success).toBe(false);
      expect(delivery.responseCode).toBe(500);
    });

    it('should generate valid HMAC signature', () => {
      const secret = 'test-secret-key';
      const body = JSON.stringify({ test: 'data' });

      const signature = deliveryService.generateWebhookSignature(secret, body);
      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(signature.length).toBeGreaterThan(0);
    });

    it('should verify valid HMAC signature', () => {
      const secret = 'test-secret-key';
      const body = JSON.stringify({ test: 'data' });
      const signature = deliveryService.generateWebhookSignature(secret, body);

      const isValid = deliveryService.verifyWebhookSignature(secret, body, signature);
      expect(isValid).toBe(true);
    });

    it('should reject invalid HMAC signature', () => {
      const secret = 'test-secret-key';
      const body = JSON.stringify({ test: 'data' });
      const invalidSignature = 'invalid-signature';

      const isValid = deliveryService.verifyWebhookSignature(secret, body, invalidSignature);
      expect(isValid).toBe(false);
    });

    it('should retrieve delivery retry history', async () => {
      const delivery = await deliveryService.recordDelivery(organizationId, {
        webhookEventId: 'event-003',
        endpointId: 'endpoint-001',
        requestBody: '{}',
        requestHeaders: {},
        responseCode: 500,
        duration: 100,
      });

      const history = await deliveryService.getDeliveryRetryHistory(
        organizationId,
        delivery.id
      );
      expect(Array.isArray(history)).toBe(true);
    });

    it('should retrieve delivery statistics', async () => {
      const stats = await deliveryService.getDeliveryStats(organizationId, 'endpoint-001');
      expect(stats).toBeDefined();
      expect(stats.totalDeliveries).toBeGreaterThanOrEqual(0);
      expect(stats.successfulDeliveries).toBeGreaterThanOrEqual(0);
      expect(stats.failedDeliveries).toBeGreaterThanOrEqual(0);
      expect(stats.avgDuration).toBeGreaterThanOrEqual(0);
    });

    it('should query deliveries by date range', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const deliveries = await deliveryService.getDeliveriesByDateRange(
        organizationId,
        startDate,
        endDate,
        10,
        0
      );

      expect(deliveries).toBeDefined();
      expect(Array.isArray(deliveries.items)).toBe(true);
    });

    it('should cleanup old deliveries', async () => {
      const result = await deliveryService.cleanupOldDeliveries(organizationId, 30);
      expect(result).toBeDefined();
      expect(result.deletedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('EventSubscriptionService', () => {
    it('should create event subscription', async () => {
      const subscription = await subscriptionService.createSubscription(organizationId, {
        userId,
        eventTypes: ['subscription.created', 'subscription.renewed'],
        channel: 'webhook',
        metadata: { webhookEndpointId: 'endpoint-001' },
        filters: { entityType: 'subscription' },
      });

      expect(subscription).toBeDefined();
      expect(subscription.organizationId).toBe(organizationId);
      expect(subscription.channel).toBe('webhook');
      expect(subscription.active).toBe(true);
    });

    it('should support multiple channels', async () => {
      const channels = ['webhook', 'email', 'sms', 'in_app'] as const;

      for (const channel of channels) {
        const subscription = await subscriptionService.createSubscription(organizationId, {
          userId,
          eventTypes: ['invoice.issued'],
          channel,
          metadata: {},
        });

        expect(subscription.channel).toBe(channel);
      }
    });

    it('should add event type to subscription', async () => {
      const subscription = await subscriptionService.createSubscription(organizationId, {
        userId,
        eventTypes: ['payment.completed'],
        channel: 'webhook',
        metadata: {},
      });

      const updated = await subscriptionService.addEventType(
        organizationId,
        subscription.id,
        'payment.refunded'
      );

      expect(updated.eventTypes).toContain('payment.refunded');
      expect(updated.eventTypes).toContain('payment.completed');
    });

    it('should remove event type from subscription', async () => {
      const subscription = await subscriptionService.createSubscription(organizationId, {
        userId,
        eventTypes: ['contract.created', 'contract.signed'],
        channel: 'email',
        metadata: {},
      });

      const updated = await subscriptionService.removeEventType(
        organizationId,
        subscription.id,
        'contract.created'
      );

      expect(updated.eventTypes).not.toContain('contract.created');
      expect(updated.eventTypes).toContain('contract.signed');
    });

    it('should toggle subscription active status', async () => {
      const subscription = await subscriptionService.createSubscription(organizationId, {
        userId,
        eventTypes: ['organization.updated'],
        channel: 'in_app',
        metadata: {},
      });

      const toggled = await subscriptionService.toggleSubscription(
        organizationId,
        subscription.id
      );

      expect(toggled.active).not.toBe(subscription.active);
    });

    it('should retrieve subscriptions for specific event', async () => {
      const subs = await subscriptionService.getSubscriptionsForEvent(
        organizationId,
        'proposal.approved'
      );

      expect(Array.isArray(subs)).toBe(true);
    });

    it('should support optional filtering by entity', async () => {
      const subscription = await subscriptionService.createSubscription(organizationId, {
        userId,
        eventTypes: ['contact.updated'],
        channel: 'webhook',
        metadata: {},
        filters: { entityType: 'contact', entityId: 'contact-001' },
      });

      expect(subscription.filters?.entityType).toBe('contact');
      expect(subscription.filters?.entityId).toBe('contact-001');
    });

    it('should retrieve user subscriptions', async () => {
      const subs = await subscriptionService.getUserSubscriptions(organizationId, userId, 10, 0);
      expect(subs).toBeDefined();
      expect(Array.isArray(subs.items)).toBe(true);
    });

    it('should retrieve organization subscriptions', async () => {
      const subs = await subscriptionService.getOrganizationSubscriptions(organizationId, 10, 0);
      expect(subs).toBeDefined();
      expect(Array.isArray(subs.items)).toBe(true);
    });
  });

  describe('WebhookLogService', () => {
    it('should log webhook action', async () => {
      const log = await logService.logAction(organizationId, {
        action: 'delivery_attempt',
        eventId: 'event-001',
        endpointId: 'endpoint-001',
        userId,
        details: { statusCode: 200, duration: 150 },
      });

      expect(log).toBeDefined();
      expect(log.action).toBe('delivery_attempt');
      expect(log.organizationId).toBe(organizationId);
    });

    it('should log all action types', async () => {
      const actions = ['created', 'delivery_attempt', 'retry_scheduled', 'succeeded', 'failed', 'skipped'] as const;

      for (const action of actions) {
        const log = await logService.logAction(organizationId, {
          action,
          eventId: `event-${action}`,
          userId,
        });

        expect(log.action).toBe(action);
      }
    });

    it('should retrieve event activity logs', async () => {
      const logs = await logService.getEventLogs(organizationId, 'event-001', 10, 0);
      expect(logs).toBeDefined();
      expect(Array.isArray(logs.items)).toBe(true);
    });

    it('should retrieve endpoint activity logs', async () => {
      const logs = await logService.getEndpointLogs(organizationId, 'endpoint-001', 10, 0);
      expect(logs).toBeDefined();
      expect(Array.isArray(logs.items)).toBe(true);
    });

    it('should filter logs by date range', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const logs = await logService.getLogsByDateRange(organizationId, startDate, endDate, 10, 0);
      expect(logs).toBeDefined();
      expect(Array.isArray(logs.items)).toBe(true);
    });

    it('should retrieve recent activity summary', async () => {
      const summary = await logService.getActivitySummary(organizationId, 24);
      expect(summary).toBeDefined();
      expect(summary.totalActions).toBeGreaterThanOrEqual(0);
      expect(summary.byAction).toBeDefined();
    });

    it('should export activity log in JSON format', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const exported = await logService.exportActivityLog(organizationId, startDate, endDate, 'json');
      expect(exported).toBeDefined();
      expect(exported.format).toBe('json');
    });

    it('should export activity log in CSV format', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const exported = await logService.exportActivityLog(organizationId, startDate, endDate, 'csv');
      expect(exported).toBeDefined();
      expect(exported.format).toBe('csv');
    });

    it('should cleanup old logs', async () => {
      const result = await logService.deleteOldLogs(organizationId, 90);
      expect(result).toBeDefined();
      expect(result.deletedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Organization Isolation', () => {
    const otherOrgId = 'org-other-001';

    it('should isolate endpoints by organization', async () => {
      const endpoint1 = await endpointService.createEndpoint(organizationId, {
        url: 'https://example.com/webhook1',
        description: 'Org 1 webhook',
        eventTypes: ['subscription.created'],
        authenticationType: 'hmac' as const,
        retryPolicy: { maxRetries: 3, backoffMultiplier: 2, initialDelayMs: 1000 },
        rateLimit: { requestsPerSecond: 100, burst: 1000 },
      });

      const endpoint2 = await endpointService.createEndpoint(otherOrgId, {
        url: 'https://example.com/webhook2',
        description: 'Org 2 webhook',
        eventTypes: ['invoice.issued'],
        authenticationType: 'bearer' as const,
        retryPolicy: { maxRetries: 3, backoffMultiplier: 2, initialDelayMs: 1000 },
        rateLimit: { requestsPerSecond: 50, burst: 500 },
      });

      const org1Endpoints = await endpointService.getOrganizationEndpoints(organizationId, 10, 0);
      const hasEndpoint1 = org1Endpoints.items.some((e: any) => e.id === endpoint1.id);
      const hasEndpoint2 = org1Endpoints.items.some((e: any) => e.id === endpoint2.id);

      expect(hasEndpoint1).toBe(true);
      expect(hasEndpoint2).toBe(false);
    });

    it('should isolate events by organization', async () => {
      const event1 = await eventService.createEvent(organizationId, {
        eventType: 'subscription.created',
        payload: { subscriptionId: 'sub-001' },
        triggeredBy: userId,
      });

      const event2 = await eventService.createEvent(otherOrgId, {
        eventType: 'invoice.issued',
        payload: { invoiceId: 'inv-001' },
        triggeredBy: userId,
      });

      const org1Events = await eventService.getPendingEvents(organizationId, 10, 0);
      const hasEvent1 = org1Events.items.some((e: any) => e.id === event1.id);
      const hasEvent2 = org1Events.items.some((e: any) => e.id === event2.id);

      expect(hasEvent1).toBe(true);
      expect(hasEvent2).toBe(false);
    });

    it('should isolate subscriptions by organization', async () => {
      const sub1 = await subscriptionService.createSubscription(organizationId, {
        userId,
        eventTypes: ['subscription.created'],
        channel: 'webhook',
        metadata: {},
      });

      const sub2 = await subscriptionService.createSubscription(otherOrgId, {
        userId,
        eventTypes: ['invoice.issued'],
        channel: 'email',
        metadata: {},
      });

      const org1Subs = await subscriptionService.getOrganizationSubscriptions(organizationId, 10, 0);
      const hasSub1 = org1Subs.items.some((s: any) => s.id === sub1.id);
      const hasSub2 = org1Subs.items.some((s: any) => s.id === sub2.id);

      expect(hasSub1).toBe(true);
      expect(hasSub2).toBe(false);
    });
  });

  describe('Integration Scenarios', () => {
    it('should process complete webhook lifecycle', async () => {
      // 1. Create endpoint
      const endpoint = await endpointService.createEndpoint(organizationId, {
        url: 'https://example.com/webhook',
        description: 'Integration test endpoint',
        eventTypes: ['subscription.created'],
        authenticationType: 'hmac' as const,
        retryPolicy: { maxRetries: 3, backoffMultiplier: 2, initialDelayMs: 1000 },
        rateLimit: { requestsPerSecond: 100, burst: 1000 },
      });

      expect(endpoint).toBeDefined();

      // 2. Create event subscription
      const subscription = await subscriptionService.createSubscription(organizationId, {
        userId,
        eventTypes: ['subscription.created'],
        channel: 'webhook',
        metadata: { webhookEndpointId: endpoint.id },
      });

      expect(subscription.active).toBe(true);

      // 3. Create event
      const event = await eventService.createEvent(organizationId, {
        eventType: 'subscription.created',
        payload: { subscriptionId: 'sub-integration-001' },
        triggeredBy: userId,
      });

      expect(event.status).toBe('pending');

      // 4. Record delivery
      const signature = deliveryService.generateWebhookSignature(
        endpoint.authenticationSecret,
        JSON.stringify(event.payload)
      );

      const delivery = await deliveryService.recordDelivery(organizationId, {
        webhookEventId: event.id,
        endpointId: endpoint.id,
        requestBody: JSON.stringify(event.payload),
        requestHeaders: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
        },
        responseCode: 200,
        responseBody: JSON.stringify({ success: true }),
        duration: 120,
      });

      expect(delivery.success).toBe(true);

      // 5. Log activity
      const log = await logService.logAction(organizationId, {
        action: 'succeeded',
        eventId: event.id,
        endpointId: endpoint.id,
        userId,
        details: { deliveryId: delivery.id },
      });

      expect(log.action).toBe('succeeded');
    });

    it('should handle webhook retry scenario', async () => {
      const endpoint = await endpointService.createEndpoint(organizationId, {
        url: 'https://example.com/webhook',
        description: 'Retry test',
        eventTypes: ['payment.completed'],
        authenticationType: 'api_key' as const,
        retryPolicy: { maxRetries: 3, backoffMultiplier: 2, initialDelayMs: 1000 },
        rateLimit: { requestsPerSecond: 100, burst: 1000 },
      });

      const event = await eventService.createEvent(organizationId, {
        eventType: 'payment.completed',
        payload: { paymentId: 'pay-retry-001' },
        triggeredBy: userId,
      });

      // Simulate failed delivery
      let current = event;
      for (let i = 0; i < 3; i++) {
        current = await eventService.recordDeliveryAttempt(organizationId, current.id, {
          success: false,
          statusCode: 503,
          duration: 200,
        });

        expect(current.retryCount).toBe(i + 1);
      }

      // Final successful retry
      const final = await eventService.recordDeliveryAttempt(organizationId, current.id, {
        success: true,
        statusCode: 200,
        duration: 150,
      });

      expect(final.status).toBe('delivered');
    });

    it('should support multi-channel subscriptions', async () => {
      // Create webhook subscription
      const webhookSub = await subscriptionService.createSubscription(organizationId, {
        userId: 'user-001',
        eventTypes: ['contract.signed'],
        channel: 'webhook',
        metadata: { webhookEndpointId: 'endpoint-001' },
      });

      // Create email subscription
      const emailSub = await subscriptionService.createSubscription(organizationId, {
        userId: 'user-001',
        eventTypes: ['contract.signed'],
        channel: 'email',
        metadata: { emailAddress: 'user@example.com' },
      });

      // Create SMS subscription
      const smsSub = await subscriptionService.createSubscription(organizationId, {
        userId: 'user-001',
        eventTypes: ['contract.signed'],
        channel: 'sms',
        metadata: { phoneNumber: '+1234567890' },
      });

      // Create in-app notification subscription
      const inAppSub = await subscriptionService.createSubscription(organizationId, {
        userId: 'user-001',
        eventTypes: ['contract.signed'],
        channel: 'in_app',
        metadata: {},
      });

      expect(webhookSub.channel).toBe('webhook');
      expect(emailSub.channel).toBe('email');
      expect(smsSub.channel).toBe('sms');
      expect(inAppSub.channel).toBe('in_app');
    });
  });
});
