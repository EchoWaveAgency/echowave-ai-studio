export async function up() {
  return `
    CREATE TABLE IF NOT EXISTS client_accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      company_name VARCHAR(255) NOT NULL,
      portal_url VARCHAR(255) UNIQUE,
      logo_url VARCHAR(500),
      primary_color VARCHAR(7),
      accent_color VARCHAR(7),
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      INDEX idx_org_id (organization_id),
      INDEX idx_status (status)
    );

    CREATE TABLE IF NOT EXISTS portal_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      client_account_id UUID NOT NULL,
      email VARCHAR(255) NOT NULL,
      access_level VARCHAR(50) DEFAULT 'viewer',
      last_login TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (client_account_id) REFERENCES client_accounts(id) ON DELETE CASCADE,
      INDEX idx_org_id (organization_id),
      INDEX idx_client_account_id (client_account_id),
      INDEX idx_email (email)
    );

    CREATE TABLE IF NOT EXISTS portal_permissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      portal_user_id UUID NOT NULL,
      resource_type VARCHAR(100) NOT NULL,
      resource_id UUID NOT NULL,
      permission_level VARCHAR(50) DEFAULT 'viewer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (portal_user_id) REFERENCES portal_users(id) ON DELETE CASCADE,
      INDEX idx_org_id (organization_id),
      INDEX idx_portal_user_id (portal_user_id),
      INDEX idx_resource (resource_type, resource_id)
    );

    CREATE TABLE IF NOT EXISTS notification_preferences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      portal_user_id UUID NOT NULL,
      notification_type VARCHAR(100) NOT NULL,
      frequency VARCHAR(50) DEFAULT 'instant',
      channels JSONB DEFAULT '["email", "in_app"]',
      enabled BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (portal_user_id) REFERENCES portal_users(id) ON DELETE CASCADE,
      INDEX idx_org_id (organization_id),
      INDEX idx_portal_user_id (portal_user_id)
    );

    CREATE TABLE IF NOT EXISTS client_project_views (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      client_account_id UUID NOT NULL,
      project_id UUID NOT NULL,
      project_name VARCHAR(255),
      completion_percentage DECIMAL(5,2) DEFAULT 0,
      timeline_variance INT DEFAULT 0,
      next_milestone_date DATE,
      status VARCHAR(50),
      metadata JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (client_account_id) REFERENCES client_accounts(id) ON DELETE CASCADE,
      INDEX idx_org_id (organization_id),
      INDEX idx_client_account_id (client_account_id)
    );

    CREATE TABLE IF NOT EXISTS client_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      client_account_id UUID NOT NULL,
      document_name VARCHAR(255) NOT NULL,
      document_type VARCHAR(50),
      file_url VARCHAR(500),
      version_number INT DEFAULT 1,
      digital_signature_status VARCHAR(50) DEFAULT 'pending',
      signature_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (client_account_id) REFERENCES client_accounts(id) ON DELETE CASCADE,
      INDEX idx_org_id (organization_id),
      INDEX idx_client_account_id (client_account_id)
    );

    CREATE TABLE IF NOT EXISTS client_feedback (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      client_account_id UUID NOT NULL,
      deliverable_id UUID NOT NULL,
      comment_text TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      created_by_user_id UUID,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (client_account_id) REFERENCES client_accounts(id) ON DELETE CASCADE,
      INDEX idx_org_id (organization_id),
      INDEX idx_deliverable_id (deliverable_id),
      INDEX idx_status (status)
    );

    CREATE TABLE IF NOT EXISTS client_invoices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      client_account_id UUID NOT NULL,
      invoice_number VARCHAR(100) NOT NULL UNIQUE,
      invoice_date DATE NOT NULL,
      due_date DATE NOT NULL,
      subtotal DECIMAL(12,2),
      tax DECIMAL(12,2),
      discount DECIMAL(12,2),
      total DECIMAL(12,2),
      payment_status VARCHAR(50) DEFAULT 'pending',
      viewed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (client_account_id) REFERENCES client_accounts(id) ON DELETE CASCADE,
      INDEX idx_org_id (organization_id),
      INDEX idx_client_account_id (client_account_id),
      INDEX idx_payment_status (payment_status)
    );

    CREATE TABLE IF NOT EXISTS client_activity_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      client_account_id UUID NOT NULL,
      portal_user_id UUID NOT NULL,
      action VARCHAR(100),
      resource_type VARCHAR(100),
      resource_id UUID,
      metadata JSONB,
      ip_address VARCHAR(45),
      user_agent TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (client_account_id) REFERENCES client_accounts(id) ON DELETE CASCADE,
      FOREIGN KEY (portal_user_id) REFERENCES portal_users(id) ON DELETE CASCADE,
      INDEX idx_org_id (organization_id),
      INDEX idx_client_account_id (client_account_id),
      INDEX idx_timestamp (timestamp)
    );

    CREATE TABLE IF NOT EXISTS feedback_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      client_account_id UUID NOT NULL,
      project_id UUID NOT NULL,
      deliverable_id UUID NOT NULL,
      required_participants JSONB,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (client_account_id) REFERENCES client_accounts(id) ON DELETE CASCADE,
      INDEX idx_org_id (organization_id),
      INDEX idx_status (status)
    );
  `;
}

export async function down() {
  return `
    DROP TABLE IF EXISTS feedback_requests;
    DROP TABLE IF EXISTS client_activity_logs;
    DROP TABLE IF EXISTS client_invoices;
    DROP TABLE IF EXISTS client_feedback;
    DROP TABLE IF EXISTS client_documents;
    DROP TABLE IF EXISTS client_project_views;
    DROP TABLE IF EXISTS notification_preferences;
    DROP TABLE IF EXISTS portal_permissions;
    DROP TABLE IF EXISTS portal_users;
    DROP TABLE IF EXISTS client_accounts;
  `;
}
