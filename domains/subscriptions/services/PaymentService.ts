import { getConnection } from '../../../platform/database/connection';
import { ValidationError, NotFoundError } from '../../../platform/errors/errors';
import { Payment, PaymentCreateInput, PAYMENT_STATUSES, PAYMENT_METHODS } from '../models/index';
import { invoiceService } from './InvoiceService';

export const paymentService = {
  async recordPayment(organizationId: string, input: PaymentCreateInput): Promise<Payment> {
    if (!input.customerId?.trim()) {
      throw new ValidationError('Customer ID is required');
    }
    if (!input.invoiceId?.trim()) {
      throw new ValidationError('Invoice ID is required');
    }
    if (input.amount <= 0) {
      throw new ValidationError('Payment amount must be positive');
    }
    if (!PAYMENT_METHODS.includes(input.paymentMethod)) {
      throw new ValidationError(`Invalid payment method: ${input.paymentMethod}`);
    }

    const invoice = await invoiceService.getInvoiceById(input.invoiceId, organizationId);

    if (input.amount > invoice.total_amount - invoice.paid_amount) {
      throw new ValidationError('Payment amount exceeds outstanding balance');
    }

    const connection = await getConnection();
    const result = await connection.query(
      `INSERT INTO payments (organization_id, customer_id, invoice_id, amount, currency, payment_method, transaction_id, status, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, NOW(), NOW())
       RETURNING *`,
      [organizationId, input.customerId, input.invoiceId, input.amount, invoice.currency, input.paymentMethod, input.transactionId || null, JSON.stringify(input.metadata || {})]
    );

    return result.rows[0];
  },

  async getPaymentById(paymentId: string, organizationId: string): Promise<Payment> {
    const connection = await getConnection();
    const result = await connection.query(
      'SELECT * FROM payments WHERE id = $1 AND organization_id = $2',
      [paymentId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Payment not found');
    }

    return result.rows[0];
  },

  async getInvoicePayments(organizationId: string, invoiceId: string, limit: number = 50, offset: number = 0): Promise<{ items: Payment[]; total: number }> {
    const connection = await getConnection();
    const countResult = await connection.query(
      'SELECT COUNT(*) FROM payments WHERE organization_id = $1 AND invoice_id = $2',
      [organizationId, invoiceId]
    );

    const result = await connection.query(
      'SELECT * FROM payments WHERE organization_id = $1 AND invoice_id = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4',
      [organizationId, invoiceId, limit, offset]
    );

    return { items: result.rows, total: parseInt(countResult.rows[0].count, 10) };
  },

  async getCustomerPayments(organizationId: string, customerId: string, limit: number = 50, offset: number = 0): Promise<{ items: Payment[]; total: number }> {
    const connection = await getConnection();
    const countResult = await connection.query(
      'SELECT COUNT(*) FROM payments WHERE organization_id = $1 AND customer_id = $2',
      [organizationId, customerId]
    );

    const result = await connection.query(
      'SELECT * FROM payments WHERE organization_id = $1 AND customer_id = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4',
      [organizationId, customerId, limit, offset]
    );

    return { items: result.rows, total: parseInt(countResult.rows[0].count, 10) };
  },

  async getPaymentsByStatus(organizationId: string, status: string, limit: number = 50, offset: number = 0): Promise<{ items: Payment[]; total: number }> {
    if (!PAYMENT_STATUSES.includes(status as any)) {
      throw new ValidationError(`Invalid payment status: ${status}`);
    }

    const connection = await getConnection();
    const countResult = await connection.query(
      'SELECT COUNT(*) FROM payments WHERE organization_id = $1 AND status = $2',
      [organizationId, status]
    );

    const result = await connection.query(
      'SELECT * FROM payments WHERE organization_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4',
      [organizationId, status, limit, offset]
    );

    return { items: result.rows, total: parseInt(countResult.rows[0].count, 10) };
  },

  async completePayment(paymentId: string, organizationId: string): Promise<Payment> {
    const payment = await this.getPaymentById(paymentId, organizationId);

    const connection = await getConnection();
    const result = await connection.query(
      `UPDATE payments SET status = 'completed', paid_date = NOW(), updated_at = NOW()
       WHERE id = $1 AND organization_id = $2
       RETURNING *`,
      [paymentId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Payment not found');
    }

    await invoiceService.recordPayment(payment.invoice_id, organizationId, payment.amount);

    return result.rows[0];
  },

  async failPayment(paymentId: string, organizationId: string, reason: string): Promise<Payment> {
    const connection = await getConnection();
    const result = await connection.query(
      `UPDATE payments SET status = 'failed', failure_reason = $1, updated_at = NOW()
       WHERE id = $2 AND organization_id = $3
       RETURNING *`,
      [reason, paymentId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Payment not found');
    }

    return result.rows[0];
  },

  async refundPayment(paymentId: string, organizationId: string): Promise<Payment> {
    const payment = await this.getPaymentById(paymentId, organizationId);

    if (payment.status !== 'completed') {
      throw new ValidationError('Only completed payments can be refunded');
    }

    const connection = await getConnection();
    const result = await connection.query(
      `UPDATE payments SET status = 'refunded', updated_at = NOW()
       WHERE id = $1 AND organization_id = $2
       RETURNING *`,
      [paymentId, organizationId]
    );

    return result.rows[0];
  },

  async getPendingPayments(organizationId: string, limit: number = 50): Promise<Payment[]> {
    const connection = await getConnection();
    const result = await connection.query(
      'SELECT * FROM payments WHERE organization_id = $1 AND status = $2 ORDER BY created_at ASC LIMIT $3',
      [organizationId, 'pending', limit]
    );

    return result.rows;
  },

  async getPaymentSummary(organizationId: string, startDate?: string, endDate?: string): Promise<Record<string, any>> {
    const connection = await getConnection();
    let query = `SELECT
      COUNT(*) as total_payments,
      SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_collected,
      SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
      SUM(CASE WHEN status = 'failed' THEN amount ELSE 0 END) as failed_amount,
      COUNT(DISTINCT payment_method) as payment_methods_used
      FROM payments WHERE organization_id = $1`;
    const params: any[] = [organizationId];

    if (startDate) {
      query += ' AND created_at >= $' + (params.length + 1);
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND created_at <= $' + (params.length + 1);
      params.push(endDate);
    }

    const result = await connection.query(query, params);
    return result.rows[0];
  },
};
