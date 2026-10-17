export async function up(client: any): Promise<void> {
  // WhatsApp tables
  await client.query(`
    CREATE TABLE IF NOT EXISTS whatsapp_conversations (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL,
      contact_phone VARCHAR(20) NOT NULL,
      contact_name VARCHAR(255),
      status VARCHAR(50) DEFAULT 'ACTIVE',
      last_message_at TIMESTAMP NOT NULL,
      message_count INTEGER DEFAULT 0,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      metadata JSONB,
      CONSTRAINT fk_whatsapp_conversations_org FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      INDEX idx_org_id (organization_id),
      UNIQUE(organization_id, contact_phone)
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS whatsapp_messages (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL,
      conversation_id UUID NOT NULL,
      contact_phone VARCHAR(20) NOT NULL,
      message_type VARCHAR(50) NOT NULL,
      content TEXT NOT NULL,
      status VARCHAR(50) DEFAULT 'PENDING',
      external_message_id VARCHAR(255),
      template_name VARCHAR(255),
      media_url TEXT,
      media_id VARCHAR(255),
      sent_at TIMESTAMP NOT NULL,
      delivered_at TIMESTAMP,
      read_at TIMESTAMP,
      failure_reason TEXT,
      metadata JSONB,
      CONSTRAINT fk_whatsapp_messages_org FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      CONSTRAINT fk_whatsapp_messages_conv FOREIGN KEY(conversation_id) REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
      INDEX idx_org_id (organization_id),
      INDEX idx_conv_id (conversation_id),
      INDEX idx_status (status)
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS whatsapp_templates (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL,
      template_name VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      variables TEXT[] DEFAULT ARRAY[]::TEXT[],
      category VARCHAR(50) DEFAULT 'MARKETING',
      language VARCHAR(10) DEFAULT 'en',
      status VARCHAR(50) DEFAULT 'PENDING_REVIEW',
      external_template_id VARCHAR(255),
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      CONSTRAINT fk_whatsapp_templates_org FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      INDEX idx_org_id (organization_id),
      UNIQUE(organization_id, template_name)
    )
  `);

  // Telegram tables
  await client.query(`
    CREATE TABLE IF NOT EXISTS telegram_bots (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL,
      bot_name VARCHAR(255) NOT NULL,
      bot_token VARCHAR(255) NOT NULL,
      bot_username VARCHAR(255) NOT NULL,
      webhook_url TEXT NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      last_update_id INTEGER DEFAULT 0,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      CONSTRAINT fk_telegram_bots_org FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      INDEX idx_org_id (organization_id),
      UNIQUE(organization_id, bot_username)
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS telegram_messages (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL,
      chat_id VARCHAR(255) NOT NULL,
      user_id VARCHAR(255) NOT NULL,
      user_username VARCHAR(255),
      message_type VARCHAR(50) NOT NULL,
      content TEXT NOT NULL,
      external_message_id VARCHAR(255) NOT NULL,
      sent_at TIMESTAMP NOT NULL,
      edited_at TIMESTAMP,
      reply_to_message_id VARCHAR(255),
      metadata JSONB,
      CONSTRAINT fk_telegram_messages_org FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      INDEX idx_org_id (organization_id),
      INDEX idx_chat_id (chat_id),
      INDEX idx_user_id (user_id)
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS telegram_updates (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL,
      bot_id UUID NOT NULL,
      update_id INTEGER NOT NULL,
      update_type VARCHAR(50) NOT NULL,
      chat_id VARCHAR(255) NOT NULL,
      user_id VARCHAR(255) NOT NULL,
      user_username VARCHAR(255),
      message_text TEXT,
      callback_data TEXT,
      processed_at TIMESTAMP NOT NULL,
      processed_by VARCHAR(255),
      metadata JSONB,
      CONSTRAINT fk_telegram_updates_org FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      CONSTRAINT fk_telegram_updates_bot FOREIGN KEY(bot_id) REFERENCES telegram_bots(id) ON DELETE CASCADE,
      INDEX idx_org_id (organization_id),
      INDEX idx_bot_id (bot_id),
      INDEX idx_chat_id (chat_id)
    )
  `);

  // Email tables
  await client.query(`
    CREATE TABLE IF NOT EXISTS email_campaigns (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL,
      campaign_name VARCHAR(255) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      from_email VARCHAR(255) NOT NULL,
      from_name VARCHAR(255),
      content TEXT NOT NULL,
      template_id UUID,
      recipient_count INTEGER DEFAULT 0,
      sent_count INTEGER DEFAULT 0,
      opened_count INTEGER DEFAULT 0,
      clicked_count INTEGER DEFAULT 0,
      bounced_count INTEGER DEFAULT 0,
      status VARCHAR(50) DEFAULT 'DRAFT',
      scheduled_at TIMESTAMP,
      sent_at TIMESTAMP,
      created_by VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      metadata JSONB,
      CONSTRAINT fk_email_campaigns_org FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      INDEX idx_org_id (organization_id),
      INDEX idx_status (status)
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS email_messages (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL,
      campaign_id UUID,
      recipient_email VARCHAR(255) NOT NULL,
      recipient_name VARCHAR(255),
      subject VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      status VARCHAR(50) DEFAULT 'PENDING',
      sent_at TIMESTAMP NOT NULL,
      opened_at TIMESTAMP,
      clicked_at TIMESTAMP,
      bounced_at TIMESTAMP,
      bounce_type VARCHAR(20),
      external_id VARCHAR(255),
      metadata JSONB,
      CONSTRAINT fk_email_messages_org FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      CONSTRAINT fk_email_messages_campaign FOREIGN KEY(campaign_id) REFERENCES email_campaigns(id) ON DELETE SET NULL,
      INDEX idx_org_id (organization_id),
      INDEX idx_campaign_id (campaign_id),
      INDEX idx_status (status)
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS email_templates (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL,
      template_name VARCHAR(255) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      variables TEXT[] DEFAULT ARRAY[]::TEXT[],
      category VARCHAR(50) DEFAULT 'MARKETING',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      CONSTRAINT fk_email_templates_org FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      INDEX idx_org_id (organization_id),
      UNIQUE(organization_id, template_name)
    )
  `);

  // Payment tables
  await client.query(`
    CREATE TABLE IF NOT EXISTS payment_records (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL,
      document_id UUID,
      invoice_id UUID,
      amount NUMERIC(12,2) NOT NULL,
      currency VARCHAR(3) NOT NULL,
      gateway_type VARCHAR(50) NOT NULL,
      status VARCHAR(50) DEFAULT 'PENDING',
      external_transaction_id VARCHAR(255) NOT NULL,
      payment_method_id UUID,
      description TEXT NOT NULL,
      authorized_at TIMESTAMP,
      captured_at TIMESTAMP,
      refunded_at TIMESTAMP,
      failed_at TIMESTAMP,
      failure_reason TEXT,
      metadata JSONB,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      CONSTRAINT fk_payment_records_org FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      INDEX idx_org_id (organization_id),
      INDEX idx_status (status),
      UNIQUE(organization_id, external_transaction_id)
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS payment_methods (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL,
      method_type VARCHAR(50) NOT NULL,
      display_name VARCHAR(255) NOT NULL,
      last_4_digits VARCHAR(4),
      expiry_date TIMESTAMP,
      card_brand VARCHAR(50),
      is_default BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      CONSTRAINT fk_payment_methods_org FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      INDEX idx_org_id (organization_id),
      INDEX idx_is_default (is_default)
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS payment_gateway_configs (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL,
      gateway_type VARCHAR(50) NOT NULL,
      api_key VARCHAR(500) NOT NULL,
      api_secret VARCHAR(500),
      webhook_secret VARCHAR(500),
      is_active BOOLEAN DEFAULT TRUE,
      supported_currencies TEXT[] DEFAULT ARRAY[]::TEXT[],
      supported_methods TEXT[] DEFAULT ARRAY[]::TEXT[],
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      CONSTRAINT fk_payment_gw_configs_org FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      INDEX idx_org_id (organization_id),
      UNIQUE(organization_id, gateway_type)
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS payment_reconciliations (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL,
      statement_date TIMESTAMP NOT NULL,
      gateway_type VARCHAR(50) NOT NULL,
      total_transactions INTEGER DEFAULT 0,
      total_amount NUMERIC(12,2) DEFAULT 0,
      reconciled INTEGER DEFAULT 0,
      discrepancies INTEGER DEFAULT 0,
      status VARCHAR(50) DEFAULT 'PENDING',
      discrepancy_details JSONB,
      completed_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL,
      CONSTRAINT fk_payment_reconciliations_org FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      INDEX idx_org_id (organization_id),
      INDEX idx_status (status)
    )
  `);

  // Webhook tables
  await client.query(`
    CREATE TABLE IF NOT EXISTS webhook_subscriptions (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL,
      event_type VARCHAR(100) NOT NULL,
      target_url TEXT NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      retry_count INTEGER DEFAULT 0,
      max_retries INTEGER DEFAULT 5,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      CONSTRAINT fk_webhook_subscriptions_org FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      INDEX idx_org_id (organization_id),
      INDEX idx_event_type (event_type)
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS webhook_events (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL,
      subscription_id UUID NOT NULL,
      event_type VARCHAR(100) NOT NULL,
      payload JSONB NOT NULL,
      status VARCHAR(50) DEFAULT 'PENDING',
      retry_count INTEGER DEFAULT 0,
      last_retry_at TIMESTAMP,
      next_retry_at TIMESTAMP,
      failure_reason TEXT,
      sent_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL,
      CONSTRAINT fk_webhook_events_org FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      CONSTRAINT fk_webhook_events_sub FOREIGN KEY(subscription_id) REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
      INDEX idx_org_id (organization_id),
      INDEX idx_status (status)
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS webhook_logs (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL,
      event_id UUID NOT NULL,
      subscription_id UUID NOT NULL,
      target_url TEXT NOT NULL,
      method VARCHAR(10) NOT NULL,
      status_code INTEGER NOT NULL,
      response_body TEXT,
      sent_at TIMESTAMP NOT NULL,
      CONSTRAINT fk_webhook_logs_org FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      CONSTRAINT fk_webhook_logs_event FOREIGN KEY(event_id) REFERENCES webhook_events(id) ON DELETE CASCADE,
      INDEX idx_org_id (organization_id),
      INDEX idx_event_id (event_id)
    )
  `);
}

