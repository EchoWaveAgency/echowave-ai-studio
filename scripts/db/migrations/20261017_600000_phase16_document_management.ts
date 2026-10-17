export async function up() {
  return `
    CREATE TABLE IF NOT EXISTS documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      document_name VARCHAR(255) NOT NULL,
      document_type VARCHAR(50) NOT NULL,
      status VARCHAR(50) DEFAULT 'draft',
      description TEXT,
      current_version_id UUID,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_by UUID NOT NULL,
      expires_at TIMESTAMP,
      template_id UUID,
      metadata JSONB,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      INDEX idx_org_id (organization_id),
      INDEX idx_status (status),
      INDEX idx_type (document_type)
    );

    CREATE TABLE IF NOT EXISTS document_versions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id UUID NOT NULL,
      version_number INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_by UUID NOT NULL,
      summary VARCHAR(255),
      file_url VARCHAR(500),
      file_hash VARCHAR(255),
      change_log TEXT,
      is_current_version BOOLEAN DEFAULT false,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      INDEX idx_document_id (document_id),
      UNIQUE KEY (document_id, version_number)
    );

    CREATE TABLE IF NOT EXISTS document_signatories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id UUID NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      role VARCHAR(100),
      signing_order INT,
      status VARCHAR(50) DEFAULT 'pending',
      signed_at TIMESTAMP,
      signature_image_url VARCHAR(500),
      ip_address VARCHAR(45),
      user_agent TEXT,
      rejection_reason TEXT,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      INDEX idx_document_id (document_id),
      INDEX idx_email (email)
    );

    CREATE TABLE IF NOT EXISTS document_signatures (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id UUID NOT NULL,
      signatory_id UUID NOT NULL,
      method VARCHAR(50),
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      signature_image_url VARCHAR(500),
      signature_data JSONB,
      ip_address VARCHAR(45),
      user_agent TEXT,
      validated_at TIMESTAMP,
      certificate_thumbprint VARCHAR(255),
      status VARCHAR(50) DEFAULT 'signed',
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (signatory_id) REFERENCES document_signatories(id) ON DELETE CASCADE,
      INDEX idx_document_id (document_id),
      INDEX idx_timestamp (timestamp)
    );

    CREATE TABLE IF NOT EXISTS signature_workflows (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      document_id UUID NOT NULL,
      workflow_name VARCHAR(255),
      status VARCHAR(50) DEFAULT 'pending',
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP,
      expires_at TIMESTAMP,
      escalated_at TIMESTAMP,
      escalation_reason TEXT,
      metadata JSONB,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      INDEX idx_org_id (organization_id),
      INDEX idx_status (status)
    );

    CREATE TABLE IF NOT EXISTS document_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      template_name VARCHAR(255) NOT NULL,
      document_type VARCHAR(50),
      content LONGTEXT,
      variables JSONB,
      default_signatories JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT true,
      version INT DEFAULT 1,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      INDEX idx_org_id (organization_id),
      INDEX idx_type (document_type)
    );

    CREATE TABLE IF NOT EXISTS compliance_checkpoints (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id UUID NOT NULL,
      check_type VARCHAR(100),
      check_name VARCHAR(255),
      status VARCHAR(50) DEFAULT 'pending',
      check_result JSONB,
      checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      checked_by UUID NOT NULL,
      notes TEXT,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      INDEX idx_document_id (document_id),
      INDEX idx_status (status)
    );

    CREATE TABLE IF NOT EXISTS compliance_audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      document_id UUID NOT NULL,
      action VARCHAR(100),
      action_type VARCHAR(100),
      performed_by UUID NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ip_address VARCHAR(45),
      user_agent TEXT,
      changes JSONB,
      metadata JSONB,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      INDEX idx_org_id (organization_id),
      INDEX idx_document_id (document_id),
      INDEX idx_timestamp (timestamp)
    );

    CREATE TABLE IF NOT EXISTS document_access_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id UUID NOT NULL,
      accessed_by UUID NOT NULL,
      access_type VARCHAR(50),
      access_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ip_address VARCHAR(45),
      user_agent TEXT,
      metadata JSONB,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      INDEX idx_document_id (document_id),
      INDEX idx_access_time (access_time)
    );

    CREATE TABLE IF NOT EXISTS document_sharing_links (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id UUID NOT NULL,
      created_by UUID NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL,
      token VARCHAR(255) UNIQUE NOT NULL,
      access_level VARCHAR(50),
      max_downloads INT,
      download_count INT DEFAULT 0,
      shared_with JSONB,
      password_protected BOOLEAN DEFAULT false,
      password_hash VARCHAR(255),
      is_active BOOLEAN DEFAULT true,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      INDEX idx_document_id (document_id),
      INDEX idx_token (token)
    );

    CREATE TABLE IF NOT EXISTS reminder_notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id UUID NOT NULL,
      signatory_id UUID NOT NULL,
      reminder_type VARCHAR(50),
      sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(50) DEFAULT 'sent',
      opened_at TIMESTAMP,
      channel VARCHAR(50),
      next_reminder_at TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (signatory_id) REFERENCES document_signatories(id) ON DELETE CASCADE,
      INDEX idx_document_id (document_id),
      INDEX idx_reminder_type (reminder_type)
    );

    CREATE TABLE IF NOT EXISTS document_reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      report_type VARCHAR(50),
      generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      generated_by UUID NOT NULL,
      report_data JSONB,
      format VARCHAR(20),
      file_url VARCHAR(500),
      document_count INT,
      metadata JSONB,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      INDEX idx_org_id (organization_id),
      INDEX idx_report_type (report_type)
    );
  `;
}

export async function down() {
  return `
    DROP TABLE IF EXISTS document_reports;
    DROP TABLE IF EXISTS reminder_notifications;
    DROP TABLE IF EXISTS document_sharing_links;
    DROP TABLE IF EXISTS document_access_logs;
    DROP TABLE IF EXISTS compliance_audit_logs;
    DROP TABLE IF EXISTS compliance_checkpoints;
    DROP TABLE IF EXISTS document_templates;
    DROP TABLE IF EXISTS signature_workflows;
    DROP TABLE IF EXISTS document_signatures;
    DROP TABLE IF EXISTS document_signatories;
    DROP TABLE IF EXISTS document_versions;
    DROP TABLE IF EXISTS documents;
  `;
}
