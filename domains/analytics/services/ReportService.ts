import { getConnection } from '../../../platform/database/connection';
import { ValidationError, NotFoundError } from '../../../platform/errors/errors';
import { Report, ReportCreateInput, ReportSchedule, REPORT_TYPES, REPORT_FORMATS, REPORT_FREQUENCIES } from '../models/index';

export const reportService = {
  async createReport(organizationId: string, userId: string, input: ReportCreateInput): Promise<Report> {
    if (!input.name?.trim()) {
      throw new ValidationError('Report name is required');
    }
    if (!REPORT_TYPES.includes(input.type)) {
      throw new ValidationError(`Invalid report type: ${input.type}`);
    }
    if (!REPORT_FORMATS.includes(input.format)) {
      throw new ValidationError(`Invalid format: ${input.format}`);
    }
    if (!input.metrics || input.metrics.length === 0) {
      throw new ValidationError('At least one metric is required');
    }
    if (!input.recipients || input.recipients.length === 0) {
      throw new ValidationError('At least one recipient is required');
    }
    if (!input.schedule || !REPORT_FREQUENCIES.includes(input.schedule.frequency)) {
      throw new ValidationError('Invalid schedule frequency');
    }

    const connection = await getConnection();
    const result = await connection.query(
      `INSERT INTO reports (organization_id, name, description, type, metrics, filters, format, schedule, recipients, status, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft', $10, NOW(), NOW())
       RETURNING *`,
      [organizationId, input.name, input.description || null, input.type, JSON.stringify(input.metrics), JSON.stringify(input.filters || {}), input.format, JSON.stringify(input.schedule), JSON.stringify(input.recipients), userId]
    );

    return result.rows[0];
  },

  async getReportById(reportId: string, organizationId: string): Promise<Report> {
    const connection = await getConnection();
    const result = await connection.query(
      'SELECT * FROM reports WHERE id = $1 AND organization_id = $2',
      [reportId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Report not found');
    }

    return result.rows[0];
  },

  async getOrganizationReports(organizationId: string, limit: number = 50, offset: number = 0): Promise<{ items: Report[]; total: number }> {
    const connection = await getConnection();
    const countResult = await connection.query(
      'SELECT COUNT(*) FROM reports WHERE organization_id = $1',
      [organizationId]
    );

    const result = await connection.query(
      'SELECT * FROM reports WHERE organization_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [organizationId, limit, offset]
    );

    return { items: result.rows, total: parseInt(countResult.rows[0].count, 10) };
  },

  async getReportsByStatus(organizationId: string, status: string, limit: number = 50, offset: number = 0): Promise<{ items: Report[]; total: number }> {
    const connection = await getConnection();
    const countResult = await connection.query(
      'SELECT COUNT(*) FROM reports WHERE organization_id = $1 AND status = $2',
      [organizationId, status]
    );

    const result = await connection.query(
      'SELECT * FROM reports WHERE organization_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4',
      [organizationId, status, limit, offset]
    );

    return { items: result.rows, total: parseInt(countResult.rows[0].count, 10) };
  },

  async updateReportStatus(reportId: string, organizationId: string, status: string, errorMessage?: string): Promise<Report> {
    const connection = await getConnection();
    const result = await connection.query(
      `UPDATE reports SET status = $1, last_error_message = $2, updated_at = NOW()
       WHERE id = $3 AND organization_id = $4
       RETURNING *`,
      [status, errorMessage || null, reportId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Report not found');
    }

    return result.rows[0];
  },

  async updateReportSchedule(reportId: string, organizationId: string, schedule: ReportSchedule): Promise<Report> {
    if (!REPORT_FREQUENCIES.includes(schedule.frequency)) {
      throw new ValidationError('Invalid schedule frequency');
    }

    const connection = await getConnection();
    const result = await connection.query(
      `UPDATE reports SET schedule = $1, updated_at = NOW()
       WHERE id = $2 AND organization_id = $3
       RETURNING *`,
      [JSON.stringify(schedule), reportId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Report not found');
    }

    return result.rows[0];
  },

  async recordReportRun(reportId: string, organizationId: string): Promise<Report> {
    const connection = await getConnection();
    const result = await connection.query(
      `UPDATE reports SET last_run_at = NOW(), next_run_at = NOW() + INTERVAL '1 day', updated_at = NOW()
       WHERE id = $1 AND organization_id = $2
       RETURNING *`,
      [reportId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Report not found');
    }

    return result.rows[0];
  },

  async deleteReport(reportId: string, organizationId: string): Promise<void> {
    const connection = await getConnection();
    const result = await connection.query(
      'DELETE FROM reports WHERE id = $1 AND organization_id = $2',
      [reportId, organizationId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('Report not found');
    }
  },

  async getScheduledReports(status: string = 'active'): Promise<Report[]> {
    const connection = await getConnection();
    const result = await connection.query(
      `SELECT * FROM reports WHERE status = $1 AND (next_run_at IS NULL OR next_run_at <= NOW())
       ORDER BY created_at DESC`,
      [status]
    );

    return result.rows;
  },

  async activateReport(reportId: string, organizationId: string): Promise<Report> {
    const connection = await getConnection();
    const result = await connection.query(
      `UPDATE reports SET status = 'active', updated_at = NOW()
       WHERE id = $1 AND organization_id = $2
       RETURNING *`,
      [reportId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Report not found');
    }

    return result.rows[0];
  },

  async deactivateReport(reportId: string, organizationId: string): Promise<Report> {
    const connection = await getConnection();
    const result = await connection.query(
      `UPDATE reports SET status = 'inactive', updated_at = NOW()
       WHERE id = $1 AND organization_id = $2
       RETURNING *`,
      [reportId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Report not found');
    }

    return result.rows[0];
  },
};
