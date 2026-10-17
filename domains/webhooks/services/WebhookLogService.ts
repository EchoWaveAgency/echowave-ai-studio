import { WebhookLog } from '../models/index';
import { ValidationError } from '../../platform/errors/errors';

export class WebhookLogService {
  async logAction(organizationId: string, webhookEventId: string, action: string, endpointId: string, details: Record<string, any>): Promise<WebhookLog> {
    if (!organizationId || !webhookEventId) {
      throw new ValidationError('Organization ID and webhook event ID are required');
    }

    const validActions = ['created', 'delivery_attempt', 'retry_scheduled', 'succeeded', 'failed', 'skipped'];
    if (!validActions.includes(action)) {
      throw new ValidationError('Invalid action');
    }

    const log: WebhookLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      webhookEventId,
      endpointId,
      action: action as any,
      details: details || {},
      timestamp: new Date(),
    };

    // Mock storage - in production would use database
    return log;
  }

  async getLogById(organizationId: string, logId: string): Promise<WebhookLog | null> {
    if (!organizationId || !logId) {
      return null;
    }
    // Mock storage - in production would query database with org isolation
    return null;
  }

  async getEventLogs(organizationId: string, webhookEventId: string, limit: number = 50, offset: number = 0): Promise<{ items: WebhookLog[]; total: number }> {
    if (!organizationId || !webhookEventId) {
      throw new ValidationError('Organization ID and webhook event ID are required');
    }
    // Mock storage - in production would query database with org isolation
    return { items: [], total: 0 };
  }

  async getEndpointLogs(organizationId: string, endpointId: string, limit: number = 50, offset: number = 0): Promise<{ items: WebhookLog[]; total: number }> {
    if (!organizationId || !endpointId) {
      throw new ValidationError('Organization ID and endpoint ID are required');
    }
    // Mock storage - in production would query database with org isolation
    return { items: [], total: 0 };
  }

  async getLogsByAction(organizationId: string, action: string, limit: number = 50, offset: number = 0): Promise<{ items: WebhookLog[]; total: number }> {
    if (!organizationId || !action) {
      throw new ValidationError('Organization ID and action are required');
    }
    // Mock storage - in production would query database where action = $1
    return { items: [], total: 0 };
  }

  async getLogsByDateRange(organizationId: string, startDate: Date, endDate: Date, limit: number = 50, offset: number = 0): Promise<{ items: WebhookLog[]; total: number }> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    if (!startDate || !endDate) {
      throw new ValidationError('Start and end dates are required');
    }
    if (startDate > endDate) {
      throw new ValidationError('Start date must be before end date');
    }
    // Mock storage - in production would query database with date range
    return { items: [], total: 0 };
  }

  async getRecentActivity(organizationId: string, hours: number = 24, limit: number = 50): Promise<WebhookLog[]> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    if (hours < 1) {
      throw new ValidationError('Hours must be 1 or greater');
    }
    // Mock storage - in production would query database where timestamp > now() - interval
    return [];
  }

  async getActivitySummary(organizationId: string, startDate: Date, endDate: Date): Promise<{
    totalActions: number;
    createdCount: number;
    deliveryAttemptCount: number;
    retryScheduledCount: number;
    succeededCount: number;
    failedCount: number;
    skippedCount: number;
  }> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    if (!startDate || !endDate) {
      throw new ValidationError('Start and end dates are required');
    }
    // Mock storage - in production would calculate from webhook_logs
    return {
      totalActions: 0,
      createdCount: 0,
      deliveryAttemptCount: 0,
      retryScheduledCount: 0,
      succeededCount: 0,
      failedCount: 0,
      skippedCount: 0,
    };
  }

  async exportActivityLog(organizationId: string, startDate: Date, endDate: Date, format: 'json' | 'csv' = 'json'): Promise<string> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    if (!startDate || !endDate) {
      throw new ValidationError('Start and end dates are required');
    }
    if (!['json', 'csv'].includes(format)) {
      throw new ValidationError('Format must be json or csv');
    }

    const { items } = await this.getLogsByDateRange(organizationId, startDate, endDate, 10000, 0);

    if (format === 'json') {
      return JSON.stringify(items, null, 2);
    }

    const headers = ['ID', 'Webhook Event ID', 'Endpoint ID', 'Action', 'Timestamp', 'Details'];
    const rows = items.map(log => [
      log.id,
      log.webhookEventId,
      log.endpointId,
      log.action,
      log.timestamp.toISOString(),
      JSON.stringify(log.details),
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

    return csvContent;
  }

  async deleteOldLogs(organizationId: string, daysToKeep: number = 90): Promise<number> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    if (daysToKeep < 1) {
      throw new ValidationError('Days to keep must be 1 or greater');
    }
    // Mock storage - in production would delete from database where timestamp < now() - interval
    return 0;
  }
}

export const webhookLogService = new WebhookLogService();
