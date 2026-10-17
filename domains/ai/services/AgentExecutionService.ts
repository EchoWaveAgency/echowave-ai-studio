import { db } from '../../../platform/database/db';
import { ValidationError, NotFoundError } from '../../../platform/errors/errors';
import { AgentExecution, AgentExecutionCreateInput } from '../models/index';
import { aiAgentService } from './AIAgentService';

export class AgentExecutionService {
  async executeAgent(
    organizationId: string,
    input: AgentExecutionCreateInput,
    userId: string
  ): Promise<AgentExecution> {
    if (!input.agentId) {
      throw new ValidationError('Agent ID is required', { agentId: 'Required' });
    }
    if (!input.input || !input.input.trim()) {
      throw new ValidationError('Input is required', { input: 'Required' });
    }

    const agent = await aiAgentService.getAgentById(input.agentId, organizationId);

    if (agent.status !== 'active') {
      throw new ValidationError('Agent is not active', { agentId: 'Inactive' });
    }

    const executionId = crypto.randomUUID();
    const approvalRequired = agent.requiresApproval;
    const initialStatus = approvalRequired ? 'pending' : 'running';

    const result = await db.query(
      `
      INSERT INTO agent_executions (
        id, organization_id, agent_id, context, input, status, approval_required,
        executed_by, executed_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), NOW())
      RETURNING *
      `,
      [
        executionId,
        organizationId,
        input.agentId,
        JSON.stringify(input.context || {}),
        input.input,
        initialStatus,
        approvalRequired,
        userId,
      ]
    );

    return this.mapToExecution(result.rows[0]);
  }

  async getExecutionById(executionId: string, organizationId: string): Promise<AgentExecution> {
    const result = await db.query(
      `SELECT * FROM agent_executions WHERE id = $1 AND organization_id = $2`,
      [executionId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Execution not found');
    }

    return this.mapToExecution(result.rows[0]);
  }

  async getAgentExecutions(
    agentId: string,
    organizationId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<{ items: AgentExecution[]; total: number }> {
    const totalResult = await db.query(
      `SELECT COUNT(*) as count FROM agent_executions WHERE agent_id = $1 AND organization_id = $2`,
      [agentId, organizationId]
    );
    const total = totalResult.rows[0].count;

    const result = await db.query(
      `
      SELECT * FROM agent_executions
      WHERE agent_id = $1 AND organization_id = $2
      ORDER BY executed_at DESC
      LIMIT $3 OFFSET $4
      `,
      [agentId, organizationId, limit, offset]
    );

    return {
      items: result.rows.map((row) => this.mapToExecution(row)),
      total,
    };
  }

  async approveExecution(
    executionId: string,
    organizationId: string,
    userId: string
  ): Promise<AgentExecution> {
    const execution = await this.getExecutionById(executionId, organizationId);

    if (execution.status !== 'pending') {
      throw new ValidationError('Only pending executions can be approved', {
        status: 'Not pending',
      });
    }

    const result = await db.query(
      `
      UPDATE agent_executions
      SET status = 'approved', approved_by = $3, approved_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
      `,
      [executionId, organizationId, userId]
    );

    return this.mapToExecution(result.rows[0]);
  }

  async rejectExecution(
    executionId: string,
    organizationId: string,
    reason: string,
    userId: string
  ): Promise<AgentExecution> {
    const execution = await this.getExecutionById(executionId, organizationId);

    if (execution.status !== 'pending') {
      throw new ValidationError('Only pending executions can be rejected', {
        status: 'Not pending',
      });
    }

    const result = await db.query(
      `
      UPDATE agent_executions
      SET status = 'rejected', error_message = $4, approved_by = $3, approved_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
      `,
      [executionId, organizationId, userId, reason || 'Rejected by approver']
    );

    return this.mapToExecution(result.rows[0]);
  }

  async completeExecution(
    executionId: string,
    organizationId: string,
    result: Record<string, any>
  ): Promise<AgentExecution> {
    const execution = await this.getExecutionById(executionId, organizationId);

    if (!['running', 'approved'].includes(execution.status)) {
      throw new ValidationError('Execution is not in progress', { status: 'Not running' });
    }

    const updated = await db.query(
      `
      UPDATE agent_executions
      SET status = 'completed', result = $3, completed_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
      `,
      [executionId, organizationId, JSON.stringify(result)]
    );

    return this.mapToExecution(updated.rows[0]);
  }

  async failExecution(
    executionId: string,
    organizationId: string,
    errorMessage: string
  ): Promise<AgentExecution> {
    const execution = await this.getExecutionById(executionId, organizationId);

    if (!['running', 'approved'].includes(execution.status)) {
      throw new ValidationError('Execution is not in progress', { status: 'Not running' });
    }

    const updated = await db.query(
      `
      UPDATE agent_executions
      SET status = 'failed', error_message = $3, completed_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
      `,
      [executionId, organizationId, errorMessage]
    );

    return this.mapToExecution(updated.rows[0]);
  }

  async getPendingExecutions(organizationId: string): Promise<AgentExecution[]> {
    const result = await db.query(
      `
      SELECT * FROM agent_executions
      WHERE organization_id = $1 AND status = 'pending'
      ORDER BY executed_at ASC
      `,
      [organizationId]
    );

    return result.rows.map((row) => this.mapToExecution(row));
  }

  private mapToExecution(row: any): AgentExecution {
    return {
      id: row.id,
      organizationId: row.organization_id,
      agentId: row.agent_id,
      context: JSON.parse(row.context || '{}'),
      input: row.input,
      status: row.status,
      result: row.result ? JSON.parse(row.result) : undefined,
      errorMessage: row.error_message,
      approvalRequired: row.approval_required,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      executedBy: row.executed_by,
      executedAt: row.executed_at,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const agentExecutionService = new AgentExecutionService();
