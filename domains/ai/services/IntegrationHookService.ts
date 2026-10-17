import { db } from '../../../platform/database/db';
import { ValidationError, NotFoundError } from '../../../platform/errors/errors';
import { IntegrationHook, IntegrationHookCreateInput } from '../models/index';

export class IntegrationHookService {
  async createHook(
    organizationId: string,
    input: IntegrationHookCreateInput,
    userId: string
  ): Promise<IntegrationHook> {
    if (!input.name || !input.name.trim()) {
      throw new ValidationError('Hook name is required', { name: 'Required' });
    }
    if (!input.eventType || !input.eventType.trim()) {
      throw new ValidationError('Event type is required', { eventType: 'Required' });
    }
    if (!input.service || !['crm', 'sales', 'delivery', 'finance', 'communications', 'external'].includes(input.service)) {
      throw new ValidationError('Invalid service', { service: 'Invalid value' });
    }
    if (!input.action || !input.action.trim()) {
      throw new ValidationError('Action is required', { action: 'Required' });
    }
    if (!input.targetAgentId && !input.targetWorkflowId) {
      throw new ValidationError('Either targetAgentId or targetWorkflowId is required', {
        targetAgentId: 'Required if no workflow',
        targetWorkflowId: 'Required if no agent',
      });
    }

    const hookId = crypto.randomUUID();

    const result = await db.query(
      `
      INSERT INTO integration_hooks (
        id, organization_id, name, description, event_type, service, action,
        target_agent_id, target_workflow_id, status, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', $10, NOW(), NOW())
      RETURNING *
      `,
      [
        hookId,
        organizationId,
        input.name,
        input.description || null,
        input.eventType,
        input.service,
        input.action,
        input.targetAgentId || null,
        input.targetWorkflowId || null,
        userId,
      ]
    );

    return this.mapToHook(result.rows[0]);
  }

  async getHookById(hookId: string, organizationId: string): Promise<IntegrationHook> {
    const result = await db.query(
      `SELECT * FROM integration_hooks WHERE id = $1 AND organization_id = $2`,
      [hookId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Integration hook not found');
    }

    return this.mapToHook(result.rows[0]);
  }

  async getOrganizationHooks(
    organizationId: string,
    filters: {
      service?: string;
      status?: string;
      eventType?: string;
    } = {}
  ): Promise<IntegrationHook[]> {
    let query = `SELECT * FROM integration_hooks WHERE organization_id = $1`;
    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (filters.service) {
      query += ` AND service = $${paramIndex}`;
      params.push(filters.service);
      paramIndex++;
    }
    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }
    if (filters.eventType) {
      query += ` AND event_type = $${paramIndex}`;
      params.push(filters.eventType);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await db.query(query, params);
    return result.rows.map((row) => this.mapToHook(row));
  }

  async getHooksByEventAndService(
    organizationId: string,
    eventType: string,
    service: string
  ): Promise<IntegrationHook[]> {
    const result = await db.query(
      `
      SELECT * FROM integration_hooks
      WHERE organization_id = $1 AND event_type = $2 AND service = $3 AND status = 'active'
      `,
      [organizationId, eventType, service]
    );

    return result.rows.map((row) => this.mapToHook(row));
  }

  async updateHookStatus(hookId: string, organizationId: string, status: string): Promise<IntegrationHook> {
    if (!['active', 'inactive'].includes(status)) {
      throw new ValidationError('Invalid status', { status: 'Invalid value' });
    }

    const result = await db.query(
      `
      UPDATE integration_hooks
      SET status = $3, updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
      `,
      [hookId, organizationId, status]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Integration hook not found');
    }

    return this.mapToHook(result.rows[0]);
  }

  async triggerHook(
    hookId: string,
    organizationId: string,
    eventData: Record<string, any>
  ): Promise<{ hookId: string; triggered: boolean; message: string }> {
    const hook = await this.getHookById(hookId, organizationId);

    if (hook.status !== 'active') {
      return {
        hookId,
        triggered: false,
        message: 'Hook is not active',
      };
    }

    if (hook.targetAgentId) {
      return {
        hookId,
        triggered: true,
        message: `Triggered agent ${hook.targetAgentId} via hook ${hook.name}`,
      };
    }

    if (hook.targetWorkflowId) {
      return {
        hookId,
        triggered: true,
        message: `Triggered workflow ${hook.targetWorkflowId} via hook ${hook.name}`,
      };
    }

    return {
      hookId,
      triggered: false,
      message: 'No target agent or workflow configured',
    };
  }

  private mapToHook(row: any): IntegrationHook {
    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      description: row.description,
      eventType: row.event_type,
      service: row.service,
      action: row.action,
      targetAgentId: row.target_agent_id,
      targetWorkflowId: row.target_workflow_id,
      status: row.status,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const integrationHookService = new IntegrationHookService();
