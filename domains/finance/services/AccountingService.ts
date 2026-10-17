import { db } from '../../../platform/database/db';
import { ValidationError, NotFoundError } from '../../../platform/errors/errors';
import {
  JournalEntry,
  JournalEntryLine,
  JournalEntryCreateInput,
  Account,
  AccountCreateInput,
} from '../models/index';

export class AccountingService {
  async createAccount(
    organizationId: string,
    input: AccountCreateInput
  ): Promise<Account> {
    if (!input.accountNumber || !input.accountNumber.trim()) {
      throw new ValidationError('Account number is required', {
        accountNumber: 'Required',
      });
    }
    if (!input.name || !input.name.trim()) {
      throw new ValidationError('Account name is required', { name: 'Required' });
    }
    if (!['asset', 'liability', 'equity', 'revenue', 'expense'].includes(input.type)) {
      throw new ValidationError('Invalid account type', { type: 'Invalid value' });
    }

    // Check if account number already exists
    const existing = await db.query(
      `SELECT id FROM accounts WHERE organization_id = $1 AND account_number = $2`,
      [organizationId, input.accountNumber]
    );
    if (existing.rows.length > 0) {
      throw new ValidationError('Account number already exists', {
        accountNumber: 'Duplicate',
      });
    }

    const account = await db.query(
      `
      INSERT INTO accounts (id, organization_id, account_number, name, type, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
      RETURNING *
      `,
      [crypto.randomUUID(), organizationId, input.accountNumber, input.name, input.type]
    );

    return this.mapToAccount(account.rows[0]);
  }

  async getAccountById(accountId: string, organizationId: string): Promise<Account> {
    const result = await db.query(
      `SELECT * FROM accounts WHERE id = $1 AND organization_id = $2`,
      [accountId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Account not found');
    }

    return this.mapToAccount(result.rows[0]);
  }

  async getAccountsByType(
    organizationId: string,
    type: string,
    activeOnly: boolean = true
  ): Promise<Account[]> {
    let query = `SELECT * FROM accounts WHERE organization_id = $1 AND type = $2`;
    const params: any[] = [organizationId, type];

    if (activeOnly) {
      query += ` AND status = 'active'`;
    }

    query += ` ORDER BY account_number ASC`;

    const result = await db.query(query, params);
    return result.rows.map((row) => this.mapToAccount(row));
  }

  async getChartOfAccounts(organizationId: string): Promise<Account[]> {
    const result = await db.query(
      `SELECT * FROM accounts WHERE organization_id = $1 AND status = 'active' ORDER BY account_number ASC`,
      [organizationId]
    );

    return result.rows.map((row) => this.mapToAccount(row));
  }

  async createJournalEntry(
    organizationId: string,
    input: JournalEntryCreateInput,
    userId: string
  ): Promise<JournalEntry> {
    if (!input.entryDate) {
      throw new ValidationError('Entry date is required', { entryDate: 'Required' });
    }
    if (!input.description || !input.description.trim()) {
      throw new ValidationError('Description is required', { description: 'Required' });
    }
    if (!input.lines || input.lines.length < 2) {
      throw new ValidationError('At least 2 journal entry lines are required', {
        lines: 'Minimum 2 required',
      });
    }

    let totalDebits = 0;
    let totalCredits = 0;

    for (const line of input.lines) {
      if (!line.accountId) {
        throw new ValidationError('Account ID is required for each line', {
          accountId: 'Required',
        });
      }
      const debit = line.debitAmount || 0;
      const credit = line.creditAmount || 0;
      if (debit > 0 && credit > 0) {
        throw new ValidationError('A line cannot have both debit and credit', {
          lines: 'Invalid',
        });
      }
      totalDebits += debit;
      totalCredits += credit;
    }

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new ValidationError('Journal entry must balance (debits = credits)', {
        lines: 'Out of balance',
      });
    }

    const entryId = crypto.randomUUID();
    const entry = await db.query(
      `
      INSERT INTO journal_entries (
        id, organization_id, legal_entity_id, entry_date, description, reference, status, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7, NOW(), NOW())
      RETURNING *
      `,
      [
        entryId,
        organizationId,
        input.legalEntityId || null,
        input.entryDate,
        input.description,
        input.reference || null,
        userId,
      ]
    );

    const lines: JournalEntryLine[] = [];
    for (const line of input.lines) {
      const insertedLine = await db.query(
        `
        INSERT INTO journal_entry_lines (
          id, journal_entry_id, account_id, debit_amount, credit_amount, description, line_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        `,
        [
          crypto.randomUUID(),
          entryId,
          line.accountId,
          line.debitAmount || null,
          line.creditAmount || null,
          line.description || null,
          line.lineOrder,
        ]
      );
      lines.push(this.mapToJournalEntryLine(insertedLine.rows[0]));
    }

    return {
      id: entry.rows[0].id,
      organizationId: entry.rows[0].organization_id,
      legalEntityId: entry.rows[0].legal_entity_id,
      entryDate: entry.rows[0].entry_date,
      description: entry.rows[0].description,
      reference: entry.rows[0].reference,
      status: entry.rows[0].status,
      lines,
      postedBy: entry.rows[0].posted_by,
      postedAt: entry.rows[0].posted_at,
      createdBy: entry.rows[0].created_by,
      createdAt: entry.rows[0].created_at,
      updatedAt: entry.rows[0].updated_at,
    };
  }

