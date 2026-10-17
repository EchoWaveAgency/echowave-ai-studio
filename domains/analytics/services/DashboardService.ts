import { getConnection } from '../../../platform/database/connection';
import { ValidationError, NotFoundError } from '../../../platform/errors/errors';
import { Dashboard, DashboardWidget, DashboardCreateInput, DASHBOARD_LAYOUTS, WIDGET_CHART_TYPES, WIDGET_TIME_RANGES } from '../models/index';

export const dashboardService = {
  async createDashboard(organizationId: string, input: DashboardCreateInput): Promise<Dashboard> {
    if (!input.name?.trim()) {
      throw new ValidationError('Dashboard name is required');
    }
    if (!DASHBOARD_LAYOUTS.includes(input.layout)) {
      throw new ValidationError(`Invalid layout: ${input.layout}`);
    }

    const connection = await getConnection();
    const result = await connection.query(
      `INSERT INTO dashboards (organization_id, name, description, layout, is_public, access_control, status, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, NOW(), NOW())
       RETURNING *`,
      [organizationId, input.name, input.description || null, input.layout, input.isPublic || false, JSON.stringify(input.accessControl || []), organizationId]
    );

    const dashboard = result.rows[0];
    dashboard.widgets = [];
    return dashboard;
  },

  async getDashboardById(dashboardId: string, organizationId: string): Promise<Dashboard> {
    const connection = await getConnection();
    const result = await connection.query(
      'SELECT * FROM dashboards WHERE id = $1 AND organization_id = $2',
      [dashboardId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Dashboard not found');
    }

    const dashboard = result.rows[0];
    const widgetResult = await connection.query(
      'SELECT * FROM dashboard_widgets WHERE dashboard_id = $1 ORDER BY position ASC',
      [dashboardId]
    );

    dashboard.widgets = widgetResult.rows;
    return dashboard;
  },

  async getOrganizationDashboards(organizationId: string, limit: number = 50, offset: number = 0): Promise<{ items: Dashboard[]; total: number }> {
    const connection = await getConnection();
    const countResult = await connection.query(
      'SELECT COUNT(*) FROM dashboards WHERE organization_id = $1',
      [organizationId]
    );

    const result = await connection.query(
      'SELECT * FROM dashboards WHERE organization_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [organizationId, limit, offset]
    );

    const dashboards = await Promise.all(
      result.rows.map(async (dashboard) => {
        const widgetResult = await connection.query(
          'SELECT * FROM dashboard_widgets WHERE dashboard_id = $1 ORDER BY position ASC',
          [dashboard.id]
        );
        dashboard.widgets = widgetResult.rows;
        return dashboard;
      })
    );

    return { items: dashboards, total: parseInt(countResult.rows[0].count, 10) };
  },

  async updateDashboard(dashboardId: string, organizationId: string, updates: Partial<DashboardCreateInput>): Promise<Dashboard> {
    const dashboard = await this.getDashboardById(dashboardId, organizationId);

    if (updates.layout && !DASHBOARD_LAYOUTS.includes(updates.layout)) {
      throw new ValidationError(`Invalid layout: ${updates.layout}`);
    }

    const connection = await getConnection();
    const result = await connection.query(
      `UPDATE dashboards SET
       name = COALESCE($1, name),
       description = COALESCE($2, description),
       layout = COALESCE($3, layout),
       is_public = COALESCE($4, is_public),
       access_control = COALESCE($5, access_control),
       updated_at = NOW()
       WHERE id = $6 AND organization_id = $7
       RETURNING *`,
      [updates.name || null, updates.description || null, updates.layout || null, updates.isPublic !== undefined ? updates.isPublic : null, updates.accessControl ? JSON.stringify(updates.accessControl) : null, dashboardId, organizationId]
    );

    const updatedDashboard = result.rows[0];
    updatedDashboard.widgets = dashboard.widgets;
    return updatedDashboard;
  },

  async addWidget(dashboardId: string, organizationId: string, metricId: string, widget: Omit<DashboardWidget, 'id' | 'dashboardId'>): Promise<DashboardWidget> {
    if (!WIDGET_CHART_TYPES.includes(widget.chartType)) {
      throw new ValidationError(`Invalid chart type: ${widget.chartType}`);
    }
    if (!WIDGET_TIME_RANGES.includes(widget.timeRange)) {
      throw new ValidationError(`Invalid time range: ${widget.timeRange}`);
    }

    const dashboard = await this.getDashboardById(dashboardId, organizationId);

    const connection = await getConnection();
    const result = await connection.query(
      `INSERT INTO dashboard_widgets (dashboard_id, metric_id, position, width, height, chart_type, time_range, refresh_interval)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [dashboardId, metricId, widget.position, widget.width, widget.height, widget.chartType, widget.timeRange, widget.refreshInterval]
    );

    return result.rows[0];
  },

  async updateWidget(dashboardId: string, widgetId: string, organizationId: string, updates: Partial<Omit<DashboardWidget, 'id' | 'dashboardId'>>): Promise<DashboardWidget> {
    await this.getDashboardById(dashboardId, organizationId);

    if (updates.chartType && !WIDGET_CHART_TYPES.includes(updates.chartType)) {
      throw new ValidationError(`Invalid chart type: ${updates.chartType}`);
    }
    if (updates.timeRange && !WIDGET_TIME_RANGES.includes(updates.timeRange)) {
      throw new ValidationError(`Invalid time range: ${updates.timeRange}`);
    }

    const connection = await getConnection();
    const result = await connection.query(
      `UPDATE dashboard_widgets SET
       position = COALESCE($1, position),
       width = COALESCE($2, width),
       height = COALESCE($3, height),
       chart_type = COALESCE($4, chart_type),
       time_range = COALESCE($5, time_range),
       refresh_interval = COALESCE($6, refresh_interval)
       WHERE id = $7 AND dashboard_id = $8
       RETURNING *`,
      [updates.position !== undefined ? updates.position : null, updates.width || null, updates.height || null, updates.chartType || null, updates.timeRange || null, updates.refreshInterval || null, widgetId, dashboardId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Widget not found');
    }

    return result.rows[0];
  },

  async removeWidget(dashboardId: string, widgetId: string, organizationId: string): Promise<void> {
    await this.getDashboardById(dashboardId, organizationId);

    const connection = await getConnection();
    const result = await connection.query(
      'DELETE FROM dashboard_widgets WHERE id = $1 AND dashboard_id = $2',
      [widgetId, dashboardId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('Widget not found');
    }
  },

  async deleteDashboard(dashboardId: string, organizationId: string): Promise<void> {
    const connection = await getConnection();
    await connection.query('DELETE FROM dashboard_widgets WHERE dashboard_id = $1', [dashboardId]);
    const result = await connection.query(
      'DELETE FROM dashboards WHERE id = $1 AND organization_id = $2',
      [dashboardId, organizationId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('Dashboard not found');
    }
  },

  async getPublicDashboards(limit: number = 50, offset: number = 0): Promise<{ items: Dashboard[]; total: number }> {
    const connection = await getConnection();
    const countResult = await connection.query('SELECT COUNT(*) FROM dashboards WHERE is_public = true');

    const result = await connection.query(
      'SELECT * FROM dashboards WHERE is_public = true ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    const dashboards = await Promise.all(
      result.rows.map(async (dashboard) => {
        const widgetResult = await connection.query(
          'SELECT * FROM dashboard_widgets WHERE dashboard_id = $1 ORDER BY position ASC',
          [dashboard.id]
        );
        dashboard.widgets = widgetResult.rows;
        return dashboard;
      })
    );

    return { items: dashboards, total: parseInt(countResult.rows[0].count, 10) };
  },
};
