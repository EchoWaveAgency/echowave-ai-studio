import { db } from '../../../platform/database/db';
import { ValidationError, NotFoundError } from '../../../platform/errors/errors';
import {
  TaxInvoice,
  TaxInvoiceCreateInput,
  LegalEntity,
  LegalEntityCreateInput,
} from '../models/index';

export class TaxService {
  async createLegalEntity(
    organizationId: string,
    input: LegalEntityCreateInput
  ): Promise<LegalEntity> {
    if (!input.name || !input.name.trim()) {
      throw new ValidationError('Legal entity name is required', { name: 'Required' });
    }
    if (!input.countryCode || !input.countryCode.trim()) {
      throw new ValidationError('Country code is required', { countryCode: 'Required' });
    }

    const entityId = crypto.randomUUID();
    const result = await db.query(
      `
      INSERT INTO legal_entities (
        id, organization_id, name, registration_number, tax_number, status, registration_date, country_code, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, NOW(), NOW())
      RETURNING *
      `,
      [
        entityId,
        organizationId,
        input.name,
        input.registrationNumber || null,
        input.taxNumber || null,
        input.registrationDate || null,
        input.countryCode,
      ]
    );

    return this.mapToLegalEntity(result.rows[0]);
  }

  async getLegalEntityById(entityId: string, organizationId: string): Promise<LegalEntity> {
    const result = await db.query(
      `SELECT * FROM legal_entities WHERE id = $1 AND organization_id = $2`,
      [entityId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Legal entity not found');
    }

    return this.mapToLegalEntity(result.rows[0]);
  }

  async getOrganizationLegalEntities(
    organizationId: string,
    activeOnly: boolean = false
  ): Promise<LegalEntity[]> {
    let query = `SELECT * FROM legal_entities WHERE organization_id = $1`;
    const params: any[] = [organizationId];

    if (activeOnly) {
      query += ` AND status = 'active'`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await db.query(query, params);
    return result.rows.map((row) => this.mapToLegalEntity(row));
  }

  async updateLegalEntity(
    entityId: string,
    organizationId: string,
    updates: {
      registrationNumber?: string;
      taxNumber?: string;
      status?: string;
      registrationDate?: string;
    }
  ): Promise<LegalEntity> {
    const entity = await this.getLegalEntityById(entityId, organizationId);

    if (updates.status && !['pending', 'active', 'inactive'].includes(updates.status)) {
      throw new ValidationError('Invalid legal entity status', { status: 'Invalid value' });
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.registrationNumber !== undefined) {
      fields.push(`registration_number = $${paramIndex}`);
      values.push(updates.registrationNumber || null);
      paramIndex++;
    }
    if (updates.taxNumber !== undefined) {
      fields.push(`tax_number = $${paramIndex}`);
      values.push(updates.taxNumber || null);
      paramIndex++;
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${paramIndex}`);
      values.push(updates.status);
      paramIndex++;
    }
    if (updates.registrationDate !== undefined) {
      fields.push(`registration_date = $${paramIndex}`);
      values.push(updates.registrationDate || null);
      paramIndex++;
    }

    if (fields.length === 0) {
      return entity;
    }

    fields.push(`updated_at = NOW()`);
    values.push(entityId, organizationId);

    const query = `UPDATE legal_entities SET ${fields.join(', ')} WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1} RETURNING *`;
    const result = await db.query(query, values);

    return this.mapToLegalEntity(result.rows[0]);
  }

  async issueTaxInvoice(
    organizationId: string,
    legalEntityId: string,
    input: TaxInvoiceCreateInput,
    userId: string
  ): Promise<TaxInvoice> {
    const entity = await this.getLegalEntityById(legalEntityId, organizationId);

    if (entity.status !== 'active') {
      throw new ValidationError('Legal entity is not active', { legalEntityId: 'Inactive' });
    }

    if (!input.issueDate || !input.dueDate) {
      throw new ValidationError('Issue date and due date are required', {
        issueDate: 'Required',
        dueDate: 'Required',
      });
    }

    if (input.issueDate > input.dueDate) {
      throw new ValidationError('Issue date must be before due date', { issueDate: 'Invalid' });
    }

    const invoiceId = crypto.randomUUID();
    const invoiceNumber = await this.generateInvoiceNumber(organizationId);

    const result = await db.query(
      `
      INSERT INTO tax_invoices (
        id, organization_id, legal_entity_id, document_id, invoice_number, tax_number, client_tax_number,
        issue_date, due_date, total_before_tax, tax_amount, total_after_tax, currency, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'draft', NOW(), NOW())
      RETURNING *
      `,
      [
        invoiceId,
        organizationId,
        legalEntityId,
        input.documentId || null,
        invoiceNumber,
        entity.taxNumber,
        input.clientTaxNumber || null,
        input.issueDate,
        input.dueDate,
        0,
        0,
        0,
        'EGP',
      ]
    );

    return this.mapToTaxInvoice(result.rows[0]);
  }

  async getTaxInvoiceById(invoiceId: string, organizationId: string): Promise<TaxInvoice> {
    const result = await db.query(
      `SELECT * FROM tax_invoices WHERE id = $1 AND organization_id = $2`,
      [invoiceId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Tax invoice not found');
    }

    return this.mapToTaxInvoice(result.rows[0]);
  }

  async getTaxInvoicesByEntity(
    legalEntityId: string,
    organizationId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<{ items: TaxInvoice[]; total: number }> {
    const totalResult = await db.query(
      `SELECT COUNT(*) as count FROM tax_invoices WHERE legal_entity_id = $1 AND organization_id = $2`,
      [legalEntityId, organizationId]
    );
    const total = totalResult.rows[0].count;

    const result = await db.query(
      `
      SELECT * FROM tax_invoices
      WHERE legal_entity_id = $1 AND organization_id = $2
      ORDER BY issue_date DESC, created_at DESC
      LIMIT $3 OFFSET $4
      `,
      [legalEntityId, organizationId, limit, offset]
    );

    return {
      items: result.rows.map((row) => this.mapToTaxInvoice(row)),
      total,
    };
  }

  async updateTaxInvoiceAmounts(
    invoiceId: string,
    organizationId: string,
    totalBeforeTax: number,
    taxAmount: number
  ): Promise<TaxInvoice> {
    const invoice = await this.getTaxInvoiceById(invoiceId, organizationId);

    if (invoice.status !== 'draft') {
      throw new ValidationError('Can only update amounts for draft invoices', {
        status: 'Not draft',
      });
    }

    if (totalBeforeTax < 0 || taxAmount < 0) {
      throw new ValidationError('Amounts must be non-negative', {
        totalBeforeTax: 'Invalid',
        taxAmount: 'Invalid',
      });
    }

    const totalAfterTax = totalBeforeTax + taxAmount;

    const result = await db.query(
      `
      UPDATE tax_invoices
      SET total_before_tax = $3, tax_amount = $4, total_after_tax = $5, updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
      `,
      [invoiceId, organizationId, totalBeforeTax, taxAmount, totalAfterTax]
    );

    return this.mapToTaxInvoice(result.rows[0]);
  }

  async issueTaxInvoice_Finalize(
    invoiceId: string,
    organizationId: string
  ): Promise<TaxInvoice> {
    const invoice = await this.getTaxInvoiceById(invoiceId, organizationId);

    if (invoice.status !== 'draft') {
      throw new ValidationError('Only draft invoices can be issued', { status: 'Not draft' });
    }

    if (invoice.totalAfterTax <= 0) {
      throw new ValidationError('Invoice total must be greater than zero', {
        totalAfterTax: 'Invalid',
      });
    }

    const result = await db.query(
      `
      UPDATE tax_invoices
      SET status = 'issued', sent_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
      `,
      [invoiceId, organizationId]
    );

    return this.mapToTaxInvoice(result.rows[0]);
  }

  async recordTaxInvoicePayment(
    invoiceId: string,
    organizationId: string
  ): Promise<TaxInvoice> {
    const invoice = await this.getTaxInvoiceById(invoiceId, organizationId);

    if (invoice.status === 'paid') {
      throw new ValidationError('Invoice is already paid', { status: 'Already paid' });
    }

    if (invoice.status !== 'issued') {
      throw new ValidationError('Only issued invoices can be marked as paid', {
        status: 'Not issued',
      });
    }

    const result = await db.query(
      `
      UPDATE tax_invoices
      SET status = 'paid', paid_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
      `,
      [invoiceId, organizationId]
    );

    return this.mapToTaxInvoice(result.rows[0]);
  }

  async cancelTaxInvoice(
    invoiceId: string,
    organizationId: string
  ): Promise<TaxInvoice> {
    const invoice = await this.getTaxInvoiceById(invoiceId, organizationId);

    if (invoice.status === 'cancelled') {
      throw new ValidationError('Invoice is already cancelled', { status: 'Already cancelled' });
    }

    const result = await db.query(
      `
      UPDATE tax_invoices
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
      `,
      [invoiceId, organizationId]
    );

    return this.mapToTaxInvoice(result.rows[0]);
  }

  private async generateInvoiceNumber(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    const result = await db.query(
      `
      SELECT COUNT(*) as count FROM tax_invoices
      WHERE organization_id = $1 AND invoice_number LIKE $2
      `,
      [organizationId, `${year}-${month}-%`]
    );

    const count = (result.rows[0].count || 0) + 1;
    return `${year}-${month}-${String(count).padStart(5, '0')}`;
  }

  private mapToLegalEntity(row: any): LegalEntity {
    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      registrationNumber: row.registration_number,
      taxNumber: row.tax_number,
      status: row.status,
      registrationDate: row.registration_date,
      countryCode: row.country_code,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapToTaxInvoice(row: any): TaxInvoice {
    return {
      id: row.id,
      organizationId: row.organization_id,
      legalEntityId: row.legal_entity_id,
      documentId: row.document_id,
      invoiceNumber: row.invoice_number,
      taxNumber: row.tax_number,
      clientTaxNumber: row.client_tax_number,
      issueDate: row.issue_date,
      dueDate: row.due_date,
      totalBeforeTax: parseFloat(row.total_before_tax),
      taxAmount: parseFloat(row.tax_amount),
      totalAfterTax: parseFloat(row.total_after_tax),
      currency: row.currency,
      status: row.status,
      sentAt: row.sent_at,
      paidAt: row.paid_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const taxService = new TaxService();
