import { db } from '../../../platform/database/db';
import { ValidationError, NotFoundError } from '../../../platform/errors/errors';
import { Notification, NotificationCreateInput } from '../models/index';
import * as crypto from 'crypto';

export class NotificationService {
  async createNotification(
    organizationId: string,
    input: NotificationCreateInput,
    userId: string
  ): Promise<Notification> {
    if (!input.userId || !input.userId.trim()) {
      throw new ValidationError('User ID is required', { userId: 'Required' });
    }
    if (!input.type || !['info', 'warning', 'error', 'success'].includes(input.type)) {
      throw new ValidationError('Invalid notification type', { type: 'Invalid value' });
    }
    if (!input.title || !input.title.trim()) {
      throw new ValidationError('Notification title is required', { title: 'Required' });
    }
    if (!input.message || !input.message.trim()) {
      throw new ValidationError('Notification message is required', { message: 'Required' });
    }

    const notificationId = crypto.randomUUID();

    const result = await db.query(
      `
      INSERT INTO notifications (
        id, organization_id, user_id, type, title, message, action_url,
        is_read, read_at, expires_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, false, null, $8, NOW(), NOW())
      RETURNING *
      `,
      [
        notificationId,
        organizationId,
        input.userId,
        input.type,
        input.title,
        input.message,
        input.actionUrl || null,
        input.expiresAt || null,
      ]
    );

    return this.mapToNotification(result.rows[0]);
  }

  async getNotificationById(notificationId: string, organizationId: string): Promise<Notification> {
    const result = await db.query(
      `SELECT * FROM notifications WHERE id = $1 AND organization_id = $2`,
      [notificationId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Notification not found');
    }

    return this.mapToNotification(result.rows[0]);
  }

  async getUserNotifications(
    userId: string,
    organizationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ items: Notification[]; total: number }> {
    const totalResult = await db.query(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND organization_id = $2`,
      [userId, organizationId]
    );
    const total = totalResult.rows[0].count;

    const result = await db.query(
      `
      SELECT * FROM notifications
      WHERE user_id = $1 AND organization_id = $2
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
      `,
      [userId, organizationId, limit, offset]
    );

    return {
      items: result.rows.map((row) => this.mapToNotification(row)),
      total,
    };
  }

  async getUnreadUserNotifications(
    userId: string,
    organizationId: string
  ): Promise<Notification[]> {
    const result = await db.query(
      `
      SELECT * FROM notifications
      WHERE user_id = $1 AND organization_id = $2 AND is_read = false
      AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY created_at DESC
      `,
      [userId, organizationId]
    );

    return result.rows.map((row) => this.mapToNotification(row));
  }

  async markAsRead(notificationId: string, organizationId: string): Promise<Notification> {
    const result = await db.query(
      `
      UPDATE notifications
      SET is_read = true, read_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
      `,
      [notificationId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Notification not found');
    }

    return this.mapToNotification(result.rows[0]);
  }

  async markMultipleAsRead(
    notificationIds: string[],
    organizationId: string
  ): Promise<void> {
    if (notificationIds.length === 0) {
      return;
    }

    const placeholders = notificationIds.map((_, i) => `$${i + 2}`).join(',');
    await db.query(
      `
      UPDATE notifications
      SET is_read = true, read_at = NOW(), updated_at = NOW()
      WHERE id IN (${placeholders}) AND organization_id = $1
      `,
      [organizationId, ...notificationIds]
    );
  }

  async deleteNotification(notificationId: string, organizationId: string): Promise<void> {
    const result = await db.query(
      `DELETE FROM notifications WHERE id = $1 AND organization_id = $2`,
      [notificationId, organizationId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('Notification not found');
    }
  }

  async deleteExpiredNotifications(organizationId: string): Promise<number> {
    const result = await db.query(
      `
      DELETE FROM notifications
      WHERE organization_id = $1 AND expires_at IS NOT NULL AND expires_at <= NOW()
      `,
      [organizationId]
    );

    return result.rowCount || 0;
  }

  private mapToNotification(row: any): Notification {
    return {
      id: row.id,
      organizationId: row.organization_id,
      userId: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      actionUrl: row.action_url,
      isRead: row.is_read,
      readAt: row.read_at,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const notificationService = new NotificationService();
