import { db } from '../../../platform/database/db';
import { ValidationError, NotFoundError } from '../../../platform/errors/errors';
import {
  Deliverable,
  DeliverableCreateInput,
  DeliverableUpdateInput,
  FileVersion,
  FileVersionCreateInput,
  DELIVERABLE_STATUSES,
} from '../models/index';
import { validateUUID } from '../../../platform/validation/validators';

export class DeliverableService {
  async createDeliverable(
    organizationId: string,
    input: DeliverableCreateInput,
    userId: string
  ): Promise<Deliverable> {
    if (!input.name || !input.name.trim()) {
      throw new ValidationError('Deliverable name is required', { name: 'Required' });
    }
    if (!input.description || !input.description.trim()) {
      throw new ValidationError('Deliverable description is required', {
        description: 'Required',
      });
    }
    if (!input.expectedDate) {
      throw new ValidationError('Expected date is required', { expectedDate: 'Required' });
    }
    if (!validateUUID(input.projectId)) {
      throw new ValidationError('Invalid project ID', { projectId: 'Invalid UUID' });
    }
    if (!input.fileUrls || input.fileUrls.length === 0) {
      throw new ValidationError('At least one file URL is required', { fileUrls: 'Required' });
    }

    const deliverable = await db.query(
      `
      INSERT INTO deliverables (
        id, project_id, name, description, expected_date, status, file_urls, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
      `,
      [
        crypto.randomUUID(),
        input.projectId,
        input.name,
        input.description,
        input.expectedDate,
        'pending',
        JSON.stringify(input.fileUrls),
      ]
    );

    return this.mapToDeliverable(deliverable.rows[0]);
  }

