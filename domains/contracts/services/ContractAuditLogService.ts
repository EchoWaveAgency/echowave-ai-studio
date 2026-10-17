import { ContractAuditLog, AUDIT_EVENTS } from '../models/index';
import { ValidationError } from '../../platform/errors/errors';

export class ContractAuditLogService {
  async logEvent(organizationId: string, contractId: string, event: string, userId: string, userName: string, details: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<ContractAuditLog> {
    if (!organizationId || !contractId) {
      throw new ValidationError('Organization ID and contract ID are required');
    }
    if (!AUDIT_EVENTS.includes(event as any)) {
      throw new ValidationError('Invalid audit event');
    }
    if (!userId || userId.trim().length === 0) {
      throw new ValidationError('User ID is required');
    }
    if (!userName || userName.trim().length === 0) {
      throw new ValidationError('User name is required');
    }

    const log: ContractAuditLog = {
      id: `auditlog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      contractId,
      event: event as any,
      userId,
      userName,
      details: details || {},
      ipAddress,
      userAgent,
      timestamp: new Date(),
    };

    // Mock storage - in production would use database
    return log;
  }

  async getLogById(organizationId: string, logId: string): Promise<ContractAuditLog | null> {
    if (!organizationId || !logId) {
      return null;
    }
    // Mock storage - in production would query database with org isolation
    return null;
  }

  async getContractLogs(organizationId: string, contractId: string, limit: number = 50, offset: number = 0): Promise<{ items: ContractAuditLog[]; total: number }> {
    if (!organizationId || !contractId) {
      throw new ValidationError('Organization ID and contract ID are required');
    }
    // Mock storage - in production would query database with org isolation
    return { items: [], total: 0 };
  }

  async getLogsByEvent(organizationId: string, contractId: string, event: string, limit: number = 50, offset: number = 0): Promise<{ items: ContractAuditLog[]; total: number }> {
    if (!organizationId || !contractId) {
      throw new ValidationError('Organization ID and contract ID are required');
    }
    if (!AUDIT_EVENTS.includes(event as any)) {
      throw new ValidationError('Invalid audit event');
    }
    // Mock storage - in production would query database
    return { items: [], total: 0 };
  }

  async getLogsByUser(organizationId: string, contractId: string, userId: string, limit: number = 50, offset: number = 0): Promise<{ items: ContractAuditLog[]; total: number }> {
    if (!organizationId || !contractId || !userId) {
      throw new ValidationError('Organization ID, contract ID, and user ID are required');
    }
    // Mock storage - in production would query database
    return { items: [], total: 0 };
  }

  async getLogsByDateRange(organizationId: string, contractId: string, startDate: Date, endDate: Date, limit: number = 50, offset: number = 0): Promise<{ items: ContractAuditLog[]; total: number }> {
    if (!organizationId || !contractId) {
      throw new ValidationError('Organization ID and contract ID are required');
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

  async getRecentChanges(organizationId: string, contractId: string, hours: number = 24): Promise<ContractAuditLog[]> {
    if (!organizationId || !contractId) {
      throw new ValidationError('Organization ID and contract ID are required');
    }
    if (hours < 1) {
      throw new ValidationError('Hours must be 1 or greater');
    }
    // Mock storage - in production would query database where timestamp > now() - interval
    return [];
  }

  async getOrganizationLogs(organizationId: string, limit: number = 50, offset: number = 0): Promise<{ items: ContractAuditLog[]; total: number }> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    // Mock storage - in production would query database for all contracts in org
    return { items: [], total: 0 };
  }

  async exportAuditTrail(organizationId: string, contractId: string, format: 'json' | 'csv' = 'json'): Promise<string> {
    if (!organizationId || !contractId) {
      throw new ValidationError('Organization ID and contract ID are required');
    }
    if (!['json', 'csv'].includes(format)) {
      throw new ValidationError('Format must be json or csv');
    }

    const { items } = await this.getContractLogs(organizationId, contractId, 10000, 0);

    if (format === 'json') {
      return JSON.stringify(items, null, 2);
    }

    const headers = ['ID', 'Event', 'User', 'Timestamp', 'Details'];
    const rows = items.map(log => [
      log.id,
      log.event,
      log.userName,
      log.timestamp.toISOString(),
      JSON.stringify(log.details),
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

    return csvContent;
  }

  async deleteOldLogs(organizationId: string, contractId: string, daysToKeep: number = 90): Promise<number> {
    if (!organizationId || !contractId) {
      throw new ValidationError('Organization ID and contract ID are required');
    }
    if (daysToKeep < 1) {
      throw new ValidationError('Days to keep must be 1 or greater');
    }
    // Mock storage - in production would delete from database where timestamp < now() - interval
    return 0;
  }
}

export const contractAuditLogService = new ContractAuditLogService();
