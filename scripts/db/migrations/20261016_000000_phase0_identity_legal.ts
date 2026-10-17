/**
 * Phase 0: Identity & Legal Domains
 *
 * This migration creates the foundational tables for user management,
 * organization isolation, and legal compliance tracking.
 *
 * Schema reference: docs/DATA_MODEL.md
 */

export const name = '20261016_000000_phase0_identity_legal';

export const up = `
  -- Organizations table (tenant isolation root)
  CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    country VARCHAR(2) DEFAULT 'EG',
    currency VARCHAR(3) DEFAULT 'EGP',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX idx_organizations_slug ON organizations(slug);

  -- Users table
  CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, email)
  );

  CREATE INDEX idx_users_organization_id ON users(organization_id);
  CREATE INDEX idx_users_email ON users(email);

  -- Roles table
  CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  INSERT INTO roles (name, description) VALUES
    ('owner', 'Organization owner with full access'),
    ('admin', 'Administrator with full access except billing'),
    ('finance', 'Finance manager with payment and journal access'),
    ('sales', 'Sales representative'),
    ('pm', 'Project manager'),
    ('creative', 'Creative team member'),
    ('support', 'Support staff'),
    ('client', 'Client portal access'),
    ('auditor', 'Auditor with read-only access');

  -- User roles junction table
  CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id, organization_id)
  );

  CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
  CREATE INDEX idx_user_roles_organization_id ON user_roles(organization_id);

  -- Legal entities table (for tax/compliance)
  CREATE TABLE legal_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(2) NOT NULL DEFAULT 'EG',
    registration_number VARCHAR(100),
    tax_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX idx_legal_entities_organization_id ON legal_entities(organization_id);

  -- Compliance tasks for tracking registration steps
  CREATE TABLE compliance_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_entity_id UUID NOT NULL REFERENCES legal_entities(id) ON DELETE CASCADE,
    task VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    due_date DATE,
    completed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX idx_compliance_tasks_legal_entity_id ON compliance_tasks(legal_entity_id);
  CREATE INDEX idx_compliance_tasks_status ON compliance_tasks(status);

  -- Audit events table (for compliance and security)
  CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    operation VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    changes JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    status VARCHAR(50) DEFAULT 'success',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX idx_audit_events_organization_id ON audit_events(organization_id);
  CREATE INDEX idx_audit_events_user_id ON audit_events(user_id);
  CREATE INDEX idx_audit_events_created_at ON audit_events(created_at);
  CREATE INDEX idx_audit_events_operation ON audit_events(operation);
`;

export const down = `
  DROP TABLE IF EXISTS audit_events;
  DROP TABLE IF EXISTS compliance_tasks;
  DROP TABLE IF EXISTS legal_entities;
  DROP TABLE IF EXISTS user_roles;
  DROP TABLE IF EXISTS roles;
  DROP TABLE IF EXISTS users;
  DROP TABLE IF EXISTS organizations;
`;
