import { db } from '../../../platform/database/db';
import { ValidationError, NotFoundError } from '../../../platform/errors/errors';
import {
  Payment,
  PaymentCreateInput,
  PaymentSource,
  PaymentSourceCreateInput,
} from '../models/index';

export class PaymentService {
  async createPaymentSource(
    organizationId: string,
    input: PaymentSourceCreateInput
  ): Promise<PaymentSource> {
    if (!input.name || !input.name.trim()) {
      throw new ValidationError('Payment source name is required', { name: 'Required' });
    }
    if (!['bank', 'cash', 'digital_wallet'].includes(input.type)) {
      throw new ValidationError('Invalid payment source type', { type: 'Invalid value' });
    }
    if (!input.currency || !input.currency.trim()) {
      throw new ValidationError('Currency is required', { currency: 'Required' });
    }

    const sourceId = crypto.randomUUID();
    const initialBalance = input.initialBalance || 0;

    const result = await db.query(
      `
      INSERT INTO payment_sources (
        id, organization_id, name, type, account_number, balance, currency, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', NOW(), NOW())
      RETURNING *
      `,
      [sourceId, organizationId, input.name, input.type, input.accountNumber || null, initialBalance, input.currency]
    );

    return this.mapToPaymentSource(result.rows[0]);
  }

