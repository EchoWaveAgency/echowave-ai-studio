import { db } from '../../../platform/database/db';

export const up = async () => {
  // Contact Channels table
  await db.query(`
    CREATE TABLE IF NOT EXISTS contact_channels (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      contact_id UUID NOT NULL,
      type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'phone', 'whatsapp', 'telegram', 'linkedin', 'twitter')),
      value TEXT NOT NULL,
      is_verified BOOLEAN NOT NULL DEFAULT false,
      verified_at TIMESTAMP WITH TIME ZONE,
      is_primary BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_contact_channels_org_id ON contact_channels(organization_id);
    CREATE INDEX idx_contact_channels_contact_org ON contact_channels(contact_id, organization_id);
    CREATE INDEX idx_contact_channels_type_org ON contact_channels(organization_id, type);
  `);

  // Messages table
  await db.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      to_contact_id UUID NOT NULL,
      from_contact_id UUID,
      channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'whatsapp', 'telegram', 'sms')),
      subject TEXT,
      body TEXT NOT NULL,
      status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'scheduled', 'sent', 'delivered', 'failed', 'bounced'))
        DEFAULT 'draft',
      direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')) DEFAULT 'outbound',
      external_id TEXT,
      scheduled_at TIMESTAMP WITH TIME ZONE,
      sent_at TIMESTAMP WITH TIME ZONE,
      delivered_at TIMESTAMP WITH TIME ZONE,
      failure_reason TEXT,
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_by UUID,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_messages_org_id ON messages(organization_id);
    CREATE INDEX idx_messages_to_contact ON messages(to_contact_id, organization_id);
    CREATE INDEX idx_messages_from_contact ON messages(from_contact_id, organization_id);
    CREATE INDEX idx_messages_status ON messages(organization_id, status);
  `);

  // Message Templates table
  await db.query(`
    CREATE TABLE IF NOT EXISTS message_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'whatsapp', 'telegram', 'sms')),
      subject TEXT,
      body TEXT NOT NULL,
      variables JSONB NOT NULL DEFAULT '[]'::jsonb,
      category VARCHAR(20) NOT NULL CHECK (category IN ('sales', 'support', 'marketing', 'notification', 'other')),
      status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
      created_by UUID,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_message_templates_org_id ON message_templates(organization_id);
    CREATE INDEX idx_message_templates_status ON message_templates(organization_id, status);
    CREATE INDEX idx_message_templates_channel ON message_templates(organization_id, channel);
  `);

  // Communication Preferences table
  await db.query(`
    CREATE TABLE IF NOT EXISTS communication_preferences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      contact_id UUID NOT NULL,
      channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'whatsapp', 'telegram', 'sms')),
      is_opted_in BOOLEAN NOT NULL DEFAULT true,
      frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('realtime', 'daily', 'weekly', 'monthly', 'never'))
        DEFAULT 'realtime',
      categories JSONB NOT NULL DEFAULT '[]'::jsonb,
      unsubscribe_token TEXT NOT NULL UNIQUE,
      unsubscribed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_communication_preferences_org_id ON communication_preferences(organization_id);
    CREATE INDEX idx_communication_preferences_contact ON communication_preferences(contact_id, organization_id);
    CREATE INDEX idx_communication_preferences_token ON communication_preferences(unsubscribe_token);
  `);

  // Email Accounts table
  await db.query(`
    CREATE TABLE IF NOT EXISTS email_accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      provider VARCHAR(20) NOT NULL CHECK (provider IN ('smtp', 'gmail', 'outlook', 'sendgrid')),
      smtp_host TEXT,
      smtp_port INTEGER,
      smtp_user TEXT,
      smtp_password TEXT,
      oauth_token TEXT,
      is_verified BOOLEAN NOT NULL DEFAULT false,
      is_primary BOOLEAN NOT NULL DEFAULT false,
      status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'inactive', 'error')) DEFAULT 'inactive',
      last_error_at TIMESTAMP WITH TIME ZONE,
      last_error_message TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_email_accounts_org_id ON email_accounts(organization_id);
    CREATE INDEX idx_email_accounts_primary ON email_accounts(organization_id, is_primary);
    CREATE INDEX idx_email_accounts_status ON email_accounts(organization_id, status);
  `);

  // Notifications table
  await db.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      user_id UUID NOT NULL,
      type VARCHAR(20) NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      action_url TEXT,
      is_read BOOLEAN NOT NULL DEFAULT false,
      read_at TIMESTAMP WITH TIME ZONE,
      expires_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_notifications_org_id ON notifications(organization_id);
    CREATE INDEX idx_notifications_user ON notifications(user_id, organization_id);
    CREATE INDEX idx_notifications_is_read ON notifications(organization_id, is_read);
  `);

  // Message Logs table (audit trail)
  await db.query(`
    CREATE TABLE IF NOT EXISTS message_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      message_id UUID NOT NULL,
      event VARCHAR(20) NOT NULL CHECK (event IN ('created', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked')),
      timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      details JSONB NOT NULL DEFAULT '{}'::jsonb
    );

    CREATE INDEX idx_message_logs_org_id ON message_logs(organization_id);
    CREATE INDEX idx_message_logs_message ON message_logs(message_id, organization_id);
    CREATE INDEX idx_message_logs_event ON message_logs(organization_id, event);
    CREATE INDEX idx_message_logs_timestamp ON message_logs(organization_id, timestamp);
  `);
};

export const down = async () => {
  await db.query(`DROP TABLE IF EXISTS message_logs CASCADE;`);
  await db.query(`DROP TABLE IF EXISTS notifications CASCADE;`);
  await db.query(`DROP TABLE IF EXISTS email_accounts CASCADE;`);
  await db.query(`DROP TABLE IF EXISTS communication_preferences CASCADE;`);
  await db.query(`DROP TABLE IF EXISTS message_templates CASCADE;`);
  await db.query(`DROP TABLE IF EXISTS messages CASCADE;`);
  await db.query(`DROP TABLE IF EXISTS contact_channels CASCADE;`);
};
