export async function up(db: any) {
  await db.query(`
    CREATE TABLE dashboards (
      id VARCHAR(255) PRIMARY KEY,
      organization_id VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      type VARCHAR(50) NOT NULL,
      layout JSONB NOT NULL,
      widgets JSONB DEFAULT '[]',
      filters JSONB DEFAULT '[]',
      is_default BOOLEAN DEFAULT false,
      created_by VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      INDEX idx_org_id (organization_id),
      INDEX idx_org_type (organization_id, type),
      INDEX idx_is_default (is_default)
    )
  `);

  await db.query(`
    CREATE TABLE kpi_metrics (
      id VARCHAR(255) PRIMARY KEY,
      organization_id VARCHAR(255) NOT NULL,
      key VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(50) NOT NULL,
      description TEXT,
      unit VARCHAR(50) NOT NULL,
      formula TEXT NOT NULL,
      refresh_interval INT NOT NULL,
      alert_thresholds JSONB,
      historical_data JSONB DEFAULT '[]',
      last_updated TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      INDEX idx_org_id (organization_id),
      INDEX idx_org_category (organization_id, category),
      INDEX idx_key (key),
      INDEX idx_last_updated (last_updated)
    )
  `);

  await db.query(`
    CREATE TABLE financial_metrics (
      id VARCHAR(255) PRIMARY KEY,
      organization_id VARCHAR(255) NOT NULL,
      period VARCHAR(50) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      total_revenue DECIMAL(15, 2) DEFAULT 0,
      total_expenses DECIMAL(15, 2) DEFAULT 0,
      net_profit DECIMAL(15, 2) DEFAULT 0,
      gross_margin DECIMAL(5, 2) DEFAULT 0,
      operating_margin DECIMAL(5, 2) DEFAULT 0,
      revenue_by_category JSONB,
      expenses_by_category JSONB,
      payment_status JSONB,
      invoice_metrics JSONB,
      subscription_metrics JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      INDEX idx_org_id (organization_id),
      INDEX idx_period (period),
      INDEX idx_date_range (start_date, end_date)
    )
  `);

  await db.query(`
    CREATE TABLE sales_metrics (
      id VARCHAR(255) PRIMARY KEY,
      organization_id VARCHAR(255) NOT NULL,
      period VARCHAR(50) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      total_proposals INT DEFAULT 0,
      won_proposals INT DEFAULT 0,
      lost_proposals INT DEFAULT 0,
      win_rate DECIMAL(5, 2) DEFAULT 0,
      total_value DECIMAL(15, 2) DEFAULT 0,
      avg_deal_size DECIMAL(15, 2) DEFAULT 0,
      pipeline_value DECIMAL(15, 2) DEFAULT 0,
      proposals_by_stage JSONB,
      conversion_rates JSONB,
      top_products JSONB,
      team_performance JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      INDEX idx_org_id (organization_id),
      INDEX idx_period (period),
      INDEX idx_date_range (start_date, end_date)
    )
  `);

  await db.query(`
    CREATE TABLE operational_metrics (
      id VARCHAR(255) PRIMARY KEY,
      organization_id VARCHAR(255) NOT NULL,
      period VARCHAR(50) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      total_projects INT DEFAULT 0,
      completed_projects INT DEFAULT 0,
      completion_rate DECIMAL(5, 2) DEFAULT 0,
      avg_project_duration INT DEFAULT 0,
      on_time_delivery_rate DECIMAL(5, 2) DEFAULT 0,
      contract_metrics JSONB,
      team_metrics JSONB,
      quality_metrics JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      INDEX idx_org_id (organization_id),
      INDEX idx_period (period),
      INDEX idx_date_range (start_date, end_date)
    )
  `);

  await db.query(`
    CREATE TABLE custom_reports (
      id VARCHAR(255) PRIMARY KEY,
      organization_id VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      template VARCHAR(50) NOT NULL,
      metrics TEXT[] NOT NULL,
      filters JSONB,
      group_by VARCHAR(255),
      order_by JSONB,
      visualization VARCHAR(50) NOT NULL,
      chart_type VARCHAR(50),
      created_by VARCHAR(255) NOT NULL,
      is_scheduled BOOLEAN DEFAULT false,
      schedule JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      INDEX idx_org_id (organization_id),
      INDEX idx_template (template),
      INDEX idx_visualization (visualization),
      INDEX idx_scheduled (is_scheduled)
    )
  `);

  await db.query(`
    CREATE TABLE metric_alerts (
      id VARCHAR(255) PRIMARY KEY,
      organization_id VARCHAR(255) NOT NULL,
      metric_key VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      condition VARCHAR(50) NOT NULL,
      value DECIMAL(15, 2) NOT NULL,
      enabled BOOLEAN DEFAULT true,
      notification_channels TEXT[] NOT NULL,
      recipients TEXT[] NOT NULL,
      last_triggered TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      INDEX idx_org_id (organization_id),
      INDEX idx_metric_key (metric_key),
      INDEX idx_enabled (enabled),
      INDEX idx_type (type),
      INDEX idx_last_triggered (last_triggered)
    )
  `);

  await db.query(`
    CREATE TABLE report_exports (
      id VARCHAR(255) PRIMARY KEY,
      organization_id VARCHAR(255) NOT NULL,
      report_id VARCHAR(255) NOT NULL,
      format VARCHAR(50) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_size INT,
      download_url TEXT,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      INDEX idx_org_id (organization_id),
      INDEX idx_report_id (report_id),
      INDEX idx_expires_at (expires_at)
    )
  `);

  return true;
}

export async function down(db: any) {
  await db.query('DROP TABLE IF EXISTS report_exports');
  await db.query('DROP TABLE IF EXISTS metric_alerts');
  await db.query('DROP TABLE IF EXISTS custom_reports');
  await db.query('DROP TABLE IF EXISTS operational_metrics');
  await db.query('DROP TABLE IF EXISTS sales_metrics');
  await db.query('DROP TABLE IF EXISTS financial_metrics');
  await db.query('DROP TABLE IF EXISTS kpi_metrics');
  await db.query('DROP TABLE IF EXISTS dashboards');

  return true;
}
