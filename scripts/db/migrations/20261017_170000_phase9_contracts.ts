export async function up(db: any) {
  // Create contract_templates table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS contract_templates (
      id VARCHAR(255) PRIMARY KEY,
      organization_id VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(50) NOT NULL,
      description TEXT,
      content TEXT NOT NULL,
      variables JSONB DEFAULT '[]'::jsonb,
      created_by VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL,
      version INTEGER DEFAULT 1,
      tags JSONB DEFAULT '[]'::jsonb,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      CONSTRAINT check_template_status CHECK (status IN ('draft', 'active', 'archived')),
      CONSTRAINT check_category CHECK (category IN ('service', 'nda', 'employment', 'vendor', 'license', 'partnership', 'custom'))
    )
  `);

  await db.execute(
    'CREATE INDEX idx_contract_templates_org_id ON contract_templates(organization_id)',
  );
  await db.execute(
    'CREATE INDEX idx_contract_templates_status ON contract_templates(status)',
  );
  await db.execute(
    'CREATE INDEX idx_contract_templates_category ON contract_templates(category)',
  );

  // Create contracts table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS contracts (
      id VARCHAR(255) PRIMARY KEY,
      organization_id VARCHAR(255) NOT NULL,
      template_id VARCHAR(255),
      contract_number VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      parties JSONB DEFAULT '[]'::jsonb,
      variables JSONB DEFAULT '{}'::jsonb,
      status VARCHAR(50) NOT NULL,
      category VARCHAR(50) NOT NULL,
      start_date TIMESTAMP,
      end_date TIMESTAMP,
      renewal_date TIMESTAMP,
      auto_renew BOOLEAN DEFAULT false,
      related_to_subscription_id VARCHAR(255),
      related_to_proposal_id VARCHAR(255),
      created_by VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      metadata JSONB DEFAULT '{}'::jsonb,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (template_id) REFERENCES contract_templates(id) ON DELETE SET NULL,
      CONSTRAINT check_contract_status CHECK (status IN ('draft', 'pending_review', 'pending_signature', 'signed', 'expired', 'terminated', 'archived')),
      CONSTRAINT check_contract_category CHECK (category IN ('service', 'nda', 'employment', 'vendor', 'license', 'partnership', 'custom'))
    )
  `);

  await db.execute('CREATE INDEX idx_contracts_org_id ON contracts(organization_id)');
  await db.execute('CREATE INDEX idx_contracts_status ON contracts(status)');
  await db.execute('CREATE INDEX idx_contracts_contract_number ON contracts(contract_number)');
  await db.execute('CREATE INDEX idx_contracts_category ON contracts(category)');
  await db.execute('CREATE INDEX idx_contracts_end_date ON contracts(end_date)');

  // Create contract_signers table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS contract_signers (
      id VARCHAR(255) PRIMARY KEY,
      organization_id VARCHAR(255) NOT NULL,
      contract_id VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      signature_type VARCHAR(50) NOT NULL,
      signed_at TIMESTAMP,
      signature_data JSONB,
      ip_address VARCHAR(45),
      user_agent TEXT,
      status VARCHAR(50) NOT NULL,
      signature_token_id VARCHAR(255),
      token_expires_at TIMESTAMP,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
      CONSTRAINT check_signer_role CHECK (role IN ('owner', 'witness', 'approver', 'recipient')),
      CONSTRAINT check_signer_status CHECK (status IN ('pending', 'signed', 'declined', 'expired')),
      CONSTRAINT check_signature_type CHECK (signature_type IN ('digital', 'esignature', 'manual'))
    )
  `);

  await db.execute('CREATE INDEX idx_contract_signers_org_id ON contract_signers(organization_id)');
  await db.execute('CREATE INDEX idx_contract_signers_contract_id ON contract_signers(contract_id)');
  await db.execute('CREATE INDEX idx_contract_signers_status ON contract_signers(status)');
  await db.execute('CREATE INDEX idx_contract_signers_email ON contract_signers(email)');

  // Create contract_approvals table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS contract_approvals (
      id VARCHAR(255) PRIMARY KEY,
      organization_id VARCHAR(255) NOT NULL,
      contract_id VARCHAR(255) NOT NULL,
      approver_id VARCHAR(255) NOT NULL,
      approver_name VARCHAR(255) NOT NULL,
      approver_email VARCHAR(255) NOT NULL,
      level INTEGER NOT NULL,
      required_role VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL,
      comments TEXT,
      approved_at TIMESTAMP,
      rejected_at TIMESTAMP,
      approval_token_id VARCHAR(255),
      token_expires_at TIMESTAMP,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
      CONSTRAINT check_approval_status CHECK (status IN ('pending', 'approved', 'rejected', 'escalated'))
    )
  `);

  await db.execute('CREATE INDEX idx_contract_approvals_org_id ON contract_approvals(organization_id)');
  await db.execute('CREATE INDEX idx_contract_approvals_contract_id ON contract_approvals(contract_id)');
  await db.execute('CREATE INDEX idx_contract_approvals_status ON contract_approvals(status)');
  await db.execute('CREATE INDEX idx_contract_approvals_level ON contract_approvals(level)');

  // Create contract_versions table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS contract_versions (
      id VARCHAR(255) PRIMARY KEY,
      organization_id VARCHAR(255) NOT NULL,
      contract_id VARCHAR(255) NOT NULL,
      version INTEGER NOT NULL,
      content TEXT NOT NULL,
      changes TEXT,
      created_by VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      metadata JSONB DEFAULT '{}'::jsonb,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
      UNIQUE (contract_id, version)
    )
  `);

  await db.execute('CREATE INDEX idx_contract_versions_org_id ON contract_versions(organization_id)');
  await db.execute('CREATE INDEX idx_contract_versions_contract_id ON contract_versions(contract_id)');
  await db.execute('CREATE INDEX idx_contract_versions_version ON contract_versions(version)');

  // Create contract_audit_logs table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS contract_audit_logs (
      id VARCHAR(255) PRIMARY KEY,
      organization_id VARCHAR(255) NOT NULL,
      contract_id VARCHAR(255) NOT NULL,
      event VARCHAR(50) NOT NULL,
      user_id VARCHAR(255) NOT NULL,
      user_name VARCHAR(255) NOT NULL,
      details JSONB DEFAULT '{}'::jsonb,
      ip_address VARCHAR(45),
      user_agent TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
      CONSTRAINT check_audit_event CHECK (event IN ('created', 'updated', 'sent_for_review', 'sent_for_signature', 'signed', 'approved', 'rejected', 'expired', 'terminated', 'renewed', 'archived'))
    )
  `);

  await db.execute('CREATE INDEX idx_contract_audit_logs_org_id ON contract_audit_logs(organization_id)');
  await db.execute('CREATE INDEX idx_contract_audit_logs_contract_id ON contract_audit_logs(contract_id)');
  await db.execute('CREATE INDEX idx_contract_audit_logs_event ON contract_audit_logs(event)');
  await db.execute('CREATE INDEX idx_contract_audit_logs_timestamp ON contract_audit_logs(timestamp)');
  await db.execute('CREATE INDEX idx_contract_audit_logs_user_id ON contract_audit_logs(user_id)');
}

export async function down(db: any) {
  await db.execute('DROP TABLE IF EXISTS contract_audit_logs CASCADE');
  await db.execute('DROP TABLE IF EXISTS contract_versions CASCADE');
  await db.execute('DROP TABLE IF EXISTS contract_approvals CASCADE');
  await db.execute('DROP TABLE IF EXISTS contract_signers CASCADE');
  await db.execute('DROP TABLE IF EXISTS contracts CASCADE');
  await db.execute('DROP TABLE IF EXISTS contract_templates CASCADE');
}
