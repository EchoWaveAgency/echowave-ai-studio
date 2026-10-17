import { db } from '../../../platform/database/db';
import { ValidationError, NotFoundError } from '../../../platform/errors/errors';
import { Workflow, WorkflowCreateInput, WorkflowExecution, WorkflowExecutionCreateInput } from '../models/index';

export class WorkflowService {
  async createWorkflow(
    organizationId: string,
    input: WorkflowCreateInput,
    userId: string
  ): Promise<Workflow> {
    if (!input.name || !input.name.trim()) {
      throw new ValidationError('Workflow name is required', { name: 'Required' });
    }
    if (!input.trigger || !['manual', 'event', 'schedule', 'webhook'].includes(input.trigger)) {
      throw new ValidationError('Invalid trigger type', { trigger: 'Invalid value' });
    }
    if (!input.steps || input.steps.length === 0) {
      throw new ValidationError('At least one step is required', { steps: 'Minimum 1 required' });
    }

    for (let i = 0; i < input.steps.length; i++) {
      const step = input.steps[i];
      if (!step.name || !step.name.trim()) {
        throw new ValidationError(`Step ${i + 1} name is required`, { steps: 'Invalid step' });
      }
      if (!step.action || !step.action.trim()) {
        throw new ValidationError(`Step ${i + 1} action is required`, { steps: 'Invalid step' });
      }
    }

    const workflowId = crypto.randomUUID();

    const result = await db.query(
      `
      INSERT INTO workflows (
        id, organization_id, name, description, trigger, status, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, 'draft', $6, NOW(), NOW())
      RETURNING *
      `,
      [workflowId, organizationId, input.name, input.description || null, input.trigger, userId]
    );

    const workflow = this.mapToWorkflow(result.rows[0]);

    for (let i = 0; i < input.steps.length; i++) {
      const step = input.steps[i];
      const stepId = crypto.randomUUID();
      await db.query(
        `
        INSERT INTO workflow_steps (
          id, workflow_id, step_number, name, action, parameters, condition, on_success, on_failure, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        `,
        [
          stepId,
          workflowId,
          i + 1,
          step.name,
          step.action,
          JSON.stringify(step.parameters || {}),
          step.condition || null,
          step.onSuccess || null,
          step.onFailure || null,
        ]
      );
    }

    return workflow;
  }

  async getWorkflowById(workflowId: string, organizationId: string): Promise<Workflow> {
    const result = await db.query(
      `SELECT * FROM workflows WHERE id = $1 AND organization_id = $2`,
      [workflowId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Workflow not found');
    }

    return this.mapToWorkflow(result.rows[0]);
  }

  async getOrganizationWorkflows(
    organizationId: string,
    filters: {
      status?: string;
      trigger?: string;
    } = {}
  ): Promise<Workflow[]> {
    let query = `SELECT * FROM workflows WHERE organization_id = $1`;
    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }
    if (filters.trigger) {
      query += ` AND trigger = $${paramIndex}`;
      params.push(filters.trigger);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await db.query(query, params);
    return result.rows.map((row) => this.mapToWorkflow(row));
  }

  async updateWorkflowStatus(workflowId: string, organizationId: string, status: string): Promise<Workflow> {
    if (!['draft', 'active', 'paused', 'archived'].includes(status)) {
      throw new ValidationError('Invalid status', { status: 'Invalid value' });
    }

    const result = await db.query(
      `
      UPDATE workflows
      SET status = $3, updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
      `,
      [workflowId, organizationId, status]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Workflow not found');
    }

    return this.mapToWorkflow(result.rows[0]);
  }

  async executeWorkflow(
    workflowId: string,
    organizationId: string,
    input: WorkflowExecutionCreateInput,
    userId: string
  ): Promise<WorkflowExecution> {
    const workflow = await this.getWorkflowById(workflowId, organizationId);

    if (workflow.status !== 'active') {
      throw new ValidationError('Workflow is not active', { workflowId: 'Inactive' });
    }

    const executionId = crypto.randomUUID();

    const result = await db.query(
      `
      INSERT INTO workflow_executions (
        id, organization_id, workflow_id, context, status, triggered_by, triggered_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, 'running', $5, NOW(), NOW(), NOW())
      RETURNING *
      `,
      [executionId, organizationId, workflowId, JSON.stringify(input.context || {}), userId]
    );

    return this.mapToExecution(result.rows[0]);
  }

  async getExecutionById(executionId: string, organizationId: string): Promise<WorkflowExecution> {
    const result = await db.query(
      `SELECT * FROM workflow_executions WHERE id = $1 AND organization_id = $2`,
      [executionId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Workflow execution not found');
    }

    return this.mapToExecution(result.rows[0]);
  }

  async getWorkflowExecutions(
    workflowId: string,
    organizationId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<{ items: WorkflowExecution[]; total: number }> {
    const totalResult = await db.query(
      `SELECT COUNT(*) as count FROM workflow_executions WHERE workflow_id = $1 AND organization_id = $2`,
      [workflowId, organizationId]
    );
    const total = totalResult.rows[0].count;

    const result = await db.query(
      `
      SELECT * FROM workflow_executions
      WHERE workflow_id = $1 AND organization_id = $2
      ORDER BY triggered_at DESC
      LIMIT $3 OFFSET $4
      `,
      [workflowId, organizationId, limit, offset]
    );

    return {
      items: result.rows.map((row) => this.mapToExecution(row)),
      total,
    };
  }

  async completeWorkflowExecution(
    executionId: string,
    organizationId: string,
    stepResults: Array<{
      stepId: string;
      status: 'pending' | 'completed' | 'failed';
      result?: Record<string, any>;
      error?: string;
    }>
  ): Promise<WorkflowExecution> {
    const execution = await this.getExecutionById(executionId, organizationId);

    if (execution.status !== 'running') {
      throw new ValidationError('Execution is not running', { status: 'Not running' });
    }

    const updated = await db.query(
      `
      UPDATE workflow_executions
      SET status = 'completed', step_results = $3, completed_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
      `,
      [executionId, organizationId, JSON.stringify(stepResults)]
    );

    return this.mapToExecution(updated.rows[0]);
  }

  async failWorkflowExecution(
    executionId: string,
    organizationId: string,
    errorMessage: string
  ): Promise<WorkflowExecution> {
    const execution = await this.getExecutionById(executionId, organizationId);

    if (execution.status !== 'running') {
      throw new ValidationError('Execution is not running', { status: 'Not running' });
    }

    const updated = await db.query(
      `
      UPDATE workflow_executions
      SET status = 'failed', error_message = $3, completed_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
      `,
      [executionId, organizationId, errorMessage]
    );

    return this.mapToExecution(updated.rows[0]);
  }

  private mapToWorkflow(row: any): Workflow {
    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      description: row.description,
      trigger: row.trigger,
      steps: [],
      status: row.status,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapToExecution(row: any): WorkflowExecution {
    return {
      id: row.id,
      organizationId: row.organization_id,
      workflowId: row.workflow_id,
      context: JSON.parse(row.context || '{}'),
      status: row.status,
      currentStep: row.current_step,
      stepResults: row.step_results ? JSON.parse(row.step_results) : [],
      errorMessage: row.error_message,
      triggeredBy: row.triggered_by,
      triggeredAt: row.triggered_at,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const workflowService = new WorkflowService();
