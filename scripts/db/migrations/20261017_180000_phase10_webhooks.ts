export async function up(db: any) {
  // Create webhook_endpoints table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS webhook_endpoints (
      id VARCHAR(255) PRIMARY KEY,
      organization_id VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      url VARCHAR(2048) NOT NULL,
      active BOOLEAN DEFAULT true,
      events JSONB DEFAULT '[]'::jsonb,
      retry_policy JSONB DEFAULT '{"maxRetries":5,"backoffMultiplier":2,"initialDelayMs":1000}'::jsonb,
      headers JSONB DEFAULT '{}'::jsonb,
      authentication JSONB,
      rate_limit JSONB,
      created_by VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_success_at TIMESTAMP,
      last_failure_at TIMESTAMP,
      consecutive_failures INTEGER DEFAULT 0,
      metadata JSONB DEFAULT '{}'::jsonb,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    )
  `);

  await db.execute('CREATE INDEX idx_webhook_endpoints_org_id ON webhook_endpoints(organization_id)');
  await db.execute('CREATE INDEX idx_webhook_endpoints_active ON webhook_endpoints(active)');
  await db.execute('CREATE INDEX idx_webhook_endpoints_created_at ON webhook_endpoints(created_at)');

  // Create webhook_events table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS webhook_events (
      id VARCHAR(255) PRIMARY KEY,
      organization_id VARCHAR(255) NOT NULL,
      endpoint_id VARCHAR(255) NOT NULL,
      event_type VARCHAR(100) NOT NULL,
      event_category VARCHAR(50) NOT NULL,
      payload JSONB DEFAULT '{}'::jsonb,
      status VARCHAR(50) NOT NULL,
      attempts INTEGER DEFAULT 0,
      last_attempt_at TIMESTAMP,
      next_retry_at TIMESTAMP,
      delivered_at TIMESTAMP,
      failure_reason TEXT,
      response_code INTEGER,
      response_body TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      metadata JSONB DEFAULT '{}'::jsonb,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (endpoint_id) REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
      CONSTRAINT check_webhook_status CHECK (status IN ('pending', 'delivered', 'failed', 'failed_max_retries'))
    )
  `);

  await db.execute('CREATE INDEX idx_webhook_events_org_id ON webhook_events(organization_id)');
  await db.execute('CREATE INDEX idx_webhook_events_endpoint_id ON webhook_events(endpoint_id)');
  await db.execute('CREATE INDEX idx_webhook_events_status ON webhook_events(status)');
  await db.execute('CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type)');
  await db.execute('CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at)');
  await db.execute('CREATE INDEX idx_webhook_events_next_retry_at ON webhook_events(next_retry_at)');

  // Create webhook_deliveries table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS webhook_deliveries (
      id VARCHAR(255) PRIMARY KEY,
      organization_id VARCHAR(255) NOT NULL,
      webhook_event_id VARCHAR(255) NOT NULL,
      endpoint_id VARCHAR(255) NOT NULL,
      attempt INTEGER NOT NULL,
      request_headers JSONB DEFAULT '{}'::jsonb,
      request_body TEXT NOT NULL,
      response_code INTEGER,
      response_headers JSONB,
      response_body TEXT,
      duration INTEGER,
      success BOOLEAN,
      error_message TEXT,
      ip_address VARCHAR(45),
      user_agent TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      metadata JSONB DEFAULT '{}'::jsonb,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (webhook_event_id) REFERENCES webhook_events(id) ON DELETE CASCADE,
      FOREIGN KEY (endpoint_id) REFERENCES webhook_endpoints(id) ON DELETE CASCADE
    )
  `);

  await db.execute('CREATE INDEX idx_webhook_deliveries_org_id ON webhook_deliveries(organization_id)');
  await db.execute('CREATE INDEX idx_webhook_deliveries_webhook_event_id ON webhook_deliveries(webhook_event_id)');
  await db.execute('CREATE INDEX idx_webhook_deliveries_endpoint_id ON webhook_deliveries(endpoint_id)');
  await db.execute('CREATE INDEX idx_webhook_deliveries_success ON webhook_deliveries(success)');
  await db.execute('CREATE INDEX idx_webhook_deliveries_timestamp ON webhook_deliveries(timestamp)');

  // Create event_subscriptions table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS event_subscriptions (
      id VARCHAR(255) PRIMARY KEY,
      organization_id VARCHAR(255) NOT NULL,
      user_id VARCHAR(255) NOT NULL,
      event_types JSONB DEFAULT '[]'::jsonb,
      channels JSONB DEFAULT '[]'::jsonb,
      filters JSONB,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      metadata JSONB DEFAULT '{}'::jsonb,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    )
  `);

  await db.execute('CREATE INDEX idx_event_subscriptions_org_id ON event_subscriptions(organization_id)');
  await db.execute('CREATE INDEX idx_event_subscriptions_user_id ON event_subscriptions(user_id)');
  await db.execute('CREATE INDEX idx_event_subscriptions_active ON event_subscriptions(active)');

  // Create webhook_logs table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS webhook_logs (
      id VARCHAR(255) PRIMARY KEY,
      organization_id VARCHAR(255) NOT NULL,
      webhook_event_id VARCHAR(255) NOT NULL,
      endpoint_id VARCHAR(255) NOT NULL,
      action VARCHAR(50) NOT NULL,
      details JSONB DEFAULT '{}'::jsonb,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (webhook_event_id) REFERENCES webhook_events(id) ON DELETE CASCADE,
      FOREIGN KEY (endpoint_id) REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
      CONSTRAINT check_webhook_log_action CHECK (action IN ('created', 'delivery_attempt', 'retry_scheduled', 'succeeded', 'failed', 'skipped'))
    )
  `);

  await db.execute('CREATE INDEX idx_webhook_logs_org_id ON webhook_logs(organization_id)');
  await db.execute('CREATE INDEX idx_webhook_logs_webhook_event_id ON webhook_logs(webhook_event_id)');
  await db.execute('CREATE INDEX idx_webhook_logs_endpoint_id ON webhook_logs(endpoint_id)');
  await db.execute('CREATE INDEX idx_webhook_logs_action ON webhook_logs(action)');
  await db.execute('CREATE INDEX idx_webhook_logs_timestamp ON webhook_logs(timestamp)');
}

export async function down(db: any) {
  await db.execute('DROP TABLE IF EXISTS webhook_logs CASCADE');
  await db.execute('DROP TABLE IF EXISTS event_subscriptions CASCADE');
  await db.execute('DROP TABLE IF EXISTS webhook_deliveries CASCADE');
  await db.execute('DROP TABLE IF EXISTS webhook_events CASCADE');
  await db.execute('DROP TABLE IF EXISTS webhook_endpoints CASCADE');
}
