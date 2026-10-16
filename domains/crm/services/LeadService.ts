// Lead Service — CRM Domain
// Manages lead creation, status workflow, and lifecycle

import { query, transaction } from '../../../platform/database/connection';
import { Lead, LeadCreateInput, LEAD_STATUSES } from '../models';
import { NotFoundError, ValidationError, ConflictError } from '../../../platform/errors/errors';
import { defaultLogger } from '../../../platform/logging/logger';
import { validateEmail } from '../../../platform/utils/validation';

export class LeadService {
  /**
   * Create a new lead from website form or manual entry
   */
  async createLead(organizationId: string, input: LeadCreateInput): Promise<Lead> {
    if (!validateEmail(input.email)) {
      throw new ValidationError('Invalid email format', { email: ['Invalid email address'] });
    }

    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationError('Name is required', { name: ['Name cannot be empty'] });
    }

    const lead = await transaction(async (client) => {
      const result = await client.query(
        `INSERT INTO leads
         (organization_id, name, email, phone, message, service_interest, status, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          organizationId,
          input.name,
          input.email,
          input.phone || null,
          input.message || null,
          input.serviceInterest || null,
          input.status || 'new',
          input.source || 'website',
        ]
      );

      const lead = result.rows[0];

      // Audit log
      await client.query(
        `INSERT INTO audit_events
         (organization_id, operation, resource_type, resource_id, changes, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          organizationId,
          'CREATE',
          'lead',
          lead.id,
          JSON.stringify({ name: input.name, email: input.email, source: input.source }),
          'success',
        ]
      );

      return lead;
    });

    defaultLogger.info(`Lead created: ${lead.id}`, {
      organizationId,
      name: input.name,
      source: input.source,
    });

    return lead;
  }

  /**
   * Get lead by ID with org isolation
   */
  async getLeadById(leadId: string, organizationId: string): Promise<Lead> {
    const result = await query(
      'SELECT * FROM leads WHERE id = $1 AND organization_id = $2',
      [leadId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Lead', leadId);
    }

    return result.rows[0];
  }

  /**
   * Get all leads for organization with filters and pagination
   */
  async getOrganizationLeads(
    organizationId: string,
    filters?: {
      status?: string;
      source?: string;
      search?: string;
    },
    limit = 50,
    offset = 0
  ): Promise<{ leads: Lead[]; total: number }> {
    let whereClause = 'WHERE organization_id = $1';
    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (filters?.status) {
      whereClause += ` AND status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters?.source) {
      whereClause += ` AND source = $${paramIndex++}`;
      params.push(filters.source);
    }

    if (filters?.search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as count FROM leads ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    params.push(limit);
    params.push(offset);

    const result = await query(
      `SELECT * FROM leads ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      params
    );

    return {
      leads: result.rows,
      total,
    };
  }

  /**
   * Update lead status (new → contacted → qualified → rejected)
   */
  async updateLeadStatus(
    leadId: string,
    organizationId: string,
    newStatus: string,
    notes?: string
  ): Promise<Lead> {
    if (!Object.values(LEAD_STATUSES).includes(newStatus as any)) {
      throw new ValidationError('Invalid lead status', { status: [`Invalid status: ${newStatus}`] });
    }

    const current = await this.getLeadById(leadId, organizationId);

    const result = await query(
      `UPDATE leads
       SET status = $1, last_contacted_at = CURRENT_TIMESTAMP, notes = COALESCE($2, notes), updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND organization_id = $4
       RETURNING *`,
      [newStatus, notes || null, leadId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Lead', leadId);
    }

    // Audit log
    await query(
      `INSERT INTO audit_events
       (organization_id, operation, resource_type, resource_id, changes, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        organizationId,
        'UPDATE',
        'lead',
        leadId,
        JSON.stringify({ statusChanged: { from: current.status, to: newStatus } }),
        'success',
      ]
    );

    return result.rows[0];
  }

  /**
   * Attach opportunity to lead
   */
  async attachOpportunity(
    leadId: string,
    organizationId: string,
    opportunityId: string
  ): Promise<Lead> {
    const result = await query(
      `UPDATE leads
       SET opportunity_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND organization_id = $3
       RETURNING *`,
      [opportunityId, leadId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Lead', leadId);
    }

    return result.rows[0];
  }

  /**
   * Search leads by name or email
   */
  async searchLeads(
    organizationId: string,
    query_text: string,
    limit = 20
  ): Promise<Lead[]> {
    const result = await query(
      `SELECT * FROM leads
       WHERE organization_id = $1 AND (name ILIKE $2 OR email ILIKE $2)
       ORDER BY created_at DESC
       LIMIT $3`,
      [organizationId, `%${query_text}%`, limit]
    );

    return result.rows;
  }

  /**
   * Get lead statistics for organization
   */
  async getLeadStats(organizationId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
  }> {
    const result = await query(
      `SELECT status, COUNT(*) as count FROM leads WHERE organization_id = $1 GROUP BY status`,
      [organizationId]
    );

    const byStatus: Record<string, number> = {};
    result.rows.forEach((row: any) => {
      byStatus[row.status] = parseInt(row.count, 10);
    });

    const sourceResult = await query(
      `SELECT source, COUNT(*) as count FROM leads WHERE organization_id = $1 GROUP BY source`,
      [organizationId]
    );

    const bySource: Record<string, number> = {};
    sourceResult.rows.forEach((row: any) => {
      bySource[row.source] = parseInt(row.count, 10);
    });

    const totalResult = await query(
      'SELECT COUNT(*) as count FROM leads WHERE organization_id = $1',
      [organizationId]
    );

    return {
      total: parseInt(totalResult.rows[0].count, 10),
      byStatus,
      bySource,
    };
  }
}

export const leadService = new LeadService();