  async getJournalEntryById(entryId: string, organizationId: string): Promise<JournalEntry> {
    const result = await db.query(
      `SELECT * FROM journal_entries WHERE id = $1 AND organization_id = $2`,
      [entryId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Journal entry not found');
    }

    const entry = result.rows[0];
    const linesResult = await db.query(
      `SELECT * FROM journal_entry_lines WHERE journal_entry_id = $1 ORDER BY line_order ASC`,
      [entryId]
    );

    return {
      id: entry.id,
      organizationId: entry.organization_id,
      legalEntityId: entry.legal_entity_id,
      entryDate: entry.entry_date,
      description: entry.description,
      reference: entry.reference,
      status: entry.status,
      lines: linesResult.rows.map((row) => this.mapToJournalEntryLine(row)),
      postedBy: entry.posted_by,
      postedAt: entry.posted_at,
      createdBy: entry.created_by,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at,
    };
  }

  async postJournalEntry(entryId: string, organizationId: string, userId: string): Promise<JournalEntry> {
    const entry = await this.getJournalEntryById(entryId, organizationId);

    if (entry.status === 'posted') {
      throw new ValidationError('Entry is already posted', { status: 'Already posted' });
    }

    const updated = await db.query(
      `
      UPDATE journal_entries
      SET status = 'posted', posted_by = $3, posted_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
      `,
      [entryId, organizationId, userId]
    );

    return this.getJournalEntryById(entryId, organizationId);
  }

  async getJournalEntriesByDate(
    organizationId: string,
    startDate: string,
    endDate: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<{ items: JournalEntry[]; total: number }> {
    const totalResult = await db.query(
      `SELECT COUNT(*) as count FROM journal_entries WHERE organization_id = $1 AND entry_date >= $2 AND entry_date <= $3`,
      [organizationId, startDate, endDate]
    );
    const total = totalResult.rows[0].count;

    const result = await db.query(
      `
      SELECT * FROM journal_entries
      WHERE organization_id = $1 AND entry_date >= $2 AND entry_date <= $3
      ORDER BY entry_date DESC, created_at DESC
      LIMIT $4 OFFSET $5
      `,
      [organizationId, startDate, endDate, limit, offset]
    );

    const items: JournalEntry[] = [];
    for (const row of result.rows) {
      items.push(await this.getJournalEntryById(row.id, organizationId));
    }

    return { items, total };
  }

  async calculateTrialBalance(organizationId: string): Promise<any> {
    const result = await db.query(
      `
      SELECT
        a.account_number,
        a.name,
        a.type,
        COALESCE(SUM(CASE WHEN jel.debit_amount > 0 THEN jel.debit_amount ELSE 0 END), 0) as debits,
        COALESCE(SUM(CASE WHEN jel.credit_amount > 0 THEN jel.credit_amount ELSE 0 END), 0) as credits
      FROM accounts a
      LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
      LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id AND je.status = 'posted'
      WHERE a.organization_id = $1 AND a.status = 'active'
      GROUP BY a.id, a.account_number, a.name, a.type
      HAVING COALESCE(SUM(CASE WHEN jel.debit_amount > 0 THEN jel.debit_amount ELSE 0 END), 0) != 0
         OR COALESCE(SUM(CASE WHEN jel.credit_amount > 0 THEN jel.credit_amount ELSE 0 END), 0) != 0
      ORDER BY a.account_number ASC
      `,
      [organizationId]
    );

    const trialBalance = result.rows.map((row) => ({
      accountNumber: row.account_number,
      name: row.name,
      type: row.type,
      debits: parseFloat(row.debits),
      credits: parseFloat(row.credits),
      balance: parseFloat(row.debits) - parseFloat(row.credits),
    }));

    return {
      entries: trialBalance,
      totalDebits: trialBalance.reduce((sum, entry) => sum + entry.debits, 0),
      totalCredits: trialBalance.reduce((sum, entry) => sum + entry.credits, 0),
    };
  }

  private mapToAccount(row: any): Account {
    return {
      id: row.id,
      organizationId: row.organization_id,
      accountNumber: row.account_number,
      name: row.name,
      type: row.type,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapToJournalEntryLine(row: any): JournalEntryLine {
    return {
      id: row.id,
      journalEntryId: row.journal_entry_id,
      accountId: row.account_id,
      debitAmount: row.debit_amount ? parseFloat(row.debit_amount) : undefined,
      creditAmount: row.credit_amount ? parseFloat(row.credit_amount) : undefined,
      description: row.description,
      lineOrder: row.line_order,
    };
  }
}

export const accountingService = new AccountingService();
