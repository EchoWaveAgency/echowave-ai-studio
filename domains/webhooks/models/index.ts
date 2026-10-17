export interface WebhookEndpoint {
  id: string;
  organizationId: string;
  name: string;
  url: string;
  active: boolean;
  events: string[];
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelayMs: number;
  };
  headers?: Record<string, string>;
  authentication?: {
    type: 'api_key' | 'bearer' | 'hmac' | 'oauth';
    credentials: Record<string, string>;
  };
  rateLimit?: {
    requestsPerSecond: number;
    burst: number;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastSuccessAt?: Date;
  lastFailureAt?: Date;
  consecutiveFailures: number;
  metadata: Record<string, any>;
}

export interface WebhookEvent {
  id: string;
  organizationId: string;
  endpointId: string;
  eventType: string;
  eventCategory: string;
  payload: Record<string, any>;
  status: 'pending' | 'delivered' | 'failed' | 'failed_max_retries';
  attempts: number;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  deliveredAt?: Date;
  failureReason?: string;
  responseCode?: number;
  responseBody?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

export interface WebhookDelivery {
  id: string;
  organizationId: string;
  webhookEventId: string;
  endpointId: string;
  attempt: number;
  requestHeaders: Record<string, string>;
  requestBody: string;
  responseCode?: number;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  duration: number;
  success: boolean;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface EventSubscription {
  id: string;
  organizationId: string;
  userId: string;
  eventTypes: string[];
  channels: ('webhook' | 'email' | 'sms' | 'in_app')[];
  filters?: {
    entityType?: string;
    entityId?: string;
    status?: string;
  };
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

export interface WebhookLog {
  id: string;
  organizationId: string;
  webhookEventId: string;
  endpointId: string;
  action: 'created' | 'delivery_attempt' | 'retry_scheduled' | 'succeeded' | 'failed' | 'skipped';
  details: Record<string, any>;
  timestamp: Date;
}

export const WEBHOOK_EVENTS = [
  'subscription.created',
  'subscription.activated',
  'subscription.paused',
  'subscription.resumed',
  'subscription.canceled',
  'subscription.expired',
  'invoice.created',
  'invoice.issued',
  'invoice.paid',
  'invoice.partially_paid',
  'invoice.overdue',
  'invoice.canceled',
  'payment.initiated',
  'payment.completed',
  'payment.failed',
  'payment.refunded',
  'contract.created',
  'contract.sent_for_review',
  'contract.sent_for_signature',
  'contract.signed',
  'contract.approved',
  'contract.rejected',
  'contract.terminated',
  'contract.expired',
  'proposal.created',
  'proposal.sent',
  'proposal.viewed',
  'proposal.accepted',
  'proposal.rejected',
  'proposal.expired',
  'contact.created',
  'contact.updated',
  'contact.deleted',
  'organization.created',
  'organization.updated',
  'user.created',
  'user.updated',
  'user.deleted',
] as const;

export const EVENT_CATEGORIES = [
  'subscription',
  'billing',
  'payment',
  'contract',
  'proposal',
  'contact',
  'organization',
  'user',
] as const;

export const AUTHENTICATION_TYPES = ['api_key', 'bearer', 'hmac', 'oauth'] as const;

export const DELIVERY_STATUSES = ['pending', 'delivered', 'failed', 'failed_max_retries'] as const;
