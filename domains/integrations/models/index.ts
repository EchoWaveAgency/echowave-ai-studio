export enum WhatsAppMessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export enum WhatsAppMessageType {
  TEXT = 'text',
  IMAGE = 'image',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  VIDEO = 'video',
  TEMPLATE = 'template',
  INTERACTIVE = 'interactive',
}

export enum TelegramUpdateType {
  MESSAGE = 'message',
  CALLBACK_QUERY = 'callback_query',
  INLINE_QUERY = 'inline_query',
  CHOSEN_INLINE_RESULT = 'chosen_inline_result',
  CHANNEL_POST = 'channel_post',
  EDITED_MESSAGE = 'edited_message',
  EDITED_CHANNEL_POST = 'edited_channel_post',
}

export enum EmailCampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  SENT = 'sent',
  PAUSED = 'paused',
  FAILED = 'failed',
}

export enum EmailMessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  BOUNCED = 'bounced',
  OPENED = 'opened',
  CLICKED = 'clicked',
  COMPLAINED = 'complained',
  UNSUBSCRIBED = 'unsubscribed',
}

export enum PaymentStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  VOIDED = 'voided',
  REFUNDED = 'refunded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PaymentGatewayType {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  SQUARE = 'square',
  FAWRY = 'fawry',
  VODAFONE_CASH = 'vodafone_cash',
  ETISALAT_CASH = 'etisalat_cash',
}

export enum WebhookEventType {
  WHATSAPP_MESSAGE_RECEIVED = 'whatsapp_message_received',
  WHATSAPP_MESSAGE_DELIVERED = 'whatsapp_message_delivered',
  WHATSAPP_MESSAGE_READ = 'whatsapp_message_read',
  WHATSAPP_STATUS_CHANGED = 'whatsapp_status_changed',
  TELEGRAM_MESSAGE_RECEIVED = 'telegram_message_received',
  TELEGRAM_CALLBACK_RECEIVED = 'telegram_callback_received',
  EMAIL_BOUNCE = 'email_bounce',
  EMAIL_OPENED = 'email_opened',
  EMAIL_CLICKED = 'email_clicked',
  PAYMENT_AUTHORIZED = 'payment_authorized',
  PAYMENT_CAPTURED = 'payment_captured',
  PAYMENT_REFUNDED = 'payment_refunded',
  PAYMENT_FAILED = 'payment_failed',
}

export interface WhatsAppMessage {
  id: string;
  organizationId: string;
  conversationId: string;
  contactPhone: string;
  messageType: WhatsAppMessageType;
  content: string;
  status: WhatsAppMessageStatus;
  externalMessageId?: string;
  templateName?: string;
  mediaUrl?: string;
  mediaId?: string;
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failureReason?: string;
  metadata?: Record<string, any>;
}

export interface WhatsAppTemplate {
  id: string;
  organizationId: string;
  templateName: string;
  content: string;
  variables: string[];
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  status: 'APPROVED' | 'REJECTED' | 'PENDING_REVIEW' | 'DISABLED';
  createdAt: Date;
  updatedAt: Date;
  externalTemplateId?: string;
}

export interface WhatsAppConversation {
  id: string;
  organizationId: string;
  contactPhone: string;
  contactName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  lastMessageAt: Date;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface TelegramMessage {
  id: string;
  organizationId: string;
  chatId: string;
  userId: string;
  userUsername?: string;
  messageType: TelegramUpdateType;
  content: string;
  externalMessageId: string;
  sentAt: Date;
  editedAt?: Date;
  replyToMessageId?: string;
  metadata?: Record<string, any>;
}

export interface TelegramBot {
  id: string;
  organizationId: string;
  botName: string;
  botToken: string;
  botUsername: string;
  webhookUrl: string;
  isActive: boolean;
  lastUpdateId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TelegramUpdate {
  id: string;
  organizationId: string;
  botId: string;
  updateId: number;
  updateType: TelegramUpdateType;
  chatId: string;
  userId: string;
  userUsername?: string;
  messageText?: string;
  callbackData?: string;
  processedAt: Date;
  processedBy?: string;
  metadata?: Record<string, any>;
}

export interface EmailCampaign {
  id: string;
  organizationId: string;
  campaignName: string;
  subject: string;
  fromEmail: string;
  fromName: string;
  templateId?: string;
  content: string;
  recipientCount: number;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  status: EmailCampaignStatus;
  scheduledAt?: Date;
  sentAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface EmailMessage {
  id: string;
  organizationId: string;
  campaignId?: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  content: string;
  status: EmailMessageStatus;
  sentAt: Date;
  openedAt?: Date;
  clickedAt?: Date;
  bouncedAt?: Date;
  bounceType?: 'SOFT' | 'HARD' | 'COMPLAINT';
  externalId?: string;
  metadata?: Record<string, any>;
}

export interface EmailTemplate {
  id: string;
  organizationId: string;
  templateName: string;
  subject: string;
  content: string;
  variables: string[];
  category: 'TRANSACTIONAL' | 'MARKETING' | 'NOTIFICATION';
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface EmailRecipient {
  id: string;
  campaignId: string;
  email: string;
  name: string;
  variables: Record<string, string>;
  status: EmailMessageStatus;
  addedAt: Date;
}

export interface PaymentRecord {
  id: string;
  organizationId: string;
  documentId?: string;
  invoiceId?: string;
  amount: number;
  currency: string;
  gatewayType: PaymentGatewayType;
  status: PaymentStatus;
  externalTransactionId: string;
  paymentMethodId?: string;
  description: string;
  metadata?: Record<string, any>;
  authorizedAt?: Date;
  capturedAt?: Date;
  refundedAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethod {
  id: string;
  organizationId: string;
  methodType: 'CARD' | 'BANK_TRANSFER' | 'MOBILE_WALLET' | 'CASH';
  displayName: string;
  last4Digits?: string;
  expiryDate?: Date;
  cardBrand?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentGatewayConfig {
  id: string;
  organizationId: string;
  gatewayType: PaymentGatewayType;
  apiKey: string;
  apiSecret?: string;
  webhookSecret?: string;
  isActive: boolean;
  supportedCurrencies: string[];
  supportedMethods: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentReconciliation {
  id: string;
  organizationId: string;
  statementDate: Date;
  gatewayType: PaymentGatewayType;
  totalTransactions: number;
  totalAmount: number;
  reconciled: number;
  discrepancies: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  discrepancyDetails?: Array<{
    paymentId: string;
    expectedAmount: number;
    actualAmount: number;
    reason: string;
  }>;
  createdAt: Date;
  completedAt?: Date;
}

export interface WebhookSubscription {
  id: string;
  organizationId: string;
  eventType: WebhookEventType;
  targetUrl: string;
  isActive: boolean;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookEvent {
  id: string;
  organizationId: string;
  subscriptionId: string;
  eventType: WebhookEventType;
  payload: Record<string, any>;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'DELIVERED';
  retryCount: number;
  lastRetryAt?: Date;
  nextRetryAt?: Date;
  failureReason?: string;
  createdAt: Date;
  sentAt?: Date;
}

export interface WebhookLog {
  id: string;
  organizationId: string;
  eventId: string;
  subscriptionId: string;
  targetUrl: string;
  method: string;
  statusCode: number;
  responseBody: string;
  sentAt: Date;
}

export interface IntegrationConfiguration {
  id: string;
  organizationId: string;
  integrationType: 'WHATSAPP' | 'TELEGRAM' | 'EMAIL' | 'PAYMENT';
  configName: string;
  settings: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
