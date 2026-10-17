import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../../platform/database/db';
import { messageService } from '../../domains/communications/services/MessageService';
import { contactChannelService } from '../../domains/communications/services/ContactChannelService';
import { communicationPreferenceService } from '../../domains/communications/services/CommunicationPreferenceService';
import { emailAccountService } from '../../domains/communications/services/EmailAccountService';
import { notificationService } from '../../domains/communications/services/NotificationService';
import { messageLogService } from '../../domains/communications/services/MessageLogService';
import { ValidationError, NotFoundError } from '../../platform/errors/errors';
import * as crypto from 'crypto';

let orgId: string;
let userId: string;
let contactId: string;

beforeAll(async () => {
  orgId = crypto.randomUUID();
  userId = crypto.randomUUID();
  contactId = crypto.randomUUID();

  await db.query(
    `INSERT INTO organizations (id, name, slug) VALUES ($1, $2, $3)`,
    [orgId, 'Test Org Phase 6', 'test-org-phase6']
  );
});

afterAll(async () => {
  await db.query(`DELETE FROM organizations WHERE id = $1`, [orgId]);
});

describe('Contact Channels', () => {
  let channelId: string;

  it('should create a contact channel', async () => {
    const channel = await contactChannelService.createChannel(
      orgId,
      {
        contactId,
        type: 'email',
        value: 'contact@example.com',
      },
      userId
    );

    channelId = channel.id;
    expect(channel.organizationId).toBe(orgId);
    expect(channel.contactId).toBe(contactId);
    expect(channel.type).toBe('email');
    expect(channel.value).toBe('contact@example.com');
    expect(channel.isVerified).toBe(false);
    expect(channel.isPrimary).toBe(false);
  });

  it('should fail to create channel without contact ID', async () => {
    expect(async () => {
      await contactChannelService.createChannel(
        orgId,
        { contactId: '', type: 'email', value: 'test@example.com' },
        userId
      );
    }).rejects.toThrow(ValidationError);
  });

  it('should fail to create channel with invalid type', async () => {
    expect(async () => {
      await contactChannelService.createChannel(
        orgId,
        { contactId, type: 'invalid' as any, value: 'test@example.com' },
        userId
      );
    }).rejects.toThrow(ValidationError);
  });

  it('should get channel by ID', async () => {
    const channel = await contactChannelService.getChannelById(channelId, orgId);
    expect(channel.id).toBe(channelId);
    expect(channel.value).toBe('contact@example.com');
  });

  it('should get contact channels', async () => {
    const channels = await contactChannelService.getContactChannels(contactId, orgId);
    expect(channels).toHaveLength(1);
    expect(channels[0].id).toBe(channelId);
  });

  it('should get channels by type with pagination', async () => {
    const result = await contactChannelService.getChannelsByType(orgId, 'email', 10, 0);
    expect(result.total).toBeGreaterThan(0);
    expect(result.items.length).toBeGreaterThan(0);
  });

  it('should verify channel', async () => {
    const verified = await contactChannelService.verifyChannel(channelId, orgId);
    expect(verified.isVerified).toBe(true);
    expect(verified.verifiedAt).toBeTruthy();
  });

  it('should set primary channel', async () => {
    const primary = await contactChannelService.setPrimaryChannel(channelId, orgId);
    expect(primary.isPrimary).toBe(true);
  });

  it('should delete channel', async () => {
    await contactChannelService.deleteChannel(channelId, orgId);
    expect(async () => {
      await contactChannelService.getChannelById(channelId, orgId);
    }).rejects.toThrow(NotFoundError);
  });

  it('should enforce org isolation', async () => {
    const otherOrgId = crypto.randomUUID();
    expect(async () => {
      await contactChannelService.getChannelById(channelId, otherOrgId);
    }).rejects.toThrow(NotFoundError);
  });
});

