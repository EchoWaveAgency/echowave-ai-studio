// Phase 2: Sales & Proposals schema migration

export async function up(db: any) {
  // Service Catalog Items table
  await db.query(`
    CREATE TABLE IF NOT EXISTS service_catalog_items (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(50) NOT NULL,
      base_price DECIMAL(15, 2) NOT NULL,
      currency VARCHAR(3) DEFAULT 'EGP',
      delivery_days INTEGER NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_service_catalog_org
     ON service_catalog_items(organization_id)`
  );

  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_service_catalog_category
     ON service_catalog_items(organization_id, category, is_active)`
  );

  // Proposals table
  await db.query(`
    CREATE TABLE IF NOT EXISTS proposals (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      client_id VARCHAR(255) NOT NULL,
      lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
      opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(20) DEFAULT 'draft',
      version INTEGER DEFAULT 1,
      base_price DECIMAL(15, 2) NOT NULL,
      discount DECIMAL(15, 2),
      final_price DECIMAL(15, 2) NOT NULL,
      currency VARCHAR(3) DEFAULT 'EGP',
      valid_until_date TIMESTAMP NOT NULL,
      sent_at TIMESTAMP,
      viewed_at TIMESTAMP,
      responded_at TIMESTAMP,
      response VARCHAR(20),
      notes TEXT,
      internal_notes TEXT,
      approval_status VARCHAR(20) DEFAULT 'pending',
      approved_by UUID,
      approved_at TIMESTAMP,
      is_locked BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_proposals_org
     ON proposals(organization_id)`
  );

  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_proposals_status
     ON proposals(organization_id, status)`
  );

  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_proposals_lead
     ON proposals(lead_id)`
  );

  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_proposals_client
     ON proposals(organization_id, client_id)`
  );

  // Proposal Line Items table
  await db.query(`
    CREATE TABLE IF NOT EXISTS proposal_line_items (
      id UUID PRIMARY KEY,
      proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      service_catalog_item_id UUID REFERENCES service_catalog_items(id) ON DELETE SET NULL,
      description TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(15, 2) NOT NULL,
      subtotal DECIMAL(15, 2) NOT NULL,
      line_order INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_proposal_items_proposal
     ON proposal_line_items(proposal_id)`
  );

  // Proposal History table
  await db.query(`
    CREATE TABLE IF NOT EXISTS proposal_history (
      id UUID PRIMARY KEY,
      proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      version INTEGER NOT NULL,
      status VARCHAR(20) NOT NULL,
      changes JSONB,
      changed_by UUID,
      changed_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_proposal_history_proposal
     ON proposal_history(proposal_id, version)`
  );

  // Approval Gates table
  await db.query(`
    CREATE TABLE IF NOT EXISTS approval_gates (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      resource_type VARCHAR(50) NOT NULL,
      resource_id VARCHAR(255) NOT NULL,
      required_approvers TEXT[] NOT NULL,
      current_approvals TEXT[] DEFAULT '{}',
      status VARCHAR(20) DEFAULT 'pending',
      rejection_reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_approval_gates_resource
     ON approval_gates(organization_id, resource_type, resource_id)`
  );

  // Proposal Templates table
  await db.query(`
    CREATE TABLE IF NOT EXISTS proposal_templates (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      content TEXT NOT NULL,
      is_default BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_proposal_templates_org
     ON proposal_templates(organization_id)`
  );
}

export async function down(db: any) {
  // Drop tables in reverse order
  await db.query(`DROP TABLE IF EXISTS proposal_templates`);
  await db.query(`DROP TABLE IF EXISTS approval_gates`);
  await db.query(`DROP TABLE IF EXISTS proposal_history`);
  await db.query(`DROP TABLE IF EXISTS proposal_line_items`);
  await db.query(`DROP TABLE IF EXISTS proposals`);
  await db.query(`DROP TABLE IF EXISTS service_catalog_items`);
}
