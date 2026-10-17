import { db } from '../../../platform/database/db';
import { ValidationError, NotFoundError } from '../../../platform/errors/errors';
import { ContactChannel, ContactChannelCreateInput } from '../models/index';

export class ContactChannelService {
  async createChannel(
    organizationId: string,
    input: ContactChannelCreateInput,
    userId: string
  ): Promise<ContactChannel> {
    if (!input.contactId || !input.contactId.trim()) {
      throw new ValidationError('Contact ID is required', { contactId: 'Required' });
    }
    if (!input.type || !['email', 'phone', 'whatsapp', 'telegram', 'linkedin', 'twitter'].includes(input.type)) {
      throw new ValidationError('Invalid channel type', { type: 'Invalid value' });
    }
    if (!input.value || !input.value.trim()) {
      throw new ValidationError('Channel value is required', { value: 'Required' });
    }

    const channelId = crypto.randomUUID();

    const result = await db.query(
      `
      INSERT INTO contact_channels (
        id, organization_id, contact_id, type, value, is_verified, is_primary, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, false, $6, NOW(), NOW())
      RETURNING *
      `,
      [channelId, organizationId, input.contactId, input.type, input.value, input.isPrimary || false]
    );

    return this.mapToChannel(result.rows[0]);
  }

  async getChannelById(channelId: string, organizationId: string): Promise<ContactChannel> {
    const result = await db.query(
      `SELECT * FROM contact_channels WHERE id = $1 AND organization_id = $2`,
      [channelId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Contact channel not found');
    }

    return this.mapToChannel(result.rows[0]);
  }

  async getContactChannels(contactId: string, organizationId: string): Promise<ContactChannel[]> {
    const result = await db.query(
      `SELECT * FROM contact_channels WHERE contact_id = $1 AND organization_id = $2 ORDER BY is_primary DESC, created_at ASC`,
      [contactId, organizationId]
    );

    return result.rows.map((row) => this.mapToChannel(row));
  }

  async getChannelsByType(
    organizationId: string,
    type: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<{ items: ContactChannel[]; total: number }> {
    const totalResult = await db.query(
      `SELECT COUNT(*) as count FROM contact_channels WHERE organization_id = $1 AND type = $2`,
      [organizationId, type]
    );
    const total = totalResult.rows[0].count;

    const result = await db.query(
      `
      SELECT * FROM contact_channels
      WHERE organization_id = $1 AND type = $2
      ORDER BY is_primary DESC, created_at DESC
      LIMIT $3 OFFSET $4
      `,
      [organizationId, type, limit, offset]
    );

    return {
      items: result.rows.map((row) => this.mapToChannel(row)),
      total,
    };
  }

  async verifyChannel(channelId: string, organizationId: string): Promise<ContactChannel> {
    const result = await db.query(
      `
      UPDATE contact_channels
      SET is_verified = true, verified_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
      `,
      [channelId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Contact channel not found');
    }

    return this.mapToChannel(result.rows[0]);
  }

  async setPrimaryChannel(channelId: string, organizationId: string): Promise<ContactChannel> {
    const channel = await this.getChannelById(channelId, organizationId);

    await db.query(
      `
      UPDATE contact_channels
      SET is_primary = false, updated_at = NOW()
      WHERE contact_id = $1 AND organization_id = $2 AND id != $3
      `,
      [channel.contactId, organizationId, channelId]
    );

    const result = await db.query(
      `
      UPDATE contact_channels
      SET is_primary = true, updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
      `,
      [channelId, organizationId]
    );

    return this.mapToChannel(result.rows[0]);
  }

  async deleteChannel(channelId: string, organizationId: string): Promise<void> {
    const result = await db.query(
      `DELETE FROM contact_channels WHERE id = $1 AND organization_id = $2`,
      [channelId, organizationId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('Contact channel not found');
    }
  }

  private mapToChannel(row: any): ContactChannel {
    return {
      id: row.id,
      organizationId: row.organization_id,
      contactId: row.contact_id,
      type: row.type,
      value: row.value,
      isVerified: row.is_verified,
      verifiedAt: row.verified_at,
      isPrimary: row.is_primary,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const contactChannelService = new ContactChannelService();