describe('Messages', () => {
  let messageId: string;

  it('should create a message', async () => {
    const message = await messageService.createMessage(
      orgId,
      {
        toContactId: contactId,
        channel: 'email',
        subject: 'Test Subject',
        body: 'Test message body',
        tags: ['test'],
        metadata: { source: 'test' },
      },
      userId
    );

    messageId = message.id;
    expect(message.organizationId).toBe(orgId);
    expect(message.toContactId).toBe(contactId);
    expect(message.channel).toBe('email');
    expect(message.status).toBe('draft');
    expect(message.direction).toBe('outbound');
    expect(message.tags).toContain('test');
  });

  it('should fail to create message without recipient', async () => {
    expect(async () => {
      await messageService.createMessage(
        orgId,
        {
          toContactId: '',
          channel: 'email',
          body: 'Test',
        },
        userId
      );
    }).rejects.toThrow(ValidationError);
  });

  it('should require subject for email messages', async () => {
    expect(async () => {
      await messageService.createMessage(
        orgId,
        {
          toContactId: contactId,
          channel: 'email',
          body: 'Test',
        },
        userId
      );
    }).rejects.toThrow(ValidationError);
  });

  it('should get message by ID', async () => {
    const message = await messageService.getMessageById(messageId, orgId);
    expect(message.id).toBe(messageId);
    expect(message.body).toBe('Test message body');
  });

  it('should get contact messages', async () => {
    const { items, total } = await messageService.getContactMessages(contactId, orgId);
    expect(total).toBeGreaterThan(0);
    expect(items.length).toBeGreaterThan(0);
  });

  it('should send a message', async () => {
    const sent = await messageService.sendMessage(messageId, orgId, 'ext-123');
    expect(sent.status).toBe('sent');
    expect(sent.sentAt).toBeTruthy();
    expect(sent.externalId).toBe('ext-123');
  });

  it('should record message delivery', async () => {
    const delivered = await messageService.recordMessageDelivery(messageId, orgId);
    expect(delivered.status).toBe('delivered');
    expect(delivered.deliveredAt).toBeTruthy();
  });

  it('should record message failure', async () => {
    const { id: failId } = await messageService.createMessage(
      orgId,
      {
        toContactId: contactId,
        channel: 'sms',
        body: 'SMS message',
      },
      userId
    );

    await messageService.sendMessage(failId, orgId);
    const failed = await messageService.recordMessageFailure(failId, orgId, 'Invalid number');
    expect(failed.status).toBe('failed');
    expect(failed.failureReason).toBe('Invalid number');
  });

  it('should enforce org isolation', async () => {
    const otherOrgId = crypto.randomUUID();
    expect(async () => {
      await messageService.getMessageById(messageId, otherOrgId);
    }).rejects.toThrow(NotFoundError);
  });
});

