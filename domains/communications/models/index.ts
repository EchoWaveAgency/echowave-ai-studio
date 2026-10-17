// Communications Domain Models

// Contact Channel
export interface ContactChannel {
  id: string;
  organizationId: string;
  contactId: string;
  type: 'email' | 'phone' | 'whatsapp' | 'telegram' | 'linkedin' | 'twitter';
  value: string;
  isVerified: boolean;
  verifiedAt?: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContactChannelCreateInput {
  contactId: string;
  type: 'email' | 'phone' | 'whatsapp' | 'telegram' | 'linkedin' | 'twitter';
  value: string;
  isPrimary?: boolean;
}

// Message
export interface Message {
  id: string;
  organizationId: string;
  fromContactId?: string;
  toContactId: string;
  channel: 'email' | 'whatsapp' | 'telegram' | 'sms';
  subject?: string;
  body: string;
  status: 'draft' | 'scheduled' | 'sent' | 'delivered' | 'failed' | 'bounced';
  direction: 'inbound' | 'outbound';
  externalId?: string;
  scheduledAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  failureReason?: string;
  tags: string[];
  metadata: Record<string, any>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageCreateInput {
  toContactId: string;
  channel: 'email' | 'whatsapp' | 'telegram' | 'sms';
  subject?: string;
  body: string;
  tags?: string[];
  metadata?: Record<string, any>;
  scheduledAt?: string;
}

// Message Template
export interface MessageTemplate {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  channel: 'email' | 'whatsapp' | 'telegram' | 'sms';
  subject?: string;
  body: string;
  variables: string[];
  category: 'sales' | 'support' | 'marketing' | 'notification' | 'other';
  status: 'active' | 'inactive';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageTemplateCreateInput {
  name: string;
  description: string;
  channel: 'email' | 'whatsapp' | 'telegram' | 'sms';
  subject?: string;
  body: string;
  category: 'sales' | 'support' | 'marketing' | 'notification' | 'other';
}

// Communication Preference
export interface CommunicationPreference {
  id: string;
  organizationId: string;
  contactId: string;
  channel: 'email' | 'whatsapp' | 'telegram' | 'sms';
  isOptedIn: boolean;
  frequency: 'realtime' | 'daily' | 'weekly' | 'monthly' | 'never';
  categories: string[];
  unsubscribeToken: string;
  unsubscribedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationPreferenceCreateInput {
  contactId: string;
  channel: 'email' | 'whatsapp' | 'telegram' | 'sms';
  isOptedIn: boolean;
  frequency: 'realtime' | 'daily' | 'weekly' | 'monthly' | 'never';
  categories?: string[];
}

// Email Account (SMTP/OAuth config)
export interface EmailAccount {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  provider: 'smtp' | 'gmail' | 'outlook' | 'sendgrid';
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  oauthToken?: string;
  isVerified: boolean;
  isPrimary: boolean;
  status: 'active' | 'inactive' | 'error';
  lastErrorAt?: string;
  lastErrorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailAccountCreateInput {
  name: string;
  email: string;
  provider: 'smtp' | 'gmail' | 'outlook' | 'sendgrid';
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  isPrimary?: boolean;
}

// Notification
export interface Notification {
  id: string;
  organizationId: string;
  userId: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  readAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationCreateInput {
  userId: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  actionUrl?: string;
  expiresAt?: string;
}

// Message Log (audit trail)
export interface MessageLog {
  id: string;
  organizationId: string;
  messageId: string;
  event: 'created' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'opened' | 'clicked';
  timestamp: string;
  details: Record<string, any>;
}

// Constants
export const MESSAGE_CHANNELS = ['email', 'whatsapp', 'telegram', 'sms'] as const;
export const CONTACT_CHANNEL_TYPES = ['email', 'phone', 'whatsapp', 'telegram', 'linkedin', 'twitter'] as const;
export const MESSAGE_STATUSES = ['draft', 'scheduled', 'sent', 'delivered', 'failed', 'bounced'] as const;
export const MESSAGE_DIRECTIONS = ['inbound', 'outbound'] as const;
export const MESSAGE_CATEGORIES = ['sales', 'support', 'marketing', 'notification', 'other'] as const;
export const COMMUNICATION_FREQUENCIES = ['realtime', 'daily', 'weekly', 'monthly', 'never'] as const;
export const NOTIFICATION_TYPES = ['info', 'warning', 'error', 'success'] as const;
export const MESSAGE_LOG_EVENTS = ['created', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked'] as const;
