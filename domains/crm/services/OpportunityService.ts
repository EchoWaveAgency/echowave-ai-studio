// Opportunity Service — CRM Domain
// Manages sales opportunities, pipeline, and revenue tracking

import { query, transaction } from '../../../platform/database/connection';
import { Opportunity, OpportunityCreateInput, OPPORTUNITY_STAGES } from '../models';
import { NotFoundError, ValidationError } from '../../../platform/errors/errors';
import { defaultLogger } from '../../../platform/logging/logger';

export class OpportunityService {
  /**
   * Create a new opportunity for a lead
   */
  async createOpportunity(organizationId: string, input: OpportunityCreateInput): Promise<Opportunity> {
    if (!input.leadId || input.leadId.trim().length === 0) {
      throw new ValidationError('Lead ID is required', { leadId: ['Lead ID cannot be empty'] });
    }

    if (!input.title || input.title.trim().length === 0) {
      throw new ValidationError('Opportunity title is required', { title: ['Title cannot be empty'] });
    }

    if (!Object.values(OPPORTUNITY_STAGES).includes(input.stage as any)) {
      throw new ValidationError('Invalid opportunity stage', { stage: [`Invalid stage: ${input.stage}`] });
    }

    const opportunity = await transaction(async (client) => {
      const result = await client.query(
        `INSERT INTO opportunities
         (organization_id, lead_id, title, description, value, currency, stage, expected_close_date, probability, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          organizationId,
          input.leadId,
          input.title,
          input.description || null,
          input.value || null,
          input.currency || 'EGP',
          input.stage || 'prospect',
          input.expectedCloseDate || null,
          input.probability || 0,
          input.notes || null,
        ]
      );

      const opportunity = result.rows[0];

      // Audit log
      await client.query(
        `INSERT INTO audit_events
         (organization_id, operation, resource_type, resource_id, changes, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          organizationId,
          'CREATE',
          'opportunity',
          opportunity.id,
          JSON.stringify({ title: input.title, leadId: input.leadId, value: input.value }),
          'success',
        ]
      );

      return opportunity;
    });

    defaultLogger.info(`Opportunity created: ${opportunity.id}`, {
      organizationId,
      title: input.title,
      leadId: input.leadId,
      value: input.value,
    });

    return opportunity;
  }

  /**
   * Get opportunity by ID with org isolation
   */
  async getOpportunityById(opportunityId: string, organizationId: string): Promise<Opportunity> {
    const result = await query(
      'SELECT * FROM opportunities WHERE id = $1 AND organization_id = $2',
      [opportunityId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Opportunity', opportunityId);
    }

    return result.rows[0];
  }

  /**
   * Get all opportunities for organization with filters
   */
  async getOrganizationOpportunities(
    organizationId: string,
    filters?: {
      stage?: string;
      leadId?: string;
    },
    limit = 50,
    offset = 0
  ): Promise<{ opportunities: Opportunity[]; total: number }> {
    let whereClause = 'WHERE organization_id = $1';
    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (filters?.stage) {
      whereClause += ` AND stage = $${paramIndex++}`;
      params.push(filters.stage);
    }

    if (filters?.leadId) {
      whereClause += ` AND lead_id = $${paramIndex++}`;
      params.push(filters.leadId);
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as count FROM opportunities ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    params.push(limit);
    params.push(offset);

    const result = await query(
      `SELECT * FROM opportunities ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      params
    );

    return {
      opportunities: result.rows,
      total,
    };
  }

  /**
   * Update opportunity stage with history tracking
   */
  async updateStage(
    opportunityId: string,
    organizationId: string,
    newStage: string
  ): Promise<Opportunity> {
    if (!Object.values(OPPORTUNITY_STAGES).includes(newStage as any)) {
      throw new ValidationError('Invalid opportunity stage', { stage: [`Invalid stage: ${newStage}`] });
    }

    const current = await this.getOpportunityById(opportunityId, organizationId);

    const closedDate = newStage.startsWith('closed') ? new Date() : null;

    const result = await query(
      `UPDATE opportunities
       SET stage = $1, closed_date = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND organization_id = $4
       RETURNING *`,
      [newStage, closedDate, opportunityId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Opportunity', opportunityId);
    }

    // Record in history
    await query(
      `INSERT INTO opportunity_history (opportunity_id, stage, changed_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)`,
      [opportunityId, newStage]
    );

    // Audit log
    await query(
      `INSERT INTO audit_events
       (organization_id, operation, resource_type, resource_id, changes, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        organizationId,
        'UPDATE',
        'opportunity',
        opportunityId,
        JSON.stringify({ stageChanged: { from: current.stage, to: newStage } }),
        'success',
      ]
    );

    return result.rows[0];
  }

  /**
   * Update opportunity details
   */
  async updateOpportunity(
    opportunityId: string,
    organizationId: string,
    updates: Partial<Pick<
      Opportunity,
      'title' | 'description' | 'value' | 'probability' | 'expectedCloseDate' | 'notes'
    >>
  ): Promise<Opportunity> {
    const current = await this.getOpportunityById(opportunityId, organizationId);

    const allowedFields = ['title', 'description', 'value', 'probability', 'expectedCloseDate', 'notes'];
    const updateClauses = [];
    const params = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        const colName = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updateClauses.push(`${colName} = $${paramIndex++}`);
        params.push(value);
      }
    }

    if (updateClauses.length === 0) {
      return current;
    }

    params.push(opportunityId);
    params.push(organizationId);

    const result = await query(
      `UPDATE opportunities
       SET ${updateClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex++} AND organization_id = $${paramIndex++}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Opportunity', opportunityId);
    }

    return result.rows[0];
  }

  /**
   * Get pipeline summary by stage
   */
  async getPipelineSummary(organizationId: string): Promise<{
    byStage: Record<string, { count: number; totalValue: number }>;
    totalValue: number;
    opportunityCount: number;
  }> {
    const result = await query(
      `SELECT stage, COUNT(*) as count, COALESCE(SUM(value), 0) as total_value
       FROM opportunities
       WHERE organization_id = $1
       GROUP BY stage`,
      [organizationId]
    );

    const byStage: Record<string, { count: number; totalValue: number }> = {};
    let totalValue = 0;
    let opportunityCount = 0;

    result.rows.forEach((row: any) => {
      byStage[row.stage] = {
        count: parseInt(row.count, 10),
        totalValue: parseFloat(row.total_value),
      };
      totalValue += parseFloat(row.total_value);
      opportunityCount += parseInt(row.count, 10);
    });

    return {
      byStage,
      totalValue,
      opportunityCount,
    };
  }

  /**
   * Get revenue forecast
   */
  async getRevenueForecast(organizationId: string): Promise<number> {
    const result = await query(
      `SELECT COALESCE(SUM(value * (probability / 100.0)), 0) as forecast
       FROM opportunities
       WHERE organization_id = $1 AND stage != 'closed_lost' AND stage != 'closed_won'`,
      [organizationId]
    );

    return parseFloat(result.rows[0].forecast || 0);
  }
}

export const opportunityService = new OpportunityService();