describe('Message Templates', () => {
  let templateId: string;

  it('should create a template with variable extraction', async () => {
    const template = await messageService.createTemplate(
      orgId,
      {
        name: 'Welcome Email',
        description: 'Welcome new customers',
        channel: 'email',
        subject: 'Welcome {{firstName}}!',
        body: 'Hello {{firstName}} {{lastName}}, welcome to {{companyName}}!',
        category: 'marketing',
      },
      userId
    );

    templateId = template.id;
    expect(template.name).toBe('Welcome Email');
    expect(template.variables).toContain('firstName');
    expect(template.variables).toContain('lastName');
    expect(template.variables).toContain('companyName');
    expect(template.variables).toHaveLength(3);
  });

  it('should extract unique variables only', async () => {
    const template = await messageService.createTemplate(
      orgId,
      {
        name: 'Duplicate Vars',
        channel: 'email',
        subject: 'Hello {{name}}',
        body: 'Hi {{name}}, welcome {{name}}!',
        category: 'notification',
      },
      userId
    );

    expect(template.variables).toEqual(['name']);
  });

  it('should fail to create template without name', async () => {
    expect(async () => {
      await messageService.createTemplate(
        orgId,
        {
          name: '',
          channel: 'email',
          body: 'Test',
          category: 'notification',
        },
        userId
      );
    }).rejects.toThrow(ValidationError);
  });

  it('should get template by ID', async () => {
    const template = await messageService.getTemplateById(templateId, orgId);
    expect(template.id).toBe(templateId);
    expect(template.name).toBe('Welcome Email');
  });

  it('should get organization templates', async () => {
    const templates = await messageService.getOrganizationTemplates(orgId);
    expect(templates.length).toBeGreaterThan(0);
    expect(templates.some((t) => t.id === templateId)).toBe(true);
  });

  it('should filter templates by channel', async () => {
    const templates = await messageService.getOrganizationTemplates(orgId, { channel: 'email' });
    expect(templates.every((t) => t.channel === 'email')).toBe(true);
  });

  it('should filter templates by category', async () => {
    const templates = await messageService.getOrganizationTemplates(orgId, { category: 'marketing' });
    expect(templates.some((t) => t.category === 'marketing')).toBe(true);
  });

  it('should enforce org isolation', async () => {
    const otherOrgId = crypto.randomUUID();
    expect(async () => {
      await messageService.getTemplateById(templateId, otherOrgId);
    }).rejects.toThrow(NotFoundError);
  });
});

describe('Communication Preferences', () => {
  let preferenceId: string;
  let unsubscribeToken: string;

  it('should create a communication preference', async () => {
    const preference = await communicationPreferenceService.createPreference(
      orgId,
      {
        contactId,
        channel: 'email',
        isOptedIn: true,
        frequency: 'daily',
        categories: ['marketing', 'updates'],
      },
      userId
    );

    preferenceId = preference.id;
    unsubscribeToken = preference.unsubscribeToken;
    expect(preference.organizationId).toBe(orgId);
    expect(preference.contactId).toBe(contactId);
    expect(preference.isOptedIn).toBe(true);
    expect(preference.frequency).toBe('daily');
    expect(preference.categories).toEqual(['marketing', 'updates']);
    expect(unsubscribeToken).toBeTruthy();
  });

  it('should validate frequency values', async () => {
    expect(async () => {
      await communicationPreferenceService.createPreference(
        orgId,
        {
          contactId,
          channel: 'whatsapp',
          isOptedIn: true,
          frequency: 'invalid' as any,
        },
        userId
      );
    }).rejects.toThrow(ValidationError);
  });

  it('should get preference by ID', async () => {
    const preference = await communicationPreferenceService.getPreferenceById(
      preferenceId,
      orgId
    );
    expect(preference.id).toBe(preferenceId);
    expect(preference.frequency).toBe('daily');
  });

  it('should get contact preferences', async () => {
    const preferences = await communicationPreferenceService.getContactPreferences(
      contactId,
      orgId
    );
    expect(preferences.length).toBeGreaterThan(0);
  });

  it('should update preference', async () => {
    const updated = await communicationPreferenceService.updatePreference(
      preferenceId,
      orgId,
      {
        isOptedIn: false,
        frequency: 'weekly',
        categories: ['updates'],
      }
    );

    expect(updated.isOptedIn).toBe(false);
    expect(updated.frequency).toBe('weekly');
    expect(updated.categories).toEqual(['updates']);
  });

  it('should unsubscribe by token', async () => {
    const unsubscribed = await communicationPreferenceService.unsubscribeByToken(
      unsubscribeToken
    );
    expect(unsubscribed.isOptedIn).toBe(false);
    expect(unsubscribed.unsubscribedAt).toBeTruthy();
  });

  it('should enforce org isolation', async () => {
    const otherOrgId = crypto.randomUUID();
    expect(async () => {
      await communicationPreferenceService.getPreferenceById(preferenceId, otherOrgId);
    }).rejects.toThrow(NotFoundError);
  });
});

