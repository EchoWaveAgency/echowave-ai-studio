import { getConnection } from '../../../platform/database/connection';

export async function up(): Promise<void> {
  const connection = await getConnection();

  // Metrics table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS metrics (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      organization_id VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      type VARCHAR(50) NOT NULL CHECK (type IN ('count', 'sum', 'average', 'percentage', 'ratio')),
      category VARCHAR(100) NOT NULL CHECK (category IN ('sales', 'marketing', 'support', 'financial', 'operational', 'custom')),
      unit VARCHAR(100),
      data_source VARCHAR(255) NOT NULL,
      query TEXT NOT NULL,
      refresh_interval VARCHAR(50) NOT NULL CHECK (refresh_interval IN ('realtime', 'hourly', 'daily', 'weekly', 'monthly')),
      last_refreshed_at TIMESTAMP,
      status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
      last_error_message TEXT,
      created_by VARCHAR(36) NOT NULL,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );
    CREATE INDEX idx_metrics_org_id ON metrics(organization_id);
    CREATE INDEX idx_metrics_category ON metrics(organization_id, category);
    CREATE INDEX idx_metrics_status ON metrics(organization_id, status);
  `);

  // Dashboards table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS dashboards (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      organization_id VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      layout VARCHAR(50) NOT NULL CHECK (layout IN ('grid', 'custom')),
      is_public BOOLEAN DEFAULT false,
      access_control JSONB DEFAULT '[]',
      status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
      created_by VARCHAR(36) NOT NULL,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );
    CREATE INDEX idx_dashboards_org_id ON dashboards(organization_id);
    CREATE INDEX idx_dashboards_public ON dashboards(is_public);
    CREATE INDEX idx_dashboards_status ON dashboards(organization_id, status);
  `);

  // Dashboard widgets table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS dashboard_widgets (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      dashboard_id VARCHAR(36) NOT NULL,
      metric_id VARCHAR(36) NOT NULL,
      position INTEGER NOT NULL,
      width VARCHAR(50) NOT NULL CHECK (width IN ('small', 'medium', 'large')),
      height VARCHAR(50) NOT NULL CHECK (height IN ('small', 'medium', 'large')),
      chart_type VARCHAR(50) NOT NULL CHECK (chart_type IN ('line', 'bar', 'pie', 'gauge', 'table', 'number', 'heatmap')),
      time_range VARCHAR(50) NOT NULL CHECK (time_range IN ('day', 'week', 'month', 'quarter', 'year', 'custom')),
      refresh_interval VARCHAR(50) NOT NULL DEFAULT 'hourly' CHECK (refresh_interval IN ('realtime', 'hourly', 'daily', 'never')),
      FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) ON DELETE CASCADE,
      FOREIGN KEY (metric_id) REFERENCES metrics(id) ON DELETE CASCADE
    );
    CREATE INDEX idx_dashboard_widgets_dashboard ON dashboard_widgets(dashboard_id);
    CREATE INDEX idx_dashboard_widgets_metric ON dashboard_widgets(metric_id);
  `);

  // Reports table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS reports (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      organization_id VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      type VARCHAR(50) NOT NULL CHECK (type IN ('summary', 'detailed', 'executive', 'custom')),
      metrics JSONB NOT NULL,
      filters JSONB DEFAULT '{}',
      format VARCHAR(50) NOT NULL CHECK (format IN ('pdf', 'csv', 'xlsx', 'html')),
      schedule JSONB NOT NULL,
      recipients JSONB NOT NULL,
      last_run_at TIMESTAMP,
      next_run_at TIMESTAMP,
      status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'error')),
      last_error_message TEXT,
      created_by VARCHAR(36) NOT NULL,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );
    CREATE INDEX idx_reports_org_id ON reports(organization_id);
    CREATE INDEX idx_reports_status ON reports(organization_id, status);
    CREATE INDEX idx_reports_next_run ON reports(status, next_run_at) WHERE status = 'active';
  `);

  // Analytics events table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      organization_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36),
      contact_id VARCHAR(36),
      event_type VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      action VARCHAR(255) NOT NULL,
      label VARCHAR(255),
      value NUMERIC,
      properties JSONB DEFAULT '{}',
      session_id VARCHAR(255),
      metadata JSONB DEFAULT '{}',
      timestamp TIMESTAMP NOT NULL,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );
    CREATE INDEX idx_analytics_events_org_timestamp ON analytics_events(organization_id, timestamp DESC);
    CREATE INDEX idx_analytics_events_type ON analytics_events(organization_id, event_type);
    CREATE INDEX idx_analytics_events_category ON analytics_events(organization_id, category);
    CREATE INDEX idx_analytics_events_user ON analytics_events(organization_id, user_id);
    CREATE INDEX idx_analytics_events_contact ON analytics_events(organization_id, contact_id);
    CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);
  `);

  // Query logs table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS query_logs (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      organization_id VARCHAR(36) NOT NULL,
      executed_by VARCHAR(36) NOT NULL,
      query_text TEXT NOT NULL,
      row_count INTEGER DEFAULT 0,
      execution_time_ms INTEGER NOT NULL,
      executed_at TIMESTAMP NOT NULL,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );
    CREATE INDEX idx_query_logs_org_time ON query_logs(organization_id, executed_at DESC);
    CREATE INDEX idx_query_logs_user ON query_logs(executed_by);
    CREATE INDEX idx_query_logs_exec_time ON query_logs(organization_id, execution_time_ms DESC);
  `);
}

export async function down(): Promise<void> {
  const connection = await getConnection();

  await connection.query('DROP TABLE IF EXISTS query_logs CASCADE');
  await connection.query('DROP TABLE IF EXISTS analytics_events CASCADE');
  await connection.query('DROP TABLE IF EXISTS reports CASCADE');
  await connection.query('DROP TABLE IF EXISTS dashboard_widgets CASCADE');
  await connection.query('DROP TABLE IF EXISTS dashboards CASCADE');
  await connection.query('DROP TABLE IF EXISTS metrics CASCADE');
}