export async function down(client: any): Promise<void> {
  await client.query('DROP TABLE IF EXISTS webhook_logs CASCADE');
  await client.query('DROP TABLE IF EXISTS webhook_events CASCADE');
  await client.query('DROP TABLE IF EXISTS webhook_subscriptions CASCADE');
  await client.query('DROP TABLE IF EXISTS payment_reconciliations CASCADE');
  await client.query('DROP TABLE IF EXISTS payment_gateway_configs CASCADE');
  await client.query('DROP TABLE IF EXISTS payment_methods CASCADE');
  await client.query('DROP TABLE IF EXISTS payment_records CASCADE');
  await client.query('DROP TABLE IF EXISTS email_templates CASCADE');
  await client.query('DROP TABLE IF EXISTS email_messages CASCADE');
  await client.query('DROP TABLE IF EXISTS email_campaigns CASCADE');
  await client.query('DROP TABLE IF EXISTS telegram_updates CASCADE');
  await client.query('DROP TABLE IF EXISTS telegram_messages CASCADE');
  await client.query('DROP TABLE IF EXISTS telegram_bots CASCADE');
  await client.query('DROP TABLE IF EXISTS whatsapp_templates CASCADE');
  await client.query('DROP TABLE IF EXISTS whatsapp_messages CASCADE');
  await client.query('DROP TABLE IF EXISTS whatsapp_conversations CASCADE');
}