describe('Email Accounts', () => {
  let accountId: string;

  it('should create an SMTP email account', async () => {
    const account = await emailAccountService.createEmailAccount(
      orgId,
      {
        name: 'Primary Email',
        email: 'noreply@example.com',
        provider: 'smtp',
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
        smtpUser: 'user@example.com',
        smtpPassword: 'password123',
      },
      userId
    );

    accountId = account.id;
    expect(account.organizationId).toBe(orgId);
    expect(account.email).toBe('noreply@example.com');
    expect(account.provider).toBe('smtp');
    expect(account.status).toBe('inactive');
    expect(account.isVerified).toBe(false);
  });

  it('should require SMTP credentials for SMTP provider', async () => {
    expect(async () => {
      await emailAccountService.createEmailAccount(
        orgId,
        {
          name: 'Test',
          email: 'test@example.com',
          provider: 'smtp',
        },
        userId
      );
    }).rejects.toThrow(ValidationError);
  });

  it('should get email account by ID', async () => {
    const account = await emailAccountService.getEmailAccountById(accountId, orgId);
    expect(account.id).toBe(accountId);
    expect(account.email).toBe('noreply@example.com');
  });

  it('should get organization email accounts', async () => {
    const accounts = await emailAccountService.getOrganizationEmailAccounts(orgId);
    expect(accounts.length).toBeGreaterThan(0);
  });

  it('should get primary email account', async () => {
    const account = await emailAccountService.createEmailAccount(
      orgId,
      {
        name: 'Primary',
        email: 'primary@example.com',
        provider: 'smtp',
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
        smtpUser: 'user@example.com',
        smtpPassword: 'pass',
        isPrimary: true,
      },
      userId
    );

    const primary = await emailAccountService.getPrimaryEmailAccount(orgId);
    expect(primary?.id).toBe(account.id);
  });

  it('should verify email account', async () => {
    const verified = await emailAccountService.verifyEmailAccount(accountId, orgId);
    expect(verified.isVerified).toBe(true);
    expect(verified.status).toBe('active');
  });

  it('should set primary email account', async () => {
    const primary = await emailAccountService.setPrimaryEmailAccount(accountId, orgId);
    expect(primary.isPrimary).toBe(true);
  });

  it('should record email error', async () => {
    const errored = await emailAccountService.recordEmailError(
      accountId,
      orgId,
      'SMTP connection failed'
    );
    expect(errored.status).toBe('error');
    expect(errored.lastErrorMessage).toBe('SMTP connection failed');
  });

  it('should delete email account', async () => {
    await emailAccountService.deleteEmailAccount(accountId, orgId);
    expect(async () => {
      await emailAccountService.getEmailAccountById(accountId, orgId);
    }).rejects.toThrow(NotFoundError);
  });

  it('should enforce org isolation', async () => {
    const otherOrgId = crypto.randomUUID();
    const { id } = await emailAccountService.createEmailAccount(
      orgId,
      {
        name: 'Test',
        email: 'test@example.com',
        provider: 'smtp',
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
        smtpUser: 'user@example.com',
        smtpPassword: 'pass',
      },
      userId
    );

    expect(async () => {
      await emailAccountService.getEmailAccountById(id, otherOrgId);
    }).rejects.toThrow(NotFoundError);
  });
});

