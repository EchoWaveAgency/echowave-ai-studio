import { db } from '../../../platform/database/db';
import { ValidationError, NotFoundError } from '../../../platform/errors/errors';
import {
  Project,
  ProjectCreateInput,
  ProjectUpdateInput,
  ProjectPhase,
  PROJECT_STATUSES,
} from '../models/index';
import { validateUUID, validateNotEmpty } from '../../../platform/validation/validators';

export class ProjectService {
  async createProject(
    organizationId: string,
    input: ProjectCreateInput,
    userId: string
  ): Promise<Project> {
    if (!input.name || !input.name.trim()) {
      throw new ValidationError('Project name is required', { name: 'Required' });
    }
    if (!input.description || !input.description.trim()) {
      throw new ValidationError('Project description is required', {
        description: 'Required',
      });
    }
    if (!input.startDate) {
      throw new ValidationError('Start date is required', { startDate: 'Required' });
    }
    if (!input.targetEndDate) {
      throw new ValidationError('Target end date is required', {
        targetEndDate: 'Required',
      });
    }
    if (input.startDate > input.targetEndDate) {
      throw new ValidationError('Start date must be before target end date', {
        startDate: 'Invalid range',
      });
    }
    if (!validateUUID(input.clientId)) {
      throw new ValidationError('Invalid client ID', { clientId: 'Invalid UUID' });
    }
    if (input.budget && input.budget < 0) {
      throw new ValidationError('Budget must be non-negative', { budget: 'Invalid' });
    }

    const project = await db.query(
      `
      INSERT INTO projects (
        id, organization_id, client_id, contract_id, name, description,
        start_date, target_end_date, budget, status, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *
      `,
      [
        crypto.randomUUID(),
        organizationId,
        input.clientId,
        input.contractId || null,
        input.name,
        input.description,
        input.startDate,
        input.targetEndDate,
        input.budget || null,
        'planning',
        userId,
      ]
    );

    return this.mapToProject(project.rows[0]);
  }

  async getProjectById(projectId: string, organizationId: string): Promise<Project> {
    if (!validateUUID(projectId)) {
      throw new ValidationError('Invalid project ID', { projectId: 'Invalid UUID' });
    }

    const result = await db.query(
      `SELECT * FROM projects WHERE id = $1 AND organization_id = $2`,
      [projectId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Project not found');
    }

    return this.mapToProject(result.rows[0]);
  }

  async getOrganizationProjects(
    organizationId: string,
    filters?: { clientId?: string; status?: string },
    limit: number = 50,
    offset: number = 0
  ): Promise<{ items: Project[]; total: number }> {
    let whereConditions = ['organization_id = $1'];
    let paramIndex = 2;
    const params: any[] = [organizationId];

    if (filters?.clientId) {
      whereConditions.push(`client_id = $${paramIndex}`);
      params.push(filters.clientId);
      paramIndex++;
    }
    if (filters?.status) {
      whereConditions.push(`status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    const totalResult = await db.query(
      `SELECT COUNT(*) as count FROM projects WHERE ${whereConditions.join(' AND ')}`,
      params
    );
    const total = totalResult.rows[0].count;

    const result = await db.query(
      `
      SELECT * FROM projects
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `,
      [...params, limit, offset]
    );

    return {
      items: result.rows.map((row) => this.mapToProject(row)),
      total,
    };
  }

  async updateProject(
    projectId: string,
    organizationId: string,
    input: ProjectUpdateInput,
    userId: string
  ): Promise<Project> {
    const project = await this.getProjectById(projectId, organizationId);

    if (input.name && !input.name.trim()) {
      throw new ValidationError('Project name cannot be empty', { name: 'Required' });
    }
    if (
      input.startDate &&
      input.targetEndDate &&
      input.startDate > input.targetEndDate
    ) {
      throw new ValidationError('Start date must be before target end date', {
        startDate: 'Invalid range',
      });
    }
    if (input.budget && input.budget < 0) {
      throw new ValidationError('Budget must be non-negative', { budget: 'Invalid' });
    }

    const updateFields: string[] = [];
    const updateParams: any[] = [projectId, organizationId];
    let paramIndex = 3;

    if (input.name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      updateParams.push(input.name);
      paramIndex++;
    }
    if (input.description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      updateParams.push(input.description);
      paramIndex++;
    }
    if (input.startDate !== undefined) {
      updateFields.push(`start_date = $${paramIndex}`);
      updateParams.push(input.startDate);
      paramIndex++;
    }
    if (input.targetEndDate !== undefined) {
      updateFields.push(`target_end_date = $${paramIndex}`);
      updateParams.push(input.targetEndDate);
      paramIndex++;
    }
    if (input.budget !== undefined) {
      updateFields.push(`budget = $${paramIndex}`);
      updateParams.push(input.budget);
      paramIndex++;
    }
    if (input.status !== undefined) {
      updateFields.push(`status = $${paramIndex}`);
      updateParams.push(input.status);
      paramIndex++;
    }
    if (input.actualEndDate !== undefined) {
      updateFields.push(`actual_end_date = $${paramIndex}`);
      updateParams.push(input.actualEndDate);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return project;
    }

    updateFields.push(`updated_at = NOW()`);

    const result = await db.query(
      `
      UPDATE projects
      SET ${updateFields.join(', ')}
      WHERE id = $1 AND organization_id = $2
      RETURNING *
      `,
      updateParams
    );

    return this.mapToProject(result.rows[0]);
  }

  async getProjectPhases(
    projectId: string,
    organizationId: string
  ): Promise<ProjectPhase[]> {
    await this.getProjectById(projectId, organizationId);

    const result = await db.query(
      `
      SELECT * FROM project_phases
      WHERE project_id = $1
      ORDER BY sequence_order ASC
      `,
      [projectId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      projectId: row.project_id,
      name: row.name,
      sequenceOrder: row.sequence_order,
      startDate: row.start_date,
      targetEndDate: row.target_end_date,
      actualEndDate: row.actual_end_date,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async createPhase(
    projectId: string,
    organizationId: string,
    phaseData: { name: string; sequenceOrder: number; startDate: string; targetEndDate: string }
  ): Promise<ProjectPhase> {
    await this.getProjectById(projectId, organizationId);

    const phase = await db.query(
      `
      INSERT INTO project_phases (
        id, project_id, name, sequence_order, start_date, target_end_date, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW(), NOW())
      RETURNING *
      `,
      [
        crypto.randomUUID(),
        projectId,
        phaseData.name,
        phaseData.sequenceOrder,
        phaseData.startDate,
        phaseData.targetEndDate,
      ]
    );

    return {
      id: phase.rows[0].id,
      projectId: phase.rows[0].project_id,
      name: phase.rows[0].name,
      sequenceOrder: phase.rows[0].sequence_order,
      startDate: phase.rows[0].start_date,
      targetEndDate: phase.rows[0].target_end_date,
      actualEndDate: phase.rows[0].actual_end_date,
      status: phase.rows[0].status,
      createdAt: phase.rows[0].created_at,
      updatedAt: phase.rows[0].updated_at,
    };
  }

  private mapToProject(row: any): Project {
    return {
      id: row.id,
      organizationId: row.organization_id,
      clientId: row.client_id,
      contractId: row.contract_id,
      name: row.name,
      description: row.description,
      startDate: row.start_date,
      targetEndDate: row.target_end_date,
      actualEndDate: row.actual_end_date,
      budget: row.budget ? parseFloat(row.budget) : undefined,
      status: row.status,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const projectService = new ProjectService();
