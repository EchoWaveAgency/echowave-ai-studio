import { db } from '../../../platform/database/db';
import { ValidationError, NotFoundError } from '../../../platform/errors/errors';
import { EmailAccount, EmailAccountCreateInput } from '../models/index';
import * as crypto from 'crypto';

export class EmailAccountService {
  async createEmailAccount(
    organizationId: string,
    input: EmailAccountCreateInput,
    userId: string
  ): Promise<EmailAccount> {
    if (!input.name || !input.name.trim()) {
      throw new ValidationError('Account name is required', { name: 'Required' });
    }
    if (!input.email || !input.email.trim()) {
      throw new ValidationError('Email address is required', { email: 'Required' });
    }
    if (!input.provider || !['smtp', 'gmail', 'outlook', 'sendgrid'].includes(input.provider)) {
      throw new ValidationError('Invalid email provider', { provider: 'Invalid value' });
    }

    if (input.provider === 'smtp') {
      if (!input.smtpHost || !input.smtpHost.trim()) {
        throw new ValidationError('SMTP host is required for SMTP provider', { smtpHost: 'Required' });
      }
      if (!input.smtpPort) {
        throw new ValidationError('SMTP port is required for SMTP provider', { smtpPort: 'Required' });
      }
      if (!input.smtpUser || !input.smtpUser.trim()) {
        throw new ValidationError('SMTP user is required for SMTP provider', { smtpUser: 'Required' });
      }
      if (!input.smtpPassword || !input.smtpPassword.trim()) {
        throw new ValidationError('SMTP password is required for SMTP provider', { smtpPassword: 'Required' });
      }
    }

    const accountId = crypto.randomUUID();
    const isPrimary = input.isPrimary || false;

    if (isPrimary) {
      await db.query(
        `UPDATE email_accounts SET is_primary = false, updated_at = NOW()
         WHERE organization_id = $1 AND is_primary = true`,
        [organizationId]
      );
    }

    const result = await db.query(
      `
      INSERT INTO email_accounts (
        id, organization_id, name, email, provider, smtp_host, smtp_port,
        smtp_user, smtp_password, oauth_token, is_verified, is_primary,
        status, last_error_at, last_error_message, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, $11, 'inactive', null, null, NOW(), NOW())
      RETURNING *
      `,
      [
        accountId,
        organizationId,
        input.name,
        input.email,
        input.provider,
        input.smtpHost || null,
        input.smtpPort || null,
        input.smtpUser || null,
        input.smtpPassword || null,
        null,
        isPrimary,
      ]
    );

    return this.mapToEmailAccount(result.rows[0]);
  }

  async getEmailAccountById(accountId: string, organizationId: string): Promise<EmailAccount> {
    const result = await db.query(
      `SELECT * FROM email_accounts WHERE id = $1 AND organization_id = $2`,
      [accountId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Email account not found');
    }

    return this.mapToEmailAccount(result.rows[0]);
  }

  async getOrganizationEmailAccounts(organizationId: string): Promise<EmailAccount[]> {
    const result = await db.query(
      `SELECT * FROM email_accounts WHERE organization_id = $1 ORDER BY is_primary DESC, created_at ASC`,
      [organizationId]
    );

    return result.rows.map((row) => this.mapToEmailAccount(row));
  }

  async getPrimaryEmailAccount(organizationId: string): Promise<EmailAccount | null> {
    const result = await db.query(
      `SELECT * FROM email_accounts WHERE organization_id = $1 AND is_primary = true LIMIT 1`,
      [organizationId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEmailAccount(result.rows[0]);
  }

  async verifyEmailAccount(accountId: string, organizationId: string): Promise<EmailAccount> {
    const result = await db.query(
      `
      UPDATE email_accounts
      SET is_verified = true, status = 'active', updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
      `,
      [accountId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Email account not found');
    }

    return this.mapToEmailAccount(result.rows[0]);
  }

  async setPrimaryEmailAccount(accountId: string, organizationId: string): Promise<EmailAccount> {
    const account = await this.getEmailAccountById(accountId, organizationId);

    await db.query(
      `UPDATE email_accounts SET is_primary = false, updated_at = NOW()
       WHERE organization_id = $1 AND id != $2`,
      [organizationId, accountId]
    );

    const result = await db.query(
      `
      UPDATE email_accounts
      SET is_primary = true, updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
      `,
      [accountId, organizationId]
    );

    return this.mapToEmailAccount(result.rows[0]);
  }

  async recordEmailError(
    accountId: string,
    organizationId: string,
    errorMessage: string
  ): Promise<EmailAccount> {
    const result = await db.query(
      `
      UPDATE email_accounts
      SET status = 'error', last_error_message = $3, last_error_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
      `,
      [accountId, organizationId, errorMessage]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Email account not found');
    }

    return this.mapToEmailAccount(result.rows[0]);
  }

  async deleteEmailAccount(accountId: string, organizationId: string): Promise<void> {
    const result = await db.query(
      `DELETE FROM email_accounts WHERE id = $1 AND organization_id = $2`,
      [accountId, organizationId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('Email account not found');
    }
  }

  private mapToEmailAccount(row: any): EmailAccount {
    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      email: row.email,
      provider: row.provider,
      smtpHost: row.smtp_host,
      smtpPort: row.smtp_port,
      smtpUser: row.smtp_user,
      smtpPassword: row.smtp_password,
      oauthToken: row.oauth_token,
      isVerified: row.is_verified,
      isPrimary: row.is_primary,
      status: row.status,
      lastErrorAt: row.last_error_at,
      lastErrorMessage: row.last_error_message,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const emailAccountService = new EmailAccountService();
