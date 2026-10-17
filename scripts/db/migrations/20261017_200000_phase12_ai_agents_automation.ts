export async function up(db: any) {
  await db.query(`
    CREATE TABLE ai_agents (
      id VARCHAR(255) PRIMARY KEY,
      organization_id VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      system_prompt TEXT NOT NULL,
      tools TEXT[] NOT NULL,
      requires_approval BOOLEAN DEFAULT false,
      approval_threshold INT,
      enabled BOOLEAN DEFAULT true,
      created_by VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      INDEX idx_org_id (organization_id),
      INDEX idx_org_type (organization_id, type),
      INDEX idx_enabled (enabled)
    )
  `);

  await db.query(`
    CREATE TABLE agent_runs (
      id VARCHAR(255) PRIMARY KEY,
      organization_id VARCHAR(255) NOT NULL,
      agent_id VARCHAR(255) NOT NULL,
      agent_type VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL,
      input JSONB NOT NULL,
      output JSONB,
      tool_calls JSONB DEFAULT '[]',
      error TEXT,
      approval_required BOOLEAN DEFAULT false,
      approval_status VARCHAR(50),
      approval_reason TEXT,
      started_at TIMESTAMP NOT NULL,
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      INDEX idx_org_id (organization_id),
      INDEX idx_agent_id (agent_id),
      INDEX idx_status (status),
      INDEX idx_started_at (started_at),
      FOREIGN KEY (agent_id) REFERENCES ai_agents(id)
    )
  `);

  await db.query(`
    CREATE TABLE agent_tools (
      id VARCHAR(255) PRIMARY KEY,
      organization_id VARCHAR(255) NOT NULL,
      agent_id VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(50) NOT NULL,
      description TEXT NOT NULL,
      input_schema JSONB NOT NULL,
      output_schema JSONB NOT NULL,
      requires_approval BOOLEAN DEFAULT false,
      rate_limit INT,
      created_at TIMESTAMP DEFAULT NOW(),
      INDEX idx_org_id (organization_id),
      INDEX idx_agent_id (agent_id),
      INDEX idx_category (category),
      FOREIGN KEY (agent_id) REFERENCES ai_agents(id)
    )
  `);

  await db.query(`
    CREATE TABLE agent_approvals (
      id VARCHAR(255) PRIMARY KEY,
      organization_id VARCHAR(255) NOT NULL,
      run_id VARCHAR(255) NOT NULL,
      agent_id VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL,
      requested_by VARCHAR(255) NOT NULL,
      approved_by VARCHAR(255),
      reason TEXT,
      impact TEXT,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      reviewed_at TIMESTAMP,
      INDEX idx_org_id (organization_id),
      INDEX idx_run_id (run_id),
      INDEX idx_agent_id (agent_id),
      INDEX idx_status (status),
      FOREIGN KEY (run_id) REFERENCES agent_runs(id),
      FOREIGN KEY (agent_id) REFERENCES ai_agents(id)
    )
  `);

  await db.query(`
    CREATE TABLE agent_evaluations (
      id VARCHAR(255) PRIMARY KEY,
      organization_id VARCHAR(255) NOT NULL,
      run_id VARCHAR(255) NOT NULL,
      agent_id VARCHAR(255) NOT NULL,
      quality INT NOT NULL CHECK (quality >= 0 AND quality <= 100),
      correctness INT NOT NULL CHECK (correctness >= 0 AND correctness <= 100),
      completeness INT NOT NULL CHECK (completeness >= 0 AND completeness <= 100),
      relevance INT NOT NULL CHECK (relevance >= 0 AND relevance <= 100),
      notes TEXT,
      evaluated_by VARCHAR(255),
      timestamp TIMESTAMP NOT NULL,
      INDEX idx_org_id (organization_id),
      INDEX idx_run_id (run_id),
      INDEX idx_agent_id (agent_id),
      INDEX idx_timestamp (timestamp),
      FOREIGN KEY (run_id) REFERENCES agent_runs(id),
      FOREIGN KEY (agent_id) REFERENCES ai_agents(id)
    )
  `);

  await db.query(`
    CREATE TABLE knowledge_sources (
      id VARCHAR(255) PRIMARY KEY,
      organization_id VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      content TEXT NOT NULL,
      category VARCHAR(100) NOT NULL,
      relevance INT,
      updated TIMESTAMP NOT NULL,
      INDEX idx_org_id (organization_id),
      INDEX idx_type (type),
      INDEX idx_category (category),
      INDEX idx_updated (updated)
    )
  `);

  await db.query(`
    CREATE TABLE agent_permissions (
      id VARCHAR(255) PRIMARY KEY,
      organization_id VARCHAR(255) NOT NULL,
      agent_id VARCHAR(255) NOT NULL,
      resource VARCHAR(255) NOT NULL,
      action VARCHAR(50) NOT NULL,
      conditions JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      INDEX idx_org_id (organization_id),
      INDEX idx_agent_id (agent_id),
      INDEX idx_resource (resource),
      FOREIGN KEY (agent_id) REFERENCES ai_agents(id)
    )
  `);

  await db.query(`
    CREATE TABLE agent_chains (
      id VARCHAR(255) PRIMARY KEY,
      organization_id VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      agents TEXT[] NOT NULL,
      input_mapping JSONB NOT NULL,
      output_mapping JSONB NOT NULL,
      condition_rules JSONB,
      enabled BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      INDEX idx_org_id (organization_id),
      INDEX idx_enabled (enabled)
    )
  `);

  return true;
}

export async function down(db: any) {
  await db.query('DROP TABLE IF EXISTS agent_chains');
  await db.query('DROP TABLE IF EXISTS agent_permissions');
  await db.query('DROP TABLE IF EXISTS knowledge_sources');
  await db.query('DROP TABLE IF EXISTS agent_evaluations');
  await db.query('DROP TABLE IF EXISTS agent_approvals');
  await db.query('DROP TABLE IF EXISTS agent_tools');
  await db.query('DROP TABLE IF EXISTS agent_runs');
  await db.query('DROP TABLE IF EXISTS ai_agents');

  return true;
}
