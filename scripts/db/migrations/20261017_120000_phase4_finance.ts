import { db } from '../../../platform/database/db';

export async function up() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      account_number VARCHAR(20) NOT NULL,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
      status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      UNIQUE(organization_id, account_number)
    );
  `);

  await db.query(`
    CREATE INDEX idx_accounts_org_type ON accounts(organization_id, type);
    CREATE INDEX idx_accounts_org_status ON accounts(organization_id, status);
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      legal_entity_id UUID REFERENCES legal_entities(id) ON DELETE SET NULL,
      entry_date DATE NOT NULL,
      description TEXT NOT NULL,
      reference VARCHAR(255),
      status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted')),
      posted_by UUID,
      posted_at TIMESTAMP,
      created_by UUID NOT NULL,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    );
  `);

  await db.query(`
    CREATE INDEX idx_journal_entries_org ON journal_entries(organization_id);
    CREATE INDEX idx_journal_entries_org_date ON journal_entries(organization_id, entry_date);
    CREATE INDEX idx_journal_entries_status ON journal_entries(organization_id, status);
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS journal_entry_lines (
      id UUID PRIMARY KEY,
      journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
      account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
      debit_amount NUMERIC(15, 2),
      credit_amount NUMERIC(15, 2),
      description TEXT,
      line_order INTEGER NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(journal_entry_id, line_order)
    );
  `);

  await db.query(`
    CREATE INDEX idx_journal_entry_lines_entry ON journal_entry_lines(journal_entry_id);
    CREATE INDEX idx_journal_entry_lines_account ON journal_entry_lines(account_id);
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS legal_entities (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      registration_number VARCHAR(100),
      tax_number VARCHAR(100),
      status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
      registration_date DATE,
      country_code VARCHAR(2) NOT NULL,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    );
  `);

  await db.query(`
    CREATE INDEX idx_legal_entities_org ON legal_entities(organization_id);
    CREATE INDEX idx_legal_entities_status ON legal_entities(organization_id, status);
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS tax_invoices (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      legal_entity_id UUID NOT NULL REFERENCES legal_entities(id) ON DELETE RESTRICT,
      document_id UUID,
      invoice_number VARCHAR(50) NOT NULL,
      tax_number VARCHAR(100),
      client_tax_number VARCHAR(100),
      issue_date DATE NOT NULL,
      due_date DATE NOT NULL,
      total_before_tax NUMERIC(15, 2) NOT NULL DEFAULT 0,
      tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
      total_after_tax NUMERIC(15, 2) NOT NULL DEFAULT 0,
      currency VARCHAR(3) NOT NULL DEFAULT 'EGP',
      status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'paid', 'cancelled')),
      sent_at TIMESTAMP,
      paid_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      UNIQUE(organization_id, invoice_number)
    );
  `);

  await db.query(`
    CREATE INDEX idx_tax_invoices_org ON tax_invoices(organization_id);
    CREATE INDEX idx_tax_invoices_entity ON tax_invoices(legal_entity_id);
    CREATE INDEX idx_tax_invoices_status ON tax_invoices(organization_id, status);
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS payment_sources (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL CHECK (type IN ('bank', 'cash', 'digital_wallet')),
      account_number VARCHAR(100),
      balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
      currency VARCHAR(3) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    );
  `);

  await db.query(`
    CREATE INDEX idx_payment_sources_org ON payment_sources(organization_id);
    CREATE INDEX idx_payment_sources_status ON payment_sources(organization_id, status);
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      document_id UUID,
      amount NUMERIC(15, 2) NOT NULL,
      currency VARCHAR(3) NOT NULL,
      payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('bank_transfer', 'instapay', 'wallet', 'cash', 'card')),
      payment_source_id UUID NOT NULL REFERENCES payment_sources(id) ON DELETE RESTRICT,
      status VARCHAR(50) NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'verification_pending', 'reconciled', 'disputed', 'reversed')),
      reference_number VARCHAR(255) NOT NULL,
      reported_by UUID NOT NULL,
      reported_at TIMESTAMP NOT NULL,
      verified_by UUID,
      verified_at TIMESTAMP,
      reconciliation_notes TEXT,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    );
  `);

  await db.query(`
    CREATE INDEX idx_payments_org ON payments(organization_id);
    CREATE INDEX idx_payments_status ON payments(organization_id, status);
    CREATE INDEX idx_payments_source ON payments(payment_source_id);
    CREATE INDEX idx_payments_ref ON payments(organization_id, reference_number);
  `);
}

export async function down() {
  await db.query(`DROP TABLE IF EXISTS payments;`);
  await db.query(`DROP TABLE IF EXISTS payment_sources;`);
  await db.query(`DROP TABLE IF EXISTS tax_invoices;`);
  await db.query(`DROP TABLE IF EXISTS legal_entities;`);
  await db.query(`DROP TABLE IF EXISTS journal_entry_lines;`);
  await db.query(`DROP TABLE IF EXISTS journal_entries;`);
  await db.query(`DROP TABLE IF EXISTS accounts;`);
}
