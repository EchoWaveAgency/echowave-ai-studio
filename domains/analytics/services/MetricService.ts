import { getConnection } from '../../../platform/database/connection';
import { ValidationError, NotFoundError } from '../../../platform/errors/errors';
import { Metric, MetricCreateInput, METRIC_TYPES, METRIC_CATEGORIES, REFRESH_INTERVALS } from '../models/index';

export const metricService = {
  async createMetric(organizationId: string, input: MetricCreateInput): Promise<Metric> {
    if (!input.name?.trim()) {
      throw new ValidationError('Metric name is required');
    }
    if (!METRIC_TYPES.includes(input.type)) {
      throw new ValidationError(`Invalid metric type: ${input.type}`);
    }
    if (!METRIC_CATEGORIES.includes(input.category)) {
      throw new ValidationError(`Invalid metric category: ${input.category}`);
    }
    if (!REFRESH_INTERVALS.includes(input.refreshInterval)) {
      throw new ValidationError(`Invalid refresh interval: ${input.refreshInterval}`);
    }
    if (!input.dataSource?.trim()) {
      throw new ValidationError('Data source is required');
    }
    if (!input.query?.trim()) {
      throw new ValidationError('Query is required');
    }

    const connection = await getConnection();
    const result = await connection.query(
      `INSERT INTO metrics (organization_id, name, description, type, category, unit, data_source, query, refresh_interval, status, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', $10, NOW(), NOW())
       RETURNING *`,
      [organizationId, input.name, input.description || null, input.type, input.category, input.unit || null, input.dataSource, input.query, input.refreshInterval, organizationId]
    );

    return result.rows[0];
  },

  async getMetricById(metricId: string, organizationId: string): Promise<Metric> {
    const connection = await getConnection();
    const result = await connection.query(
      'SELECT * FROM metrics WHERE id = $1 AND organization_id = $2',
      [metricId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Metric not found');
    }

    return result.rows[0];
  },

  async getOrganizationMetrics(organizationId: string, limit: number = 50, offset: number = 0): Promise<{ items: Metric[]; total: number }> {
    const connection = await getConnection();
    const countResult = await connection.query(
      'SELECT COUNT(*) FROM metrics WHERE organization_id = $1',
      [organizationId]
    );

    const result = await connection.query(
      'SELECT * FROM metrics WHERE organization_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [organizationId, limit, offset]
    );

    return { items: result.rows, total: parseInt(countResult.rows[0].count, 10) };
  },

  async getMetricsByCategory(organizationId: string, category: string, limit: number = 50, offset: number = 0): Promise<{ items: Metric[]; total: number }> {
    const connection = await getConnection();
    const countResult = await connection.query(
      'SELECT COUNT(*) FROM metrics WHERE organization_id = $1 AND category = $2',
      [organizationId, category]
    );

    const result = await connection.query(
      'SELECT * FROM metrics WHERE organization_id = $1 AND category = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4',
      [organizationId, category, limit, offset]
    );

    return { items: result.rows, total: parseInt(countResult.rows[0].count, 10) };
  },

  async updateMetric(metricId: string, organizationId: string, updates: Partial<MetricCreateInput>): Promise<Metric> {
    const metric = await this.getMetricById(metricId, organizationId);

    if (updates.type && !METRIC_TYPES.includes(updates.type)) {
      throw new ValidationError(`Invalid metric type: ${updates.type}`);
    }
    if (updates.category && !METRIC_CATEGORIES.includes(updates.category)) {
      throw new ValidationError(`Invalid metric category: ${updates.category}`);
    }
    if (updates.refreshInterval && !REFRESH_INTERVALS.includes(updates.refreshInterval)) {
      throw new ValidationError(`Invalid refresh interval: ${updates.refreshInterval}`);
    }

    const connection = await getConnection();
    const result = await connection.query(
      `UPDATE metrics SET
       name = COALESCE($1, name),
       description = COALESCE($2, description),
       type = COALESCE($3, type),
       category = COALESCE($4, category),
       unit = COALESCE($5, unit),
       data_source = COALESCE($6, data_source),
       query = COALESCE($7, query),
       refresh_interval = COALESCE($8, refresh_interval),
       updated_at = NOW()
       WHERE id = $9 AND organization_id = $10
       RETURNING *`,
      [updates.name || null, updates.description || null, updates.type || null, updates.category || null, updates.unit || null, updates.dataSource || null, updates.query || null, updates.refreshInterval || null, metricId, organizationId]
    );

    return result.rows[0];
  },

  async updateMetricStatus(metricId: string, organizationId: string, status: string, errorMessage?: string): Promise<Metric> {
    const connection = await getConnection();
    const result = await connection.query(
      `UPDATE metrics SET status = $1, last_error_message = $2, updated_at = NOW()
       WHERE id = $3 AND organization_id = $4
       RETURNING *`,
      [status, errorMessage || null, metricId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Metric not found');
    }

    return result.rows[0];
  },

  async updateLastRefreshed(metricId: string, organizationId: string): Promise<Metric> {
    const connection = await getConnection();
    const result = await connection.query(
      `UPDATE metrics SET last_refreshed_at = NOW(), status = 'active', last_error_message = NULL, updated_at = NOW()
       WHERE id = $1 AND organization_id = $2
       RETURNING *`,
      [metricId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Metric not found');
    }

    return result.rows[0];
  },

  async deleteMetric(metricId: string, organizationId: string): Promise<void> {
    const connection = await getConnection();
    const result = await connection.query(
      'DELETE FROM metrics WHERE id = $1 AND organization_id = $2',
      [metricId, organizationId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('Metric not found');
    }
  },

  async getActiveMetrics(organizationId: string): Promise<Metric[]> {
    const connection = await getConnection();
    const result = await connection.query(
      'SELECT * FROM metrics WHERE organization_id = $1 AND status = $2 ORDER BY created_at DESC',
      [organizationId, 'active']
    );

    return result.rows;
  },
};
