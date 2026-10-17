import { db } from '../../../platform/database/db';
import { ValidationError, NotFoundError } from '../../../platform/errors/errors';
import { MessageLog } from '../models/index';
import * as crypto from 'crypto';

export class MessageLogService {
  async logMessageEvent(
    organizationId: string,
    messageId: string,
    event: 'created' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'opened' | 'clicked',
    details: Record<string, any> = {}
  ): Promise<MessageLog> {
    if (!messageId || !messageId.trim()) {
      throw new ValidationError('Message ID is required', { messageId: 'Required' });
    }
    if (!event || !['created', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked'].includes(event)) {
      throw new ValidationError('Invalid event type', { event: 'Invalid value' });
    }

    const logId = crypto.randomUUID();

    const result = await db.query(
      `
      INSERT INTO message_logs (
        id, organization_id, message_id, event, timestamp, details
      ) VALUES ($1, $2, $3, $4, NOW(), $5)
      RETURNING *
      `,
      [logId, organizationId, messageId, event, JSON.stringify(details)]
    );

    return this.mapToMessageLog(result.rows[0]);
  }

  async getMessageLogs(
    messageId: string,
    organizationId: string
  ): Promise<MessageLog[]> {
    const result = await db.query(
      `
      SELECT * FROM message_logs
      WHERE message_id = $1 AND organization_id = $2
      ORDER BY timestamp ASC
      `,
      [messageId, organizationId]
    );

    return result.rows.map((row) => this.mapToMessageLog(row));
  }

  async getMessageLogsByEvent(
    organizationId: string,
    event: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<{ items: MessageLog[]; total: number }> {
    const totalResult = await db.query(
      `SELECT COUNT(*) as count FROM message_logs WHERE organization_id = $1 AND event = $2`,
      [organizationId, event]
    );
    const total = totalResult.rows[0].count;

    const result = await db.query(
      `
      SELECT * FROM message_logs
      WHERE organization_id = $1 AND event = $2
      ORDER BY timestamp DESC
      LIMIT $3 OFFSET $4
      `,
      [organizationId, event, limit, offset]
    );

    return {
      items: result.rows.map((row) => this.mapToMessageLog(row)),
      total,
    };
  }

  async getMessageLogsInDateRange(
    organizationId: string,
    startDate: string,
    endDate: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<{ items: MessageLog[]; total: number }> {
    const totalResult = await db.query(
      `
      SELECT COUNT(*) as count FROM message_logs
      WHERE organization_id = $1 AND timestamp >= $2 AND timestamp <= $3
      `,
      [organizationId, startDate, endDate]
    );
    const total = totalResult.rows[0].count;

    const result = await db.query(
      `
      SELECT * FROM message_logs
      WHERE organization_id = $1 AND timestamp >= $2 AND timestamp <= $3
      ORDER BY timestamp DESC
      LIMIT $4 OFFSET $5
      `,
      [organizationId, startDate, endDate, limit, offset]
    );

    return {
      items: result.rows.map((row) => this.mapToMessageLog(row)),
      total,
    };
  }

  async getEventSummary(
    organizationId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Record<string, number>> {
    let query = `SELECT event, COUNT(*) as count FROM message_logs WHERE organization_id = $1`;
    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND timestamp >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      query += ` AND timestamp <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` GROUP BY event`;

    const result = await db.query(query, params);
    const summary: Record<string, number> = {};

    result.rows.forEach((row) => {
      summary[row.event] = parseInt(row.count, 10);
    });

    return summary;
  }

  async deleteOldLogs(organizationId: string, daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await db.query(
      `
      DELETE FROM message_logs
      WHERE organization_id = $1 AND timestamp < $2
      `,
      [organizationId, cutoffDate.toISOString()]
    );

    return result.rowCount || 0;
  }

  private mapToMessageLog(row: any): MessageLog {
    return {
      id: row.id,
      organizationId: row.organization_id,
      messageId: row.message_id,
      event: row.event,
      timestamp: row.timestamp,
      details: JSON.parse(row.details || '{}'),
    };
  }
}

export const messageLogService = new MessageLogService();
