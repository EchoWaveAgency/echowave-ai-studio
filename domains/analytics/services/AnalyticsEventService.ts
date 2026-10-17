import { getConnection } from '../../../platform/database/connection';
import { ValidationError, NotFoundError } from '../../../platform/errors/errors';
import { AnalyticsEvent, AnalyticsEventCreateInput } from '../models/index';

export const analyticsEventService = {
  async trackEvent(organizationId: string, input: AnalyticsEventCreateInput, userId?: string, contactId?: string): Promise<AnalyticsEvent> {
    if (!input.eventType?.trim()) {
      throw new ValidationError('Event type is required');
    }
    if (!input.category?.trim()) {
      throw new ValidationError('Category is required');
    }
    if (!input.action?.trim()) {
      throw new ValidationError('Action is required');
    }

    const connection = await getConnection();
    const result = await connection.query(
      `INSERT INTO analytics_events (organization_id, user_id, contact_id, event_type, category, action, label, value, properties, session_id, metadata, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
       RETURNING *`,
      [organizationId, userId || null, contactId || null, input.eventType, input.category, input.action, input.label || null, input.value || null, JSON.stringify(input.properties || {}), input.sessionId || null, JSON.stringify(input.metadata || {})]
    );

    return result.rows[0];
  },

  async getEventById(eventId: string, organizationId: string): Promise<AnalyticsEvent> {
    const connection = await getConnection();
    const result = await connection.query(
      'SELECT * FROM analytics_events WHERE id = $1 AND organization_id = $2',
      [eventId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Event not found');
    }

    return result.rows[0];
  },

  async getOrganizationEvents(organizationId: string, limit: number = 100, offset: number = 0): Promise<{ items: AnalyticsEvent[]; total: number }> {
    const connection = await getConnection();
    const countResult = await connection.query(
      'SELECT COUNT(*) FROM analytics_events WHERE organization_id = $1',
      [organizationId]
    );

    const result = await connection.query(
      'SELECT * FROM analytics_events WHERE organization_id = $1 ORDER BY timestamp DESC LIMIT $2 OFFSET $3',
      [organizationId, limit, offset]
    );

    return { items: result.rows, total: parseInt(countResult.rows[0].count, 10) };
  },

  async getEventsByType(organizationId: string, eventType: string, limit: number = 100, offset: number = 0): Promise<{ items: AnalyticsEvent[]; total: number }> {
    const connection = await getConnection();
    const countResult = await connection.query(
      'SELECT COUNT(*) FROM analytics_events WHERE organization_id = $1 AND event_type = $2',
      [organizationId, eventType]
    );

    const result = await connection.query(
      'SELECT * FROM analytics_events WHERE organization_id = $1 AND event_type = $2 ORDER BY timestamp DESC LIMIT $3 OFFSET $4',
      [organizationId, eventType, limit, offset]
    );

    return { items: result.rows, total: parseInt(countResult.rows[0].count, 10) };
  },

  async getEventsByCategory(organizationId: string, category: string, limit: number = 100, offset: number = 0): Promise<{ items: AnalyticsEvent[]; total: number }> {
    const connection = await getConnection();
    const countResult = await connection.query(
      'SELECT COUNT(*) FROM analytics_events WHERE organization_id = $1 AND category = $2',
      [organizationId, category]
    );

    const result = await connection.query(
      'SELECT * FROM analytics_events WHERE organization_id = $1 AND category = $2 ORDER BY timestamp DESC LIMIT $3 OFFSET $4',
      [organizationId, category, limit, offset]
    );

    return { items: result.rows, total: parseInt(countResult.rows[0].count, 10) };
  },

  async getEventsByDateRange(organizationId: string, startDate: string, endDate: string, limit: number = 100, offset: number = 0): Promise<{ items: AnalyticsEvent[]; total: number }> {
    const connection = await getConnection();
    const countResult = await connection.query(
      'SELECT COUNT(*) FROM analytics_events WHERE organization_id = $1 AND timestamp >= $2 AND timestamp <= $3',
      [organizationId, startDate, endDate]
    );

    const result = await connection.query(
      'SELECT * FROM analytics_events WHERE organization_id = $1 AND timestamp >= $2 AND timestamp <= $3 ORDER BY timestamp DESC LIMIT $4 OFFSET $5',
      [organizationId, startDate, endDate, limit, offset]
    );

    return { items: result.rows, total: parseInt(countResult.rows[0].count, 10) };
  },

  async getEventsByUser(organizationId: string, userId: string, limit: number = 100, offset: number = 0): Promise<{ items: AnalyticsEvent[]; total: number }> {
    const connection = await getConnection();
    const countResult = await connection.query(
      'SELECT COUNT(*) FROM analytics_events WHERE organization_id = $1 AND user_id = $2',
      [organizationId, userId]
    );

    const result = await connection.query(
      'SELECT * FROM analytics_events WHERE organization_id = $1 AND user_id = $2 ORDER BY timestamp DESC LIMIT $3 OFFSET $4',
      [organizationId, userId, limit, offset]
    );

    return { items: result.rows, total: parseInt(countResult.rows[0].count, 10) };
  },

  async getEventsByContact(organizationId: string, contactId: string, limit: number = 100, offset: number = 0): Promise<{ items: AnalyticsEvent[]; total: number }> {
    const connection = await getConnection();
    const countResult = await connection.query(
      'SELECT COUNT(*) FROM analytics_events WHERE organization_id = $1 AND contact_id = $2',
      [organizationId, contactId]
    );

    const result = await connection.query(
      'SELECT * FROM analytics_events WHERE organization_id = $1 AND contact_id = $2 ORDER BY timestamp DESC LIMIT $3 OFFSET $4',
      [organizationId, contactId, limit, offset]
    );

    return { items: result.rows, total: parseInt(countResult.rows[0].count, 10) };
  },

  async getEventsBySession(organizationId: string, sessionId: string): Promise<AnalyticsEvent[]> {
    const connection = await getConnection();
    const result = await connection.query(
      'SELECT * FROM analytics_events WHERE organization_id = $1 AND session_id = $2 ORDER BY timestamp ASC',
      [organizationId, sessionId]
    );

    return result.rows;
  },

  async getEventSummary(organizationId: string, startDate: string, endDate: string): Promise<Record<string, number>> {
    const connection = await getConnection();
    const result = await connection.query(
      `SELECT event_type, COUNT(*) as count FROM analytics_events
       WHERE organization_id = $1 AND timestamp >= $2 AND timestamp <= $3
       GROUP BY event_type`,
      [organizationId, startDate, endDate]
    );

    const summary: Record<string, number> = {};
    result.rows.forEach((row) => {
      summary[row.event_type] = parseInt(row.count, 10);
    });

    return summary;
  },

  async deleteOldEvents(organizationId: string, daysOld: number = 90): Promise<number> {
    const connection = await getConnection();
    const result = await connection.query(
      `DELETE FROM analytics_events
       WHERE organization_id = $1 AND timestamp < NOW() - INTERVAL '${daysOld} days'`,
      [organizationId]
    );

    return result.rowCount;
  },
};
