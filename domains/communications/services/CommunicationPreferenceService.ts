import { db } from '../../../platform/database/db';
import { ValidationError, NotFoundError } from '../../../platform/errors/errors';
import { CommunicationPreference, CommunicationPreferenceCreateInput } from '../models/index';
import * as crypto from 'crypto';

export class CommunicationPreferenceService {
  async createPreference(
    organizationId: string,
    input: CommunicationPreferenceCreateInput,
    userId: string
  ): Promise<CommunicationPreference> {
    if (!input.contactId || !input.contactId.trim()) {
      throw new ValidationError('Contact ID is required', { contactId: 'Required' });
    }
    if (!input.channel || !['email', 'whatsapp', 'telegram', 'sms'].includes(input.channel)) {
      throw new ValidationError('Invalid channel', { channel: 'Invalid value' });
    }
    if (!input.frequency || !['realtime', 'daily', 'weekly', 'monthly', 'never'].includes(input.frequency)) {
      throw new ValidationError('Invalid frequency', { frequency: 'Invalid value' });
    }

    const preferenceId = crypto.randomUUID();
    const unsubscribeToken = crypto.randomBytes(32).toString('hex');

    const result = await db.query(
      `
      INSERT INTO communication_preferences (
        id, organization_id, contact_id, channel, is_opted_in, frequency, categories,
        unsubscribe_token, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
      `,
      [
        preferenceId,
        organizationId,
        input.contactId,
        input.channel,
        input.isOptedIn,
        input.frequency,
        JSON.stringify(input.categories || []),
        unsubscribeToken,
      ]
    );

    return this.mapToPreference(result.rows[0]);
  }

  async getPreferenceById(preferenceId: string, organizationId: string): Promise<CommunicationPreference> {
    const result = await db.query(
      `SELECT * FROM communication_preferences WHERE id = $1 AND organization_id = $2`,
      [preferenceId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Communication preference not found');
    }

    return this.mapToPreference(result.rows[0]);
  }

  async getContactPreferences(contactId: string, organizationId: string): Promise<CommunicationPreference[]> {
    const result = await db.query(
      `SELECT * FROM communication_preferences WHERE contact_id = $1 AND organization_id = $2 ORDER BY channel`,
      [contactId, organizationId]
    );

    return result.rows.map((row) => this.mapToPreference(row));
  }

  async updatePreference(
    preferenceId: string,
    organizationId: string,
    updates: { isOptedIn?: boolean; frequency?: string; categories?: string[] }
  ): Promise<CommunicationPreference> {
    if (updates.frequency && !['realtime', 'daily', 'weekly', 'monthly', 'never'].includes(updates.frequency)) {
      throw new ValidationError('Invalid frequency', { frequency: 'Invalid value' });
    }

    const preference = await this.getPreferenceById(preferenceId, organizationId);

    const result = await db.query(
      `
      UPDATE communication_preferences
      SET
        is_opted_in = COALESCE($3, is_opted_in),
        frequency = COALESCE($4, frequency),
        categories = COALESCE($5, categories),
        updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
      `,
      [
        preferenceId,
        organizationId,
        updates.isOptedIn !== undefined ? updates.isOptedIn : null,
        updates.frequency || null,
        updates.categories ? JSON.stringify(updates.categories) : null,
      ]
    );

    return this.mapToPreference(result.rows[0]);
  }

  async unsubscribeByToken(token: string): Promise<CommunicationPreference> {
    const result = await db.query(
      `
      UPDATE communication_preferences
      SET is_opted_in = false, unsubscribed_at = NOW(), updated_at = NOW()
      WHERE unsubscribe_token = $1
      RETURNING *
      `,
      [token]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Preference not found');
    }

    return this.mapToPreference(result.rows[0]);
  }

  private mapToPreference(row: any): CommunicationPreference {
    return {
      id: row.id,
      organizationId: row.organization_id,
      contactId: row.contact_id,
      channel: row.channel,
      isOptedIn: row.is_opted_in,
      frequency: row.frequency,
      categories: JSON.parse(row.categories || '[]'),
      unsubscribeToken: row.unsubscribe_token,
      unsubscribedAt: row.unsubscribed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const communicationPreferenceService = new CommunicationPreferenceService();
