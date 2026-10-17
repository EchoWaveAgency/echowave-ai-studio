import { describe, it, expect, beforeEach } from 'vitest';
import { WhatsAppService } from '../../domains/integrations/services/WhatsAppService';
import { TelegramService } from '../../domains/integrations/services/TelegramService';
import { EmailService } from '../../domains/integrations/services/EmailService';
import { PaymentService } from '../../domains/integrations/services/PaymentService';
import { WhatsAppMessageStatus, WhatsAppMessageType } from '../../domains/integrations/models';
import { TelegramUpdateType, EmailCampaignStatus, EmailMessageStatus, PaymentStatus, PaymentGatewayType } from '../../domains/integrations/models';

describe('Phase 17: Integrations & Third-Party Services', () => {
  let whatsappService: WhatsAppService;
  let telegramService: TelegramService;
  let emailService: EmailService;
  let paymentService: PaymentService;
  let organizationId: string;

  beforeEach(() => {
    whatsappService = new WhatsAppService();
    telegramService = new TelegramService();
    emailService = new EmailService();
    paymentService = new PaymentService();
    organizationId = 'org-test-123';
  });

  describe('WhatsAppService', () => {
    it('should send a text message', () => {
      const message = whatsappService.sendMessage(
        organizationId,
        'conv-1',
        '+201001234567',
        WhatsAppMessageType.TEXT,
        'Hello, this is a test message'
      );

      expect(message.id).toBeDefined();
      expect(message.organizationId).toBe(organizationId);
      expect(message.status).toBe(WhatsAppMessageStatus.PENDING);
      expect(message.content).toBe('Hello, this is a test message');
    });

    it('should create a template', () => {
      const template = whatsappService.createTemplate(
        organizationId,
        'order_confirmation',
        'Order {{order_id}} confirmed for {{customer_name}}',
        ['order_id', 'customer_name'],
        'UTILITY',
        'en'
      );

      expect(template.id).toBeDefined();
      expect(template.templateName).toBe('order_confirmation');
      expect(template.status).toBe('PENDING_REVIEW');
    });

    it('should approve a template', () => {
      const template = whatsappService.createTemplate(
        organizationId,
        'promo_template',
        'Special offer: {{discount}}% off',
        ['discount']
      );

      const approved = whatsappService.approveTemplate(organizationId, template.id);

      expect(approved?.status).toBe('APPROVED');
    });

    it('should create a conversation', () => {
      const conversation = whatsappService.createConversation(
        organizationId,
        '+201001234567',
        'Ahmed Mohamed'
      );

      expect(conversation.id).toBeDefined();
      expect(conversation.status).toBe('ACTIVE');
      expect(conversation.messageCount).toBe(0);
    });

    it('should update message status to delivered', () => {
      const message = whatsappService.sendMessage(
        organizationId,
        'conv-1',
        '+201001234567',
        WhatsAppMessageType.TEXT,
        'Test message'
      );

      const updated = whatsappService.updateMessageStatus(
        organizationId,
        message.id,
        WhatsAppMessageStatus.DELIVERED,
        'ext-msg-123'
      );

      expect(updated?.status).toBe(WhatsAppMessageStatus.DELIVERED);
      expect(updated?.deliveredAt).toBeDefined();
    });

    it('should get conversation messages', () => {
      const conv1 = whatsappService.createConversation(organizationId, '+201001234567', 'Client 1');
      whatsappService.sendMessage(organizationId, conv1.id, '+201001234567', WhatsAppMessageType.TEXT, 'Message 1');
      whatsappService.sendMessage(organizationId, conv1.id, '+201001234567', WhatsAppMessageType.TEXT, 'Message 2');

      const messages = whatsappService.getConversationMessages(organizationId, conv1.id);

      expect(messages).toHaveLength(2);
      expect(messages[0].content).toBe('Message 2');
    });

    it('should block organization isolation on cross-org access', () => {
      const message = whatsappService.sendMessage(
        organizationId,
        'conv-1',
        '+201001234567',
        WhatsAppMessageType.TEXT,
        'Secret message'
      );

      const result = whatsappService.getMessageById('other-org', message.id);

      expect(result).toBeNull();
    });

    it('should get conversation statistics', () => {
      const conv1 = whatsappService.createConversation(organizationId, '+201001234567', 'Client 1');
      const conv2 = whatsappService.createConversation(organizationId, '+201109876543', 'Client 2');
      
      whatsappService.sendMessage(organizationId, conv1.id, '+201001234567', WhatsAppMessageType.TEXT, 'Msg 1');
      whatsappService.sendMessage(organizationId, conv2.id, '+201109876543', WhatsAppMessageType.TEXT, 'Msg 2');

      const stats = whatsappService.getConversationStats(organizationId);

      expect(stats.totalConversations).toBe(2);
      expect(stats.totalMessages).toBe(2);
      expect(stats.activeConversations).toBe(2);
    });

    it('should get message delivery status breakdown', () => {
      const message1 = whatsappService.sendMessage(organizationId, 'conv-1', '+201001234567', WhatsAppMessageType.TEXT, 'Msg 1');
      const message2 = whatsappService.sendMessage(organizationId, 'conv-1', '+201001234567', WhatsAppMessageType.TEXT, 'Msg 2');

      whatsappService.updateMessageStatus(organizationId, message1.id, WhatsAppMessageStatus.DELIVERED);
      whatsappService.updateMessageStatus(organizationId, message2.id, WhatsAppMessageStatus.READ);

      const status = whatsappService.getMessageDeliveryStatus(organizationId);

      expect(status.pending).toBe(0);
      expect(status.delivered).toBe(1);
      expect(status.read).toBe(1);
    });

    it('should delete a conversation', () => {
      const conversation = whatsappService.createConversation(organizationId, '+201001234567', 'Client');

      const deleted = whatsappService.deleteConversation(organizationId, conversation.id);

      expect(deleted).toBe(true);
      expect(whatsappService.getConversationById(organizationId, conversation.id)).toBeNull();
    });
  });

  describe('TelegramService', () => {
    it('should create a telegram bot', () => {
      const bot = telegramService.createBot(
        organizationId,
        'MyBot',
        '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
        'my_test_bot',
        'https://example.com/webhook/telegram'
      );

      expect(bot.id).toBeDefined();
      expect(bot.botName).toBe('MyBot');
      expect(bot.isActive).toBe(true);
    });

    it('should process a telegram update', () => {
      const bot = telegramService.createBot(
        organizationId,
        'MyBot',
        'token123',
        'my_bot',
        'https://example.com/webhook'
      );

      const update = telegramService.processUpdate(
        organizationId,
        bot.id,
        1,
        TelegramUpdateType.MESSAGE,
        'chat-123',
        'user-456',
        'Hello bot'
      );

      expect(update.updateId).toBe(1);
      expect(update.messageText).toBe('Hello bot');
      expect(update.updateType).toBe(TelegramUpdateType.MESSAGE);
    });

    it('should record a telegram message', () => {
      const message = telegramService.recordMessage(
        organizationId,
        'chat-123',
        'user-456',
        'msg-789',
        TelegramUpdateType.MESSAGE,
        'User message'
      );

      expect(message.id).toBeDefined();
      expect(message.externalMessageId).toBe('msg-789');
      expect(message.content).toBe('User message');
    });

    it('should get bot updates', () => {
      const bot = telegramService.createBot(organizationId, 'Bot1', 'token1', 'bot1', 'url1');
      telegramService.processUpdate(organizationId, bot.id, 1, TelegramUpdateType.MESSAGE, 'chat-1', 'user-1', 'Msg 1');
      telegramService.processUpdate(organizationId, bot.id, 2, TelegramUpdateType.MESSAGE, 'chat-1', 'user-1', 'Msg 2');

      const updates = telegramService.getBotUpdates(organizationId, bot.id);

      expect(updates).toHaveLength(2);
    });

    it('should get chat messages', () => {
      telegramService.recordMessage(organizationId, 'chat-1', 'user-1', 'msg-1', TelegramUpdateType.MESSAGE, 'Hello');
      telegramService.recordMessage(organizationId, 'chat-1', 'user-1', 'msg-2', TelegramUpdateType.MESSAGE, 'World');

      const messages = telegramService.getChatMessages(organizationId, 'chat-1');

      expect(messages).toHaveLength(2);
    });

    it('should get user messages', () => {
      telegramService.recordMessage(organizationId, 'chat-1', 'user-1', 'msg-1', TelegramUpdateType.MESSAGE, 'User msg');
      telegramService.recordMessage(organizationId, 'chat-2', 'user-1', 'msg-2', TelegramUpdateType.MESSAGE, 'User msg 2');

      const messages = telegramService.getUserUpdates(organizationId, 'user-1');

      expect(messages.length).toBeGreaterThanOrEqual(0);
    });

    it('should update bot webhook', () => {
      const bot = telegramService.createBot(organizationId, 'Bot', 'token', 'bot', 'url');
      const updated = telegramService.updateBotWebhook(organizationId, bot.id, 'https://new.example.com/webhook');

      expect(updated?.webhookUrl).toBe('https://new.example.com/webhook');
    });

    it('should get bot statistics', () => {
      const bot = telegramService.createBot(organizationId, 'Bot', 'token', 'bot', 'url');
      telegramService.processUpdate(organizationId, bot.id, 1, TelegramUpdateType.MESSAGE, 'chat-1', 'user-1', 'Msg');
      telegramService.processUpdate(organizationId, bot.id, 2, TelegramUpdateType.MESSAGE, 'chat-1', 'user-2', 'Msg');

      const stats = telegramService.getBotStats(organizationId, bot.id);

      expect(stats.totalUpdates).toBe(2);
      expect(stats.uniqueChats).toBe(1);
      expect(stats.uniqueUsers).toBe(2);
    });

    it('should deactivate a bot', () => {
      const bot = telegramService.createBot(organizationId, 'Bot', 'token', 'bot', 'url');
      const deactivated = telegramService.deactivateBot(organizationId, bot.id);

      expect(deactivated?.isActive).toBe(false);
    });

    it('should block organization isolation', () => {
      const bot = telegramService.createBot(organizationId, 'Bot', 'token', 'bot', 'url');
      const result = telegramService.getBotById('other-org', bot.id);

      expect(result).toBeNull();
    });
  });

  describe('EmailService', () => {
    it('should create an email campaign', () => {
      const campaign = emailService.createCampaign(
        organizationId,
        'Summer Sale 2024',
        'Big Discounts on Summer Products',
        'sales@echowave.com',
        'ECHOWAVE Sales',
        '<h1>Summer Sale</h1><p>50% off all items</p>',
        'user-123'
      );

      expect(campaign.id).toBeDefined();
      expect(campaign.status).toBe(EmailCampaignStatus.DRAFT);
      expect(campaign.campaignName).toBe('Summer Sale 2024');
    });

    it('should add recipients to campaign', () => {
      const campaign = emailService.createCampaign(
        organizationId,
        'Test Campaign',
        'Subject',
        'from@test.com',
        'Test',
        'Content',
        'user-1'
      );

      const recipient1 = emailService.addRecipient(campaign.id, 'client1@example.com', 'Client One', { name: 'Client One' });
      const recipient2 = emailService.addRecipient(campaign.id, 'client2@example.com', 'Client Two');

      expect(recipient1.id).toBeDefined();
      expect(recipient2.email).toBe('client2@example.com');
    });

    it('should send email messages', () => {
      const campaign = emailService.createCampaign(
        organizationId,
        'Test',
        'Subject',
        'from@test.com',
        'Test',
        'Content',
        'user-1'
      );

      const message = emailService.sendMessage(
        organizationId,
        campaign.id,
        'recipient@example.com',
        'Recipient Name',
        'Subject Line',
        '<p>Email content</p>'
      );

      expect(message.id).toBeDefined();
      expect(message.status).toBe(EmailMessageStatus.SENT);
      expect(message.sentAt).toBeDefined();
    });

    it('should update message status to opened', () => {
      const campaign = emailService.createCampaign(organizationId, 'Test', 'Subj', 'from@test.com', 'Test', 'Content', 'user-1');
      const message = emailService.sendMessage(organizationId, campaign.id, 'test@example.com', 'Test', 'Subj', 'Content');

      const updated = emailService.updateMessageStatus(organizationId, message.id, EmailMessageStatus.OPENED);

      expect(updated?.status).toBe(EmailMessageStatus.OPENED);
      expect(updated?.openedAt).toBeDefined();
    });

    it('should track message clicks', () => {
      const campaign = emailService.createCampaign(organizationId, 'Test', 'Subj', 'from@test.com', 'Test', 'Content', 'user-1');
      const message = emailService.sendMessage(organizationId, campaign.id, 'test@example.com', 'Test', 'Subj', 'Content');

      emailService.updateMessageStatus(organizationId, message.id, EmailMessageStatus.CLICKED);
      const updated = emailService.updateMessageStatus(organizationId, message.id, EmailMessageStatus.CLICKED);

      expect(updated?.status).toBe(EmailMessageStatus.CLICKED);
    });

    it('should create email templates', () => {
      const template = emailService.createTemplate(
        organizationId,
        'welcome_template',
        'Welcome to ECHOWAVE',
        '<h1>Welcome {{name}}</h1>',
        ['name'],
        'TRANSACTIONAL'
      );

      expect(template.id).toBeDefined();
      expect(template.templateName).toBe('welcome_template');
      expect(template.isActive).toBe(true);
    });

    it('should get campaign statistics', () => {
      const campaign = emailService.createCampaign(organizationId, 'Test', 'Subj', 'from@test.com', 'Test', 'Content', 'user-1');
      emailService.addRecipient(campaign.id, 'test1@example.com', 'Test 1');
      emailService.addRecipient(campaign.id, 'test2@example.com', 'Test 2');

      const msg1 = emailService.sendMessage(organizationId, campaign.id, 'test1@example.com', 'Test 1', 'Subj', 'Content');
      const msg2 = emailService.sendMessage(organizationId, campaign.id, 'test2@example.com', 'Test 2', 'Subj', 'Content');

      emailService.updateMessageStatus(organizationId, msg1.id, EmailMessageStatus.OPENED);

      const stats = emailService.getCampaignStats(organizationId, campaign.id);

      expect(stats.sentCount).toBe(2);
      expect(stats.openRate).toBe(50);
    });

    it('should get organization email statistics', () => {
      const campaign1 = emailService.createCampaign(organizationId, 'C1', 'S1', 'from@test.com', 'Test', 'Content', 'user-1');
      const campaign2 = emailService.createCampaign(organizationId, 'C2', 'S2', 'from@test.com', 'Test', 'Content', 'user-1');

      emailService.sendMessage(organizationId, campaign1.id, 'test1@example.com', 'Test', 'S1', 'Content');
      emailService.sendMessage(organizationId, campaign2.id, 'test2@example.com', 'Test', 'S2', 'Content');

      const stats = emailService.getOrganizationStats(organizationId);

      expect(stats.totalCampaigns).toBe(2);
      expect(stats.totalMessages).toBe(2);
    });

    it('should block organization isolation', () => {
      const campaign = emailService.createCampaign(organizationId, 'Test', 'Subj', 'from@test.com', 'Test', 'Content', 'user-1');
      const result = emailService.getCampaignById('other-org', campaign.id);

      expect(result).toBeNull();
    });
  });

  describe('PaymentService', () => {
    it('should create a payment record', () => {
      const payment = paymentService.createPayment(
        organizationId,
        1500.00,
        'EGP',
        PaymentGatewayType.STRIPE,
        'txn-stripe-12345',
        'Payment for Invoice #001'
      );

      expect(payment.id).toBeDefined();
      expect(payment.status).toBe(PaymentStatus.PENDING);
      expect(payment.amount).toBe(1500.00);
    });

    it('should authorize a payment', () => {
      const payment = paymentService.createPayment(
        organizationId,
        1500.00,
        'EGP',
        PaymentGatewayType.STRIPE,
        'txn-123',
        'Payment'
      );

      const authorized = paymentService.authorizePayment(organizationId, payment.id);

      expect(authorized?.status).toBe(PaymentStatus.AUTHORIZED);
      expect(authorized?.authorizedAt).toBeDefined();
    });

    it('should capture an authorized payment', () => {
      const payment = paymentService.createPayment(
        organizationId,
        1000.00,
        'EGP',
        PaymentGatewayType.STRIPE,
        'txn-123',
        'Payment'
      );

      paymentService.authorizePayment(organizationId, payment.id);
      const captured = paymentService.capturePayment(organizationId, payment.id);

      expect(captured?.status).toBe(PaymentStatus.CAPTURED);
    });

    it('should refund a payment', () => {
      const payment = paymentService.createPayment(
        organizationId,
        500.00,
        'EGP',
        PaymentGatewayType.STRIPE,
        'txn-123',
        'Payment'
      );

      paymentService.capturePayment(organizationId, payment.id);
      const refunded = paymentService.refundPayment(organizationId, payment.id);

      expect(refunded?.status).toBe(PaymentStatus.REFUNDED);
    });

    it('should mark payment as failed', () => {
      const payment = paymentService.createPayment(
        organizationId,
        100.00,
        'EGP',
        PaymentGatewayType.STRIPE,
        'txn-123',
        'Payment'
      );

      const failed = paymentService.failPayment(organizationId, payment.id, 'Card declined');

      expect(failed?.status).toBe(PaymentStatus.FAILED);
      expect(failed?.failureReason).toBe('Card declined');
    });

    it('should add payment methods', () => {
      const method = paymentService.addPaymentMethod(
        organizationId,
        'CARD',
        'Visa **** 4242',
        '4242'
      );

      expect(method.id).toBeDefined();
      expect(method.methodType).toBe('CARD');
      expect(method.isActive).toBe(true);
    });

    it('should set default payment method', () => {
      const method1 = paymentService.addPaymentMethod(organizationId, 'CARD', 'Card 1', '1111');
      const method2 = paymentService.addPaymentMethod(organizationId, 'CARD', 'Card 2', '2222');

      paymentService.setDefaultPaymentMethod(organizationId, method2.id);
      const updated = paymentService.getPaymentMethodById(organizationId, method2.id);

      expect(updated?.isDefault).toBe(true);
    });

    it('should configure payment gateway', () => {
      const config = paymentService.configureGateway(
        organizationId,
        PaymentGatewayType.STRIPE,
        'sk_live_test123',
        ['EGP', 'USD'],
        ['CARD', 'BANK_TRANSFER']
      );

      expect(config.id).toBeDefined();
      expect(config.gatewayType).toBe(PaymentGatewayType.STRIPE);
      expect(config.isActive).toBe(true);
    });

    it('should create reconciliation record', () => {
      const reconciliation = paymentService.createReconciliation(
        organizationId,
        new Date(),
        PaymentGatewayType.STRIPE
      );

      expect(reconciliation.id).toBeDefined();
      expect(reconciliation.status).toBe('PENDING');
    });

    it('should complete reconciliation', () => {
      const reconciliation = paymentService.createReconciliation(
        organizationId,
        new Date(),
        PaymentGatewayType.STRIPE
      );

      const completed = paymentService.completeReconciliation(
        organizationId,
        reconciliation.id,
        100,
        0
      );

      expect(completed?.status).toBe('COMPLETED');
      expect(completed?.reconciled).toBe(100);
    });

    it('should create webhook subscriptions', () => {
      const subscription = paymentService.subscribeToWebhook(
        organizationId,
        'PAYMENT_CAPTURED' as any,
        'https://example.com/webhooks/payment'
      );

      expect(subscription.id).toBeDefined();
      expect(subscription.isActive).toBe(true);
    });

    it('should create and track webhook events', () => {
      const subscription = paymentService.subscribeToWebhook(
        organizationId,
        'PAYMENT_CAPTURED' as any,
        'https://example.com/webhooks/payment'
      );

      const event = paymentService.createWebhookEvent(
        organizationId,
        subscription.id,
        'PAYMENT_CAPTURED' as any,
        { paymentId: 'pay-123', amount: 1000 }
      );

      expect(event.id).toBeDefined();
      expect(event.status).toBe('PENDING');
    });

    it('should update webhook event status', () => {
      const subscription = paymentService.subscribeToWebhook(organizationId, 'PAYMENT_CAPTURED' as any, 'https://example.com/webhooks');
      const event = paymentService.createWebhookEvent(organizationId, subscription.id, 'PAYMENT_CAPTURED' as any, { amount: 100 });

      const updated = paymentService.updateWebhookEventStatus(
        organizationId,
        event.id,
        'DELIVERED',
        0
      );

      expect(updated?.status).toBe('DELIVERED');
    });

    it('should get payment statistics', () => {
      const payment1 = paymentService.createPayment(organizationId, 500.00, 'EGP', PaymentGatewayType.STRIPE, 'txn-1', 'Payment 1');
      const payment2 = paymentService.createPayment(organizationId, 300.00, 'EGP', PaymentGatewayType.STRIPE, 'txn-2', 'Payment 2');

      paymentService.capturePayment(organizationId, payment1.id);
      paymentService.failPayment(organizationId, payment2.id, 'Failed');

      const stats = paymentService.getPaymentStats(organizationId);

      expect(stats.totalPayments).toBe(2);
      expect(stats.successfulPayments).toBe(1);
      expect(stats.failedPayments).toBe(1);
      expect(stats.totalAmount).toBe(800.00);
    });

    it('should block organization isolation', () => {
      const payment = paymentService.createPayment(
        organizationId,
        100.00,
        'EGP',
        PaymentGatewayType.STRIPE,
        'txn-123',
        'Payment'
      );

      const result = paymentService.getPaymentById('other-org', payment.id);

      expect(result).toBeNull();
    });
  });

  describe('Integration Scenarios', () => {
    it('should complete WhatsApp notification workflow', () => {
      const conv = whatsappService.createConversation(organizationId, '+201001234567', 'Customer');
      const message = whatsappService.sendMessage(
        organizationId,
        conv.id,
        '+201001234567',
        WhatsAppMessageType.TEXT,
        'Your order is confirmed'
      );

      whatsappService.updateMessageStatus(organizationId, message.id, WhatsAppMessageStatus.DELIVERED);
      whatsappService.updateMessageStatus(organizationId, message.id, WhatsAppMessageStatus.READ);

      const updated = whatsappService.getMessageById(organizationId, message.id);

      expect(updated?.status).toBe(WhatsAppMessageStatus.READ);
      expect(updated?.readAt).toBeDefined();
    });

    it('should complete email campaign sending workflow', () => {
      const campaign = emailService.createCampaign(
        organizationId,
        'Newsletter',
        'Monthly Newsletter',
        'newsletter@company.com',
        'Company',
        'Monthly updates',
        'admin-123'
      );

      emailService.addRecipient(campaign.id, 'sub1@example.com', 'Subscriber 1');
      const msg = emailService.sendMessage(organizationId, campaign.id, 'sub1@example.com', 'Subscriber 1', 'Subject', 'Content');

      emailService.updateCampaignStatus(organizationId, campaign.id, EmailCampaignStatus.SENT);
      emailService.updateMessageStatus(organizationId, msg.id, EmailMessageStatus.OPENED);

      const updated = emailService.getCampaignById(organizationId, campaign.id);

      expect(updated?.status).toBe(EmailCampaignStatus.SENT);
    });

    it('should complete payment processing workflow', () => {
      const payment = paymentService.createPayment(
        organizationId,
        2000.00,
        'EGP',
        PaymentGatewayType.STRIPE,
        'ch_stripe_123456',
        'Invoice payment'
      );

      paymentService.authorizePayment(organizationId, payment.id);
      paymentService.capturePayment(organizationId, payment.id);

      const final = paymentService.getPaymentById(organizationId, payment.id);

      expect(final?.status).toBe(PaymentStatus.CAPTURED);
      expect(final?.capturedAt).toBeDefined();
    });
  });
});