  async getDeliverableById(
    deliverableId: string,
    organizationId: string
  ): Promise<Deliverable> {
    if (!validateUUID(deliverableId)) {
      throw new ValidationError('Invalid deliverable ID', { deliverableId: 'Invalid UUID' });
    }

    const result = await db.query(
      `
      SELECT d.* FROM deliverables d
      INNER JOIN projects p ON d.project_id = p.id
      WHERE d.id = $1 AND p.organization_id = $2
      `,
      [deliverableId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Deliverable not found');
    }

    return this.mapToDeliverable(result.rows[0]);
  }

  async getProjectDeliverables(
    projectId: string,
    organizationId: string,
    filters?: { status?: string },
    limit: number = 50,
    offset: number = 0
  ): Promise<{ items: Deliverable[]; total: number }> {
    let whereConditions = [
      'd.project_id = $1 AND p.organization_id = $2',
    ];
    let paramIndex = 3;
    const params: any[] = [projectId, organizationId];

    if (filters?.status) {
      whereConditions.push(`d.status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    const totalResult = await db.query(
      `
      SELECT COUNT(*) as count FROM deliverables d
      INNER JOIN projects p ON d.project_id = p.id
      WHERE ${whereConditions.join(' AND ')}
      `,
      params
    );
    const total = totalResult.rows[0].count;

    const result = await db.query(
      `
      SELECT d.* FROM deliverables d
      INNER JOIN projects p ON d.project_id = p.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY expected_date ASC, created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `,
      [...params, limit, offset]
    );

    return {
      items: result.rows.map((row) => this.mapToDeliverable(row)),
      total,
    };
  }

  async updateDeliverable(
    deliverableId: string,
    organizationId: string,
    input: DeliverableUpdateInput,
    userId: string
  ): Promise<Deliverable> {
    const deliverable = await this.getDeliverableById(deliverableId, organizationId);

    if (input.name && !input.name.trim()) {
      throw new ValidationError('Deliverable name cannot be empty', { name: 'Required' });
    }
    if (input.description && !input.description.trim()) {
      throw new ValidationError('Deliverable description cannot be empty', {
        description: 'Required',
      });
    }

    const updateFields: string[] = [];
    const updateParams: any[] = [deliverableId, organizationId];
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
    if (input.expectedDate !== undefined) {
      updateFields.push(`expected_date = $${paramIndex}`);
      updateParams.push(input.expectedDate);
      paramIndex++;
    }
    if (input.fileUrls !== undefined) {
      updateFields.push(`file_urls = $${paramIndex}`);
      updateParams.push(JSON.stringify(input.fileUrls));
      paramIndex++;
    }
    if (input.approvalNotes !== undefined) {
      updateFields.push(`approval_notes = $${paramIndex}`);
      updateParams.push(input.approvalNotes || null);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return deliverable;
    }

    updateFields.push(`updated_at = NOW()`);

    const result = await db.query(
      `
      UPDATE deliverables d
      SET ${updateFields.join(', ')}
      WHERE d.id = $1 AND EXISTS (
        SELECT 1 FROM projects p WHERE p.id = d.project_id AND p.organization_id = $2
      )
      RETURNING d.*
      `,
      updateParams
    );

    return this.mapToDeliverable(result.rows[0]);
  }

  async approveDeliverable(
    deliverableId: string,
    organizationId: string,
    notes: string,
    userId: string
  ): Promise<Deliverable> {
    const deliverable = await this.getDeliverableById(deliverableId, organizationId);

    const result = await db.query(
      `
      UPDATE deliverables d
      SET status = 'accepted', approval_notes = $3, approved_by = $4, updated_at = NOW()
      WHERE d.id = $1 AND EXISTS (
        SELECT 1 FROM projects p WHERE p.id = d.project_id AND p.organization_id = $2
      )
      RETURNING d.*
      `,
      [deliverableId, organizationId, notes, userId]
    );

    return this.mapToDeliverable(result.rows[0]);
  }

  async rejectDeliverable(
    deliverableId: string,
    organizationId: string,
    notes: string,
    userId: string
  ): Promise<Deliverable> {
    const deliverable = await this.getDeliverableById(deliverableId, organizationId);

    const result = await db.query(
      `
      UPDATE deliverables d
      SET status = 'rejected', approval_notes = $3, approved_by = $4, updated_at = NOW()
      WHERE d.id = $1 AND EXISTS (
        SELECT 1 FROM projects p WHERE p.id = d.project_id AND p.organization_id = $2
      )
      RETURNING d.*
      `,
      [deliverableId, organizationId, notes, userId]
    );

    return this.mapToDeliverable(result.rows[0]);
  }

  async createFileVersion(
    organizationId: string,
    input: FileVersionCreateInput,
    userId: string
  ): Promise<FileVersion> {
    if (!input.filename) {
      throw new ValidationError('Filename is required', { filename: 'Required' });
    }
    if (!input.fileUrl) {
      throw new ValidationError('File URL is required', { fileUrl: 'Required' });
    }
    if (input.fileSize < 0) {
      throw new ValidationError('File size must be non-negative', { fileSize: 'Invalid' });
    }

    let maxVersion = 1;
    if (input.deliverableId) {
      const versionResult = await db.query(
        `
        SELECT MAX(version_number) as max_version FROM file_versions
        WHERE deliverable_id = $1
        `,
        [input.deliverableId]
      );
      if (versionResult.rows[0].max_version) {
        maxVersion = versionResult.rows[0].max_version + 1;
      }
    } else if (input.projectId) {
      const versionResult = await db.query(
        `
        SELECT MAX(version_number) as max_version FROM file_versions
        WHERE project_id = $1
        `,
        [input.projectId]
      );
      if (versionResult.rows[0].max_version) {
        maxVersion = versionResult.rows[0].max_version + 1;
      }
    }

    const fileVersion = await db.query(
      `
      INSERT INTO file_versions (
        id, organization_id, deliverable_id, project_id, filename, file_url,
        file_size, file_hash, version_number, uploaded_by, uploaded_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *
      `,
      [
        crypto.randomUUID(),
        organizationId,
        input.deliverableId || null,
        input.projectId || null,
        input.filename,
        input.fileUrl,
        input.fileSize,
        input.fileHash,
        maxVersion,
        userId,
      ]
    );

    return this.mapToFileVersion(fileVersion.rows[0]);
  }

  async getFileVersions(
    deliverableId: string,
    organizationId: string
  ): Promise<FileVersion[]> {
    const result = await db.query(
      `
      SELECT fv.* FROM file_versions fv
      INNER JOIN deliverables d ON fv.deliverable_id = d.id
      INNER JOIN projects p ON d.project_id = p.id
      WHERE fv.deliverable_id = $1 AND p.organization_id = $2
      ORDER BY fv.version_number DESC
      `,
      [deliverableId, organizationId]
    );

    return result.rows.map((row) => this.mapToFileVersion(row));
  }

  private mapToDeliverable(row: any): Deliverable {
    return {
      id: row.id,
      projectId: row.project_id,
      name: row.name,
      description: row.description,
      expectedDate: row.expected_date,
      actualDate: row.actual_date,
      status: row.status,
      fileUrls: typeof row.file_urls === 'string' ? JSON.parse(row.file_urls) : row.file_urls,
      approvalNotes: row.approval_notes,
      approvedBy: row.approved_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapToFileVersion(row: any): FileVersion {
    return {
      id: row.id,
      organizationId: row.organization_id,
      deliverableId: row.deliverable_id,
      projectId: row.project_id,
      filename: row.filename,
      fileUrl: row.file_url,
      fileSize: row.file_size,
      fileHash: row.file_hash,
      versionNumber: row.version_number,
      uploadedBy: row.uploaded_by,
      uploadedAt: row.uploaded_at,
    };
  }
}

export const deliverableService = new DeliverableService();