  async getPaymentSourceById(sourceId: string, organizationId: string): Promise<PaymentSource> {
    const result = await db.query(
      `SELECT * FROM payment_sources WHERE id = $1 AND organization_id = $2`,
      [sourceId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Payment source not found');
    }

    return this.mapToPaymentSource(result.rows[0]);
  }

  async getOrganizationPaymentSources(
    organizationId: string,
    activeOnly: boolean = true
  ): Promise<PaymentSource[]> {
    let query = `SELECT * FROM payment_sources WHERE organization_id = $1`;
    const params: any[] = [organizationId];

    if (activeOnly) {
      query += ` AND status = 'active'`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await db.query(query, params);
    return result.rows.map((row) => this.mapToPaymentSource(row));
  }

  async createPayment(
    organizationId: string,
    input: PaymentCreateInput,
    userId: string
  ): Promise<Payment> {
    if (!input.amount || input.amount <= 0) {
      throw new ValidationError('Amount must be greater than zero', { amount: 'Invalid' });
    }
    if (!input.currency || !input.currency.trim()) {
      throw new ValidationError('Currency is required', { currency: 'Required' });
    }
    if (!['bank_transfer', 'instapay', 'wallet', 'cash', 'card'].includes(input.paymentMethod)) {
      throw new ValidationError('Invalid payment method', { paymentMethod: 'Invalid value' });
    }
    if (!input.paymentSourceId) {
      throw new ValidationError('Payment source ID is required', { paymentSourceId: 'Required' });
    }
    if (!input.referenceNumber || !input.referenceNumber.trim()) {
      throw new ValidationError('Reference number is required', { referenceNumber: 'Required' });
    }

    const paymentId = crypto.randomUUID();
    const result = await db.query(
      `
      INSERT INTO payments (
        id, organization_id, document_id, amount, currency, payment_method, payment_source_id,
        status, reference_number, reported_by, reported_at, reconciliation_notes, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, 'reported', $8, $9, NOW(), $10, NOW(), NOW()
      )
      RETURNING *
      `,
      [
        paymentId,
        organizationId,
        input.documentId || null,
        input.amount,
        input.currency,
        input.paymentMethod,
        input.paymentSourceId,
        input.referenceNumber,
        userId,
        input.reconciliationNotes || null,
      ]
    );

    return this.mapToPayment(result.rows[0]);
  }

  async getPaymentById(paymentId: string, organizationId: string): Promise<Payment> {
    const result = await db.query(
      `SELECT * FROM payments WHERE id = $1 AND organization_id = $2`,
      [paymentId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Payment not found');
    }

    return this.mapToPayment(result.rows[0]);
  }

  async getOrganizationPayments(
    organizationId: string,
    filters: {
      status?: string;
      paymentMethod?: string;
      startDate?: string;
      endDate?: string;
    } = {},
    limit: number = 100,
    offset: number = 0
  ): Promise<{ items: Payment[]; total: number }> {
    let query = `SELECT COUNT(*) as count FROM payments WHERE organization_id = $1`;
    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }
    if (filters.paymentMethod) {
      query += ` AND payment_method = $${paramIndex}`;
      params.push(filters.paymentMethod);
      paramIndex++;
    }
    if (filters.startDate) {
      query += ` AND reported_at >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }
    if (filters.endDate) {
      query += ` AND reported_at <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }

    const totalResult = await db.query(query, params);
    const total = totalResult.rows[0].count;

    let listQuery = `SELECT * FROM payments WHERE organization_id = $1`;
    const listParams: any[] = [organizationId];
    let listParamIndex = 2;

    if (filters.status) {
      listQuery += ` AND status = $${listParamIndex}`;
      listParams.push(filters.status);
      listParamIndex++;
    }
    if (filters.paymentMethod) {
      listQuery += ` AND payment_method = $${listParamIndex}`;
      listParams.push(filters.paymentMethod);
      listParamIndex++;
    }
    if (filters.startDate) {
      listQuery += ` AND reported_at >= $${listParamIndex}`;
      listParams.push(filters.startDate);
      listParamIndex++;
    }
    if (filters.endDate) {
      listQuery += ` AND reported_at <= $${listParamIndex}`;
      listParams.push(filters.endDate);
      listParamIndex++;
    }

    listQuery += ` ORDER BY reported_at DESC LIMIT $${listParamIndex} OFFSET $${listParamIndex + 1}`;
    listParams.push(limit, offset);

    const result = await db.query(listQuery, listParams);
    return {
      items: result.rows.map((row) => this.mapToPayment(row)),
      total,
    };
  }

  async verifyPayment(
    paymentId: string,
    organizationId: string,
    userId: string
  ): Promise<Payment> {
    const payment = await this.getPaymentById(paymentId, organizationId);

    if (payment.status === 'reconciled') {
      throw new ValidationError('Payment is already reconciled', { status: 'Already verified' });
    }

    const updated = await db.query(
      `
      UPDATE payments
      SET status = 'verification_pending', verified_by = $3, verified_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
      `,
      [paymentId, organizationId, userId]
    );

    return this.mapToPayment(updated.rows[0]);
  }

  async reconcilePayment(
    paymentId: string,
    organizationId: string,
    notes: string,
    userId: string
  ): Promise<Payment> {
    const payment = await this.getPaymentById(paymentId, organizationId);

    if (payment.status === 'reconciled') {
      throw new ValidationError('Payment is already reconciled', { status: 'Already reconciled' });
    }

    const updated = await db.query(
      `
      UPDATE payments
      SET status = 'reconciled', verified_by = $3, verified_at = NOW(), reconciliation_notes = $4, updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
      `,
      [paymentId, organizationId, userId, notes]
    );

    return this.mapToPayment(updated.rows[0]);
  }

  async disputePayment(
    paymentId: string,
    organizationId: string,
    reason: string,
    userId: string
  ): Promise<Payment> {
    const payment = await this.getPaymentById(paymentId, organizationId);

    if (payment.status === 'disputed' || payment.status === 'reversed') {
      throw new ValidationError('Payment cannot be disputed in current state', {
        status: 'Invalid state',
      });
    }

    const updated = await db.query(
      `
      UPDATE payments
      SET status = 'disputed', reconciliation_notes = $4, updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
      `,
      [paymentId, organizationId, userId, reason || '']
    );

    return this.mapToPayment(updated.rows[0]);
  }

  private mapToPaymentSource(row: any): PaymentSource {
    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      type: row.type,
      accountNumber: row.account_number,
      balance: parseFloat(row.balance),
      currency: row.currency,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapToPayment(row: any): Payment {
    return {
      id: row.id,
      organizationId: row.organization_id,
      documentId: row.document_id,
      amount: parseFloat(row.amount),
      currency: row.currency,
      paymentMethod: row.payment_method,
      paymentSourceId: row.payment_source_id,
      status: row.status,
      referenceNumber: row.reference_number,
      reportedBy: row.reported_by,
      reportedAt: row.reported_at,
      verifiedBy: row.verified_by,
      verifiedAt: row.verified_at,
      reconciliationNotes: row.reconciliation_notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const paymentService = new PaymentService();
