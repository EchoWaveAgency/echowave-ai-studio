import { getConnection } from '../../../platform/database/connection';
import { ValidationError, NotFoundError } from '../../../platform/errors/errors';
import { Invoice, InvoiceCreateInput, INVOICE_STATUSES, CURRENCIES } from '../models/index';

const EGYPTIAN_TAX_RATE = 0.14; // 14% VAT for Egypt
const DEFAULT_TAX_RATE = 0.0;

export const invoiceService = {
  async createInvoice(organizationId: string, input: InvoiceCreateInput, taxRate: number = EGYPTIAN_TAX_RATE): Promise<Invoice> {
    if (!input.customerId?.trim()) {
      throw new ValidationError('Customer ID is required');
    }
    if (!input.items || input.items.length === 0) {
      throw new ValidationError('At least one invoice item is required');
    }

    const invoiceNumber = await this.generateInvoiceNumber(organizationId);
    const now = new Date();
    const issueDate = input.issueDate ? new Date(input.issueDate) : now;
    const dueDate = input.dueDate ? new Date(input.dueDate) : new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const items = input.items.map((item) => ({
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.quantity * item.unitPrice,
      taxable: item.taxable !== false,
    }));

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const taxableAmount = items.filter((i) => i.taxable).reduce((sum, item) => sum + item.lineTotal, 0);
    const taxAmount = taxableAmount * taxRate;
    const totalAmount = subtotal + taxAmount;

    const connection = await getConnection();
    const result = await connection.query(
      `INSERT INTO invoices (organization_id, customer_id, subscription_id, invoice_number, status, issue_date, due_date, currency, subtotal, tax_amount, tax_percentage, total_amount, paid_amount, items, notes, payment_terms, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'draft', $5, $6, $7, $8, $9, $10, $11, 0, $12, $13, $14, $15, NOW(), NOW())
       RETURNING *`,
      [organizationId, input.customerId, input.subscriptionId || null, invoiceNumber, issueDate.toISOString(), dueDate.toISOString(), 'EGP', subtotal, taxAmount, Math.round(taxRate * 100), totalAmount, JSON.stringify(items), input.notes || null, input.paymentTerms || null, JSON.stringify(input.metadata || {})]
    );

    return result.rows[0];
  },

  async getInvoiceById(invoiceId: string, organizationId: string): Promise<Invoice> {
    const connection = await getConnection();
    const result = await connection.query(
      'SELECT * FROM invoices WHERE id = $1 AND organization_id = $2',
      [invoiceId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Invoice not found');
    }

    return result.rows[0];
  },

  async getInvoiceByNumber(invoiceNumber: string, organizationId: string): Promise<Invoice> {
    const connection = await getConnection();
    const result = await connection.query(
      'SELECT * FROM invoices WHERE invoice_number = $1 AND organization_id = $2',
      [invoiceNumber, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Invoice not found');
    }

    return result.rows[0];
  },

  async getCustomerInvoices(organizationId: string, customerId: string, limit: number = 50, offset: number = 0): Promise<{ items: Invoice[]; total: number }> {
    const connection = await getConnection();
    const countResult = await connection.query(
      'SELECT COUNT(*) FROM invoices WHERE organization_id = $1 AND customer_id = $2',
      [organizationId, customerId]
    );

    const result = await connection.query(
      'SELECT * FROM invoices WHERE organization_id = $1 AND customer_id = $2 ORDER BY issue_date DESC LIMIT $3 OFFSET $4',
      [organizationId, customerId, limit, offset]
    );

    return { items: result.rows, total: parseInt(countResult.rows[0].count, 10) };
  },

  async getInvoicesByStatus(organizationId: string, status: string, limit: number = 50, offset: number = 0): Promise<{ items: Invoice[]; total: number }> {
    if (!INVOICE_STATUSES.includes(status as any)) {
      throw new ValidationError(`Invalid invoice status: ${status}`);
    }

    const connection = await getConnection();
    const countResult = await connection.query(
      'SELECT COUNT(*) FROM invoices WHERE organization_id = $1 AND status = $2',
      [organizationId, status]
    );

    const result = await connection.query(
      'SELECT * FROM invoices WHERE organization_id = $1 AND status = $2 ORDER BY issue_date DESC LIMIT $3 OFFSET $4',
      [organizationId, status, limit, offset]
    );

    return { items: result.rows, total: parseInt(countResult.rows[0].count, 10) };
  },

  async issueInvoice(invoiceId: string, organizationId: string): Promise<Invoice> {
    const connection = await getConnection();
    const result = await connection.query(
      `UPDATE invoices SET status = 'issued', updated_at = NOW()
       WHERE id = $1 AND organization_id = $2 AND status = 'draft'
       RETURNING *`,
      [invoiceId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Invoice not found or not in draft status');
    }

    return result.rows[0];
  },

  async recordPayment(invoiceId: string, organizationId: string, amount: number): Promise<Invoice> {
    const invoice = await this.getInvoiceById(invoiceId, organizationId);
    const newPaidAmount = invoice.paid_amount + amount;
    const newStatus = newPaidAmount >= invoice.total_amount ? 'paid' : newPaidAmount > 0 ? 'partially_paid' : 'issued';

    const connection = await getConnection();
    const result = await connection.query(
      `UPDATE invoices SET paid_amount = $1, status = $2, paid_date = NOW(), updated_at = NOW()
       WHERE id = $3 AND organization_id = $4
       RETURNING *`,
      [newPaidAmount, newStatus, invoiceId, organizationId]
    );

    return result.rows[0];
  },

  async markOverdue(invoiceId: string, organizationId: string): Promise<Invoice> {
    const connection = await getConnection();
    const result = await connection.query(
      `UPDATE invoices SET status = 'overdue', updated_at = NOW()
       WHERE id = $1 AND organization_id = $2 AND status IN ('issued', 'partially_paid') AND due_date < NOW()
       RETURNING *`,
      [invoiceId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Invoice not found or not eligible for overdue status');
    }

    return result.rows[0];
  },

  async cancelInvoice(invoiceId: string, organizationId: string): Promise<Invoice> {
    const connection = await getConnection();
    const result = await connection.query(
      `UPDATE invoices SET status = 'canceled', updated_at = NOW()
       WHERE id = $1 AND organization_id = $2 AND status IN ('draft', 'issued')
       RETURNING *`,
      [invoiceId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Invoice not found or cannot be canceled');
    }

    return result.rows[0];
  },

  async getOverdueInvoices(organizationId: string, limit: number = 50): Promise<Invoice[]> {
    const connection = await getConnection();
    const result = await connection.query(
      `SELECT * FROM invoices WHERE organization_id = $1 AND status IN ('issued', 'partially_paid')
       AND due_date < NOW() ORDER BY due_date ASC LIMIT $2`,
      [organizationId, limit]
    );

    return result.rows;
  },

  async generateInvoiceNumber(organizationId: string): Promise<string> {
    const connection = await getConnection();
    const result = await connection.query(
      'SELECT COUNT(*) as count FROM invoices WHERE organization_id = $1',
      [organizationId]
    );

    const count = parseInt(result.rows[0].count, 10) + 1;
    const year = new Date().getFullYear();
    return `INV-${year}-${organizationId.substring(0, 4).toUpperCase()}-${String(count).padStart(5, '0')}`;
  },

  async getInvoiceSummary(organizationId: string, startDate?: string, endDate?: string): Promise<Record<string, any>> {
    const connection = await getConnection();
    let query = `SELECT
      COUNT(*) as total_invoices,
      SUM(total_amount) as total_billed,
      SUM(paid_amount) as total_paid,
      SUM(total_amount - paid_amount) as total_outstanding,
      COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count,
      SUM(CASE WHEN status = 'overdue' THEN (total_amount - paid_amount) ELSE 0 END) as overdue_amount
      FROM invoices WHERE organization_id = $1`;
    const params: any[] = [organizationId];

    if (startDate) {
      query += ' AND issue_date >= $' + (params.length + 1);
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND issue_date <= $' + (params.length + 1);
      params.push(endDate);
    }

    const result = await connection.query(query, params);
    return result.rows[0];
  },
};
