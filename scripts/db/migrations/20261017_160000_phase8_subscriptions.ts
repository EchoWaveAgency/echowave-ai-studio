import { getConnection } from '../../../platform/database/connection';

export async function up(): Promise<void> {
  const connection = await getConnection();

  // Subscription plans table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      organization_id VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      type VARCHAR(50) NOT NULL CHECK (type IN ('monthly', 'quarterly', 'annual', 'custom')),
      currency VARCHAR(3) NOT NULL CHECK (currency IN ('USD', 'EGP')),
      base_price NUMERIC(12, 2) NOT NULL,
      discount_percentage NUMERIC(5, 2),
      features JSONB DEFAULT '[]',
      max_users INTEGER,
      max_projects INTEGER,
      max_storage INTEGER,
      status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
      created_by VARCHAR(36) NOT NULL,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );
    CREATE INDEX idx_subscription_plans_org_status ON subscription_plans(organization_id, status);
    CREATE INDEX idx_subscription_plans_type ON subscription_plans(organization_id, type);
  `);

  // Customer subscriptions table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS customer_subscriptions (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      organization_id VARCHAR(36) NOT NULL,
      customer_id VARCHAR(36) NOT NULL,
      plan_id VARCHAR(36) NOT NULL,
      status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'paused', 'canceled', 'past_due', 'expired')),
      billing_cycle VARCHAR(50) NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'annual', 'custom')),
      current_period_start TIMESTAMP NOT NULL,
      current_period_end TIMESTAMP NOT NULL,
      next_billing_date TIMESTAMP,
      auto_renew BOOLEAN DEFAULT true,
      quantity INTEGER DEFAULT 1,
      unit_price NUMERIC(12, 2) NOT NULL,
      total_price NUMERIC(12, 2) NOT NULL,
      payment_method VARCHAR(100),
      canceled_at TIMESTAMP,
      cancel_reason TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT
    );
    CREATE INDEX idx_customer_subscriptions_org_status ON customer_subscriptions(organization_id, status);
    CREATE INDEX idx_customer_subscriptions_customer ON customer_subscriptions(organization_id, customer_id);
    CREATE INDEX idx_customer_subscriptions_renewal ON customer_subscriptions(organization_id, current_period_end) WHERE status = 'active' AND auto_renew = true;
  `);

  // Invoices table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      organization_id VARCHAR(36) NOT NULL,
      customer_id VARCHAR(36) NOT NULL,
      subscription_id VARCHAR(36),
      invoice_number VARCHAR(255) NOT NULL UNIQUE,
      status VARCHAR(50) NOT NULL CHECK (status IN ('draft', 'issued', 'paid', 'partially_paid', 'overdue', 'canceled')),
      issue_date TIMESTAMP NOT NULL,
      due_date TIMESTAMP NOT NULL,
      paid_date TIMESTAMP,
      currency VARCHAR(3) NOT NULL CHECK (currency IN ('USD', 'EGP')),
      subtotal NUMERIC(12, 2) NOT NULL,
      tax_amount NUMERIC(12, 2) NOT NULL,
      tax_percentage NUMERIC(5, 2) NOT NULL,
      total_amount NUMERIC(12, 2) NOT NULL,
      paid_amount NUMERIC(12, 2) DEFAULT 0,
      items JSONB NOT NULL,
      notes TEXT,
      payment_terms VARCHAR(255),
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (subscription_id) REFERENCES customer_subscriptions(id) ON DELETE SET NULL
    );
    CREATE INDEX idx_invoices_org_status ON invoices(organization_id, status);
    CREATE INDEX idx_invoices_customer ON invoices(organization_id, customer_id);
    CREATE INDEX idx_invoices_number ON invoices(organization_id, invoice_number);
    CREATE INDEX idx_invoices_due_date ON invoices(organization_id, due_date) WHERE status IN ('issued', 'partially_paid');
    CREATE INDEX idx_invoices_date_range ON invoices(organization_id, issue_date DESC);
  `);

  // Payments table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      organization_id VARCHAR(36) NOT NULL,
      customer_id VARCHAR(36) NOT NULL,
      invoice_id VARCHAR(36) NOT NULL,
      amount NUMERIC(12, 2) NOT NULL,
      currency VARCHAR(3) NOT NULL CHECK (currency IN ('USD', 'EGP')),
      payment_method VARCHAR(100) NOT NULL CHECK (payment_method IN ('credit_card', 'bank_transfer', 'check', 'stripe', 'custom')),
      transaction_id VARCHAR(255),
      status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
      paid_date TIMESTAMP,
      failure_reason TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE RESTRICT
    );
    CREATE INDEX idx_payments_org_status ON payments(organization_id, status);
    CREATE INDEX idx_payments_customer ON payments(organization_id, customer_id);
    CREATE INDEX idx_payments_invoice ON payments(invoice_id);
    CREATE INDEX idx_payments_date ON payments(organization_id, created_at DESC);
  `);

  // Usage records table for usage-based billing
  await connection.query(`
    CREATE TABLE IF NOT EXISTS usage_records (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      organization_id VARCHAR(36) NOT NULL,
      subscription_id VARCHAR(36) NOT NULL,
      metric_type VARCHAR(100) NOT NULL,
      value NUMERIC(12, 2) NOT NULL,
      recorded_at TIMESTAMP NOT NULL,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (subscription_id) REFERENCES customer_subscriptions(id) ON DELETE CASCADE
    );
    CREATE INDEX idx_usage_records_org_subscription ON usage_records(organization_id, subscription_id);
    CREATE INDEX idx_usage_records_metric ON usage_records(subscription_id, metric_type, recorded_at DESC);
  `);

  // Billing cycles table for tracking renewal periods
  await connection.query(`
    CREATE TABLE IF NOT EXISTS billing_cycles (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      organization_id VARCHAR(36) NOT NULL,
      subscription_id VARCHAR(36) NOT NULL,
      cycle_number INTEGER NOT NULL,
      start_date TIMESTAMP NOT NULL,
      end_date TIMESTAMP NOT NULL,
      invoice_id VARCHAR(36),
      status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'billed', 'paid', 'failed', 'canceled')),
      amount NUMERIC(12, 2) NOT NULL,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (subscription_id) REFERENCES customer_subscriptions(id) ON DELETE CASCADE,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
    );
    CREATE INDEX idx_billing_cycles_org_subscription ON billing_cycles(organization_id, subscription_id);
    CREATE INDEX idx_billing_cycles_status ON billing_cycles(organization_id, status);
    CREATE UNIQUE INDEX idx_billing_cycles_unique ON billing_cycles(subscription_id, cycle_number);
  `);
}

export async function down(): Promise<void> {
  const connection = await getConnection();

  await connection.query('DROP TABLE IF EXISTS billing_cycles CASCADE');
  await connection.query('DROP TABLE IF EXISTS usage_records CASCADE');
  await connection.query('DROP TABLE IF EXISTS payments CASCADE');
  await connection.query('DROP TABLE IF EXISTS invoices CASCADE');
  await connection.query('DROP TABLE IF EXISTS customer_subscriptions CASCADE');
  await connection.query('DROP TABLE IF EXISTS subscription_plans CASCADE');
}
