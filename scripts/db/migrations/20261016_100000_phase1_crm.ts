// Phase 1 CRM Domain Migration
// Adds tables for leads, contacts, opportunities, and communication history

export async function up(client: any) {
  // Leads table
  await client.query(`
    CREATE TABLE leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      message TEXT,
      service_interest VARCHAR(255),
      status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'rejected')),
      source VARCHAR(50) NOT NULL DEFAULT 'website' CHECK (source IN ('website', 'referral', 'email', 'phone', 'other')),
      score INTEGER,
      notes TEXT,
      contact_id UUID REFERENCES contacts(id),
      opportunity_id UUID REFERENCES opportunities(id),
      last_contacted_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await client.query(`CREATE INDEX idx_leads_org_id ON leads(organization_id)`);
  await client.query(`CREATE INDEX idx_leads_status ON leads(status)`);
  await client.query(`CREATE INDEX idx_leads_email ON leads(email)`);

  // Contacts table
  await client.query(`
    CREATE TABLE contacts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id),
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(20),
      address TEXT,
      city VARCHAR(100),
      country VARCHAR(100),
      postal_code VARCHAR(20),
      notes TEXT,
      consent_marketing BOOLEAN DEFAULT false,
      consent_phone BOOLEAN DEFAULT false,
      consent_email BOOLEAN DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await client.query(`CREATE INDEX idx_contacts_org_id ON contacts(organization_id)`);
  await client.query(`CREATE INDEX idx_contacts_email ON contacts(email)`);
  await client.query(`CREATE INDEX idx_contacts_full_name ON contacts(first_name, last_name)`);

  // Opportunities table
  await client.query(`
    CREATE TABLE opportunities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id),
      lead_id UUID NOT NULL REFERENCES leads(id),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      value DECIMAL(15, 2),
      currency VARCHAR(10) NOT NULL DEFAULT 'EGP',
      stage VARCHAR(50) NOT NULL DEFAULT 'prospect' CHECK (stage IN ('prospect', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
      expected_close_date DATE,
      probability INTEGER DEFAULT 0,
      closed_date TIMESTAMP,
      closed_reason VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await client.query(`CREATE INDEX idx_opportunities_org_id ON opportunities(organization_id)`);
  await client.query(`CREATE INDEX idx_opportunities_lead_id ON opportunities(lead_id)`);
  await client.query(`CREATE INDEX idx_opportunities_stage ON opportunities(stage)`);

  // Opportunity history table
  await client.query(`
    CREATE TABLE opportunity_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      opportunity_id UUID NOT NULL REFERENCES opportunities(id),
      stage VARCHAR(50) NOT NULL,
      changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      changed_by UUID,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await client.query(`CREATE INDEX idx_opportunity_history_opp_id ON opportunity_history(opportunity_id)`);

  // Communications table
  await client.query(`
    CREATE TABLE communications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id),
      contact_id UUID NOT NULL REFERENCES contacts(id),
      type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'phone', 'sms', 'whatsapp', 'in_person', 'note')),
      subject VARCHAR(255),
      body TEXT,
      direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
      status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'logged')),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await client.query(`CREATE INDEX idx_communications_org_id ON communications(organization_id)`);
  await client.query(`CREATE INDEX idx_communications_contact_id ON communications(contact_id)`);
  await client.query(`CREATE INDEX idx_communications_type ON communications(type)`);
}

export async function down(client: any) {
  await client.query(`DROP TABLE IF EXISTS communications CASCADE`);
  await client.query(`DROP TABLE IF EXISTS opportunity_history CASCADE`);
  await client.query(`DROP TABLE IF EXISTS opportunities CASCADE`);
  await client.query(`DROP TABLE IF EXISTS contacts CASCADE`);
  await client.query(`DROP TABLE IF EXISTS leads CASCADE`);
}