describe('Notifications', () => {
  let notificationId: string;

  it('should create a notification', async () => {
    const notification = await notificationService.createNotification(
      orgId,
      {
        userId,
        type: 'info',
        title: 'Test Notification',
        message: 'This is a test notification',
        actionUrl: 'https://example.com',
      },
      userId
    );

    notificationId = notification.id;
    expect(notification.organizationId).toBe(orgId);
    expect(notification.userId).toBe(userId);
    expect(notification.type).toBe('info');
    expect(notification.isRead).toBe(false);
  });

  it('should validate notification type', async () => {
    expect(async () => {
      await notificationService.createNotification(
        orgId,
        {
          userId,
          type: 'invalid' as any,
          title: 'Test',
          message: 'Test',
        },
        userId
      );
    }).rejects.toThrow(ValidationError);
  });

  it('should get user notifications', async () => {
    const { items, total } = await notificationService.getUserNotifications(userId, orgId);
    expect(total).toBeGreaterThan(0);
    expect(items.length).toBeGreaterThan(0);
  });

  it('should get unread notifications', async () => {
    const unread = await notificationService.getUnreadUserNotifications(userId, orgId);
    expect(unread.length).toBeGreaterThan(0);
    expect(unread.every((n) => !n.isRead)).toBe(true);
  });

  it('should mark notification as read', async () => {
    const read = await notificationService.markAsRead(notificationId, orgId);
    expect(read.isRead).toBe(true);
    expect(read.readAt).toBeTruthy();
  });

  it('should mark multiple as read', async () => {
    const { id: id1 } = await notificationService.createNotification(
      orgId,
      { userId, type: 'success', title: 'T1', message: 'M1' },
      userId
    );
    const { id: id2 } = await notificationService.createNotification(
      orgId,
      { userId, type: 'warning', title: 'T2', message: 'M2' },
      userId
    );

    await notificationService.markMultipleAsRead([id1, id2], orgId);

    const n1 = await notificationService.getNotificationById(id1, orgId);
    const n2 = await notificationService.getNotificationById(id2, orgId);
    expect(n1.isRead).toBe(true);
    expect(n2.isRead).toBe(true);
  });

  it('should delete notification', async () => {
    const { id } = await notificationService.createNotification(
      orgId,
      { userId, type: 'error', title: 'Delete Me', message: 'Test' },
      userId
    );

    await notificationService.deleteNotification(id, orgId);
    expect(async () => {
      await notificationService.getNotificationById(id, orgId);
    }).rejects.toThrow(NotFoundError);
  });

  it('should enforce org isolation', async () => {
    const otherOrgId = crypto.randomUUID();
    expect(async () => {
      await notificationService.getNotificationById(notificationId, otherOrgId);
    }).rejects.toThrow(NotFoundError);
  });
});

describe('Message Logs', () => {
  let messageId: string;

  beforeAll(async () => {
    const msg = await messageService.createMessage(
      orgId,
      {
        toContactId: contactId,
        channel: 'email',
        subject: 'Log Test',
        body: 'Test message for logging',
      },
      userId
    );
    messageId = msg.id;
  });

  it('should log a message event', async () => {
    const log = await messageLogService.logMessageEvent(orgId, messageId, 'created', {
      source: 'api',
    });

    expect(log.organizationId).toBe(orgId);
    expect(log.messageId).toBe(messageId);
    expect(log.event).toBe('created');
    expect(log.details.source).toBe('api');
  });

  it('should validate event type', async () => {
    expect(async () => {
      await messageLogService.logMessageEvent(orgId, messageId, 'invalid' as any);
    }).rejects.toThrow(ValidationError);
  });

  it('should get logs for a message', async () => {
    await messageLogService.logMessageEvent(orgId, messageId, 'sent');
    await messageLogService.logMessageEvent(orgId, messageId, 'delivered');

    const logs = await messageLogService.getMessageLogs(messageId, orgId);
    expect(logs.length).toBeGreaterThan(0);
    expect(logs.some((l) => l.event === 'created')).toBe(true);
  });

  it('should get logs by event type', async () => {
    const { items } = await messageLogService.getMessageLogsByEvent(orgId, 'delivered');
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((l) => l.event === 'delivered')).toBe(true);
  });

  it('should get event summary', async () => {
    const summary = await messageLogService.getEventSummary(orgId);
    expect(typeof summary).toBe('object');
    expect(Object.keys(summary).length).toBeGreaterThan(0);
  });

  it('should enforce org isolation', async () => {
    const otherOrgId = crypto.randomUUID();
    const logs = await messageLogService.getMessageLogs(messageId, otherOrgId);
    expect(logs).toHaveLength(0);
  });
});
