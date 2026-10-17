import { db } from '../../../platform/database/db';
import { ValidationError, NotFoundError } from '../../../platform/errors/errors';
import { Message, MessageCreateInput, MessageTemplate, MessageTemplateCreateInput } from '../models/index';

export class MessageService {
  async createMessage(
    organizationId: string,
    input: MessageCreateInput,
    userId: string
  ): Promise<Message> {
    if (!input.toContactId || !input.toContactId.trim()) {
      throw new ValidationError('Recipient contact ID is required', { toContactId: 'Required' });
    }
    if (!input.channel || !['email', 'whatsapp', 'telegram', 'sms'].includes(input.channel)) {
      throw new ValidationError('Invalid channel', { channel: 'Invalid value' });
    }
    if (!input.body || !input.body.trim()) {
      throw new ValidationError('Message body is required', { body: 'Required' });
    }
    if (input.channel === 'email' && !input.subject) {
      throw new ValidationError('Email subject is required', { subject: 'Required' });
    }

    const messageId = crypto.randomUUID();
    const status = input.scheduledAt ? 'scheduled' : 'draft';

    const result = await db.query(
      `
      INSERT INTO messages (
        id, organization_id, to_contact_id, channel, subject, body, status, direction,
        tags, metadata, scheduled_at, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'outbound', $8, $9, $10, $11, NOW(), NOW())
      RETURNING *
      `,
      [
        messageId,
        organizationId,
        input.toContactId,
        input.channel,
        input.subject || null,
        input.body,
        status,
        JSON.stringify(input.tags || []),
        JSON.stringify(input.metadata || {}),
        input.scheduledAt || null,
        userId,
      ]
    );

    return this.mapToMessage(result.rows[0]);
  }

  async getMessageById(messageId: string, organizationId: string): Promise<Message> {
    const result = await db.query(
      `SELECT * FROM messages WHERE id = $1 AND organization_id = $2`,
      [messageId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Message not found');
    }

    return this.mapToMessage(result.rows[0]);
  }

  async getContactMessages(
    contactId: string,
    organizationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ items: Message[]; total: number }> {
    const totalResult = await db.query(
      `SELECT COUNT(*) as count FROM messages WHERE (to_contact_id = $1 OR from_contact_id = $1) AND organization_id = $2`,
      [contactId, organizationId]
    );
    const total = totalResult.rows[0].count;

    const result = await db.query(
      `
      SELECT * FROM messages
      WHERE (to_contact_id = $1 OR from_contact_id = $1) AND organization_id = $2
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
      `,
      [contactId, organizationId, limit, offset]
    );

    return {
      items: result.rows.map((row) => this.mapToMessage(row)),
      total,
    };
  }

  async sendMessage(messageId: string, organizationId: string, externalId?: string): Promise<Message> {
    const message = await this.getMessageById(messageId, organizationId);

    if (!['draft', 'scheduled'].includes(message.status)) {
      throw new ValidationError('Only draft or scheduled messages can be sent', { status: 'Invalid state' });
    }

    const result = await db.query(
      `
      UPDATE messages
      SET status = 'sent', external_id = $3, sent_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
      `,
      [messageId, organizationId, externalId || null]
    );

    return this.mapToMessage(result.rows[0]);
  }

  async recordMessageDelivery(messageId: string, organizationId: string): Promise<Message> {
    const result = await db.query(
      `
      UPDATE messages
      SET status = 'delivered', delivered_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
      `,
      [messageId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Message not found');
    }

    return this.mapToMessage(result.rows[0]);
  }

  async recordMessageFailure(messageId: string, organizationId: string, failureReason: string): Promise<Message> {
    const result = await db.query(
      `
      UPDATE messages
      SET status = 'failed', failure_reason = $3, updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
      `,
      [messageId, organizationId, failureReason]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Message not found');
    }

    return this.mapToMessage(result.rows[0]);
  }

  async createTemplate(
    organizationId: string,
    input: MessageTemplateCreateInput,
    userId: string
  ): Promise<MessageTemplate> {
    if (!input.name || !input.name.trim()) {
      throw new ValidationError('Template name is required', { name: 'Required' });
    }
    if (!input.body || !input.body.trim()) {
      throw new ValidationError('Template body is required', { body: 'Required' });
    }
    if (input.channel === 'email' && !input.subject) {
      throw new ValidationError('Email template requires subject', { subject: 'Required' });
    }

    const templateId = crypto.randomUUID();
    const variables = this.extractVariables(input.body);
    if (input.subject) {
      variables.push(...this.extractVariables(input.subject));
    }

    const result = await db.query(
      `
      INSERT INTO message_templates (
        id, organization_id, name, description, channel, subject, body, variables,
        category, status, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', $10, NOW(), NOW())
      RETURNING *
      `,
      [
        templateId,
        organizationId,
        input.name,
        input.description || null,
        input.channel,
        input.subject || null,
        input.body,
        JSON.stringify([...new Set(variables)]),
        input.category,
        userId,
      ]
    );

    return this.mapToTemplate(result.rows[0]);
  }

  async getTemplateById(templateId: string, organizationId: string): Promise<MessageTemplate> {
    const result = await db.query(
      `SELECT * FROM message_templates WHERE id = $1 AND organization_id = $2`,
      [templateId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Template not found');
    }

    return this.mapToTemplate(result.rows[0]);
  }

  async getOrganizationTemplates(
    organizationId: string,
    filters: {
      channel?: string;
      category?: string;
    } = {}
  ): Promise<MessageTemplate[]> {
    let query = `SELECT * FROM message_templates WHERE organization_id = $1 AND status = 'active'`;
    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (filters.channel) {
      query += ` AND channel = $${paramIndex}`;
      params.push(filters.channel);
      paramIndex++;
    }
    if (filters.category) {
      query += ` AND category = $${paramIndex}`;
      params.push(filters.category);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await db.query(query, params);
    return result.rows.map((row) => this.mapToTemplate(row));
  }

  private extractVariables(text: string): string[] {
    const regex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      variables.push(match[1]);
    }

    return variables;
  }

  private mapToMessage(row: any): Message {
    return {
      id: row.id,
      organizationId: row.organization_id,
      fromContactId: row.from_contact_id,
      toContactId: row.to_contact_id,
      channel: row.channel,
      subject: row.subject,
      body: row.body,
      status: row.status,
      direction: row.direction,
      externalId: row.external_id,
      scheduledAt: row.scheduled_at,
      sentAt: row.sent_at,
      deliveredAt: row.delivered_at,
      failureReason: row.failure_reason,
      tags: JSON.parse(row.tags || '[]'),
      metadata: JSON.parse(row.metadata || '{}'),
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapToTemplate(row: any): MessageTemplate {
    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      description: row.description,
      channel: row.channel,
      subject: row.subject,
      body: row.body,
      variables: JSON.parse(row.variables || '[]'),
      category: row.category,
      status: row.status,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const messageService = new MessageService();
