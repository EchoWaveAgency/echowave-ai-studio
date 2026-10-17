import { db } from '../../../platform/database/db';
import { ValidationError, NotFoundError } from '../../../platform/errors/errors';
import {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TaskDependency,
  TaskDependencyCreateInput,
  TASK_STATUSES,
  TASK_PRIORITIES,
} from '../models/index';
import { validateUUID } from '../../../platform/validation/validators';

export class TaskService {
  async createTask(
    organizationId: string,
    input: TaskCreateInput,
    userId: string
  ): Promise<Task> {
    if (!input.title || !input.title.trim()) {
      throw new ValidationError('Task title is required', { title: 'Required' });
    }
    if (!input.description || !input.description.trim()) {
      throw new ValidationError('Task description is required', {
        description: 'Required',
      });
    }
    if (!TASK_PRIORITIES.includes(input.priority)) {
      throw new ValidationError('Invalid priority', { priority: 'Invalid value' });
    }
    if (!validateUUID(input.projectId)) {
      throw new ValidationError('Invalid project ID', { projectId: 'Invalid UUID' });
    }
    if (input.estimatedHours && input.estimatedHours < 0) {
      throw new ValidationError('Estimated hours must be non-negative', {
        estimatedHours: 'Invalid',
      });
    }

    const task = await db.query(
      `
      INSERT INTO tasks (
        id, organization_id, project_id, phase_id, title, description,
        priority, status, due_date, estimated_hours, assigned_to, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *
      `,
      [
        crypto.randomUUID(),
        organizationId,
        input.projectId,
        input.phaseId || null,
        input.title,
        input.description,
        input.priority,
        'todo',
        input.dueDate || null,
        input.estimatedHours || null,
        input.assignedTo || null,
        userId,
      ]
    );

    return this.mapToTask(task.rows[0]);
  }

  async getTaskById(taskId: string, organizationId: string): Promise<Task> {
    if (!validateUUID(taskId)) {
      throw new ValidationError('Invalid task ID', { taskId: 'Invalid UUID' });
    }

    const result = await db.query(
      `SELECT * FROM tasks WHERE id = $1 AND organization_id = $2`,
      [taskId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Task not found');
    }

    return this.mapToTask(result.rows[0]);
  }

  async getProjectTasks(
    projectId: string,
    organizationId: string,
    filters?: { status?: string; priority?: string; assignedTo?: string },
    limit: number = 50,
    offset: number = 0
  ): Promise<{ items: Task[]; total: number }> {
    let whereConditions = ['project_id = $1 AND organization_id = $2'];
    let paramIndex = 3;
    const params: any[] = [projectId, organizationId];

    if (filters?.status) {
      whereConditions.push(`status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }
    if (filters?.priority) {
      whereConditions.push(`priority = $${paramIndex}`);
      params.push(filters.priority);
      paramIndex++;
    }
    if (filters?.assignedTo) {
      whereConditions.push(`assigned_to = $${paramIndex}`);
      params.push(filters.assignedTo);
      paramIndex++;
    }

    const totalResult = await db.query(
      `SELECT COUNT(*) as count FROM tasks WHERE ${whereConditions.join(' AND ')}`,
      params
    );
    const total = totalResult.rows[0].count;

    const result = await db.query(
      `
      SELECT * FROM tasks
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY priority DESC, due_date ASC, created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `,
      [...params, limit, offset]
    );

    return {
      items: result.rows.map((row) => this.mapToTask(row)),
      total,
    };
  }

  async updateTask(
    taskId: string,
    organizationId: string,
    input: TaskUpdateInput,
    userId: string
  ): Promise<Task> {
    const task = await this.getTaskById(taskId, organizationId);

    if (input.title && !input.title.trim()) {
      throw new ValidationError('Task title cannot be empty', { title: 'Required' });
    }
    if (input.priority && !TASK_PRIORITIES.includes(input.priority)) {
      throw new ValidationError('Invalid priority', { priority: 'Invalid value' });
    }
    if (input.status && !TASK_STATUSES.includes(input.status)) {
      throw new ValidationError('Invalid status', { status: 'Invalid value' });
    }
    if (input.estimatedHours && input.estimatedHours < 0) {
      throw new ValidationError('Estimated hours must be non-negative', {
        estimatedHours: 'Invalid',
      });
    }

    const updateFields: string[] = [];
    const updateParams: any[] = [taskId, organizationId];
    let paramIndex = 3;

    if (input.title !== undefined) {
      updateFields.push(`title = $${paramIndex}`);
      updateParams.push(input.title);
      paramIndex++;
    }
    if (input.description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      updateParams.push(input.description);
      paramIndex++;
    }
    if (input.priority !== undefined) {
      updateFields.push(`priority = $${paramIndex}`);
      updateParams.push(input.priority);
      paramIndex++;
    }
    if (input.status !== undefined) {
      updateFields.push(`status = $${paramIndex}`);
      updateParams.push(input.status);
      paramIndex++;
    }
    if (input.dueDate !== undefined) {
      updateFields.push(`due_date = $${paramIndex}`);
      updateParams.push(input.dueDate);
      paramIndex++;
    }
    if (input.estimatedHours !== undefined) {
      updateFields.push(`estimated_hours = $${paramIndex}`);
      updateParams.push(input.estimatedHours);
      paramIndex++;
    }
    if (input.assignedTo !== undefined) {
      updateFields.push(`assigned_to = $${paramIndex}`);
      updateParams.push(input.assignedTo || null);
      paramIndex++;
    }
    if (input.phaseId !== undefined) {
      updateFields.push(`phase_id = $${paramIndex}`);
      updateParams.push(input.phaseId || null);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return task;
    }

    updateFields.push(`updated_at = NOW()`);

    const result = await db.query(
      `
      UPDATE tasks
      SET ${updateFields.join(', ')}
      WHERE id = $1 AND organization_id = $2
      RETURNING *
      `,
      updateParams
    );

    return this.mapToTask(result.rows[0]);
  }

  async addDependency(
    taskId: string,
    organizationId: string,
    input: TaskDependencyCreateInput
  ): Promise<TaskDependency> {
    await this.getTaskById(taskId, organizationId);
    await this.getTaskById(input.dependsOnTaskId, organizationId);

    const dependency = await db.query(
      `
      INSERT INTO task_dependencies (id, task_id, depends_on_task_id, blocking, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
      `,
      [crypto.randomUUID(), taskId, input.dependsOnTaskId, input.blocking]
    );

    return {
      id: dependency.rows[0].id,
      taskId: dependency.rows[0].task_id,
      dependsOnTaskId: dependency.rows[0].depends_on_task_id,
      blocking: dependency.rows[0].blocking,
      createdAt: dependency.rows[0].created_at,
    };
  }

  async getTaskDependencies(taskId: string): Promise<TaskDependency[]> {
    const result = await db.query(
      `SELECT * FROM task_dependencies WHERE task_id = $1`,
      [taskId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      taskId: row.task_id,
      dependsOnTaskId: row.depends_on_task_id,
      blocking: row.blocking,
      createdAt: row.created_at,
    }));
  }

  private mapToTask(row: any): Task {
    return {
      id: row.id,
      organizationId: row.organization_id,
      projectId: row.project_id,
      phaseId: row.phase_id,
      title: row.title,
      description: row.description,
      assignedTo: row.assigned_to,
      priority: row.priority,
      status: row.status,
      dueDate: row.due_date,
      estimatedHours: row.estimated_hours ? parseFloat(row.estimated_hours) : undefined,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const taskService = new TaskService();
