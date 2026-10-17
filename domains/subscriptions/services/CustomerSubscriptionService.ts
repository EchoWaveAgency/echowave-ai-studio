import { getConnection } from '../../../platform/database/connection';
import { ValidationError, NotFoundError } from '../../../platform/errors/errors';
import { CustomerSubscription, CustomerSubscriptionCreateInput, SUBSCRIPTION_STATUSES, BILLING_CYCLES } from '../models/index';
import { subscriptionPlanService } from './SubscriptionPlanService';

export const customerSubscriptionService = {
  async createSubscription(organizationId: string, input: CustomerSubscriptionCreateInput): Promise<CustomerSubscription> {
    if (!input.customerId?.trim()) {
      throw new ValidationError('Customer ID is required');
    }
    if (!input.planId?.trim()) {
      throw new ValidationError('Plan ID is required');
    }
    if (!BILLING_CYCLES.includes(input.billingCycle)) {
      throw new ValidationError(`Invalid billing cycle: ${input.billingCycle}`);
    }

    const plan = await subscriptionPlanService.getPlanById(input.planId, organizationId);
    const currentDate = new Date();
    const periodEnd = this.calculatePeriodEnd(currentDate, input.billingCycle);
    const quantity = input.quantity || 1;
    const unitPrice = plan.base_price * (1 - (plan.discount_percentage || 0) / 100);
    const totalPrice = unitPrice * quantity;

    const connection = await getConnection();
    const result = await connection.query(
      `INSERT INTO customer_subscriptions (organization_id, customer_id, plan_id, status, billing_cycle, current_period_start, current_period_end, next_billing_date, auto_renew, quantity, unit_price, total_price, payment_method, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, 'active', $4, NOW(), $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
       RETURNING *`,
      [organizationId, input.customerId, input.planId, input.billingCycle, periodEnd.toISOString(), periodEnd.toISOString(), input.autoRenew !== false, quantity, unitPrice, totalPrice, input.paymentMethod || null, JSON.stringify(input.metadata || {})]
    );

    return result.rows[0];
  },

  async getSubscriptionById(subscriptionId: string, organizationId: string): Promise<CustomerSubscription> {
    const connection = await getConnection();
    const result = await connection.query(
      'SELECT * FROM customer_subscriptions WHERE id = $1 AND organization_id = $2',
      [subscriptionId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Subscription not found');
    }

    return result.rows[0];
  },

  async getCustomerSubscriptions(organizationId: string, customerId: string, limit: number = 50, offset: number = 0): Promise<{ items: CustomerSubscription[]; total: number }> {
    const connection = await getConnection();
    const countResult = await connection.query(
      'SELECT COUNT(*) FROM customer_subscriptions WHERE organization_id = $1 AND customer_id = $2',
      [organizationId, customerId]
    );

    const result = await connection.query(
      'SELECT * FROM customer_subscriptions WHERE organization_id = $1 AND customer_id = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4',
      [organizationId, customerId, limit, offset]
    );

    return { items: result.rows, total: parseInt(countResult.rows[0].count, 10) };
  },

  async getActiveSubscriptions(organizationId: string, limit: number = 50, offset: number = 0): Promise<{ items: CustomerSubscription[]; total: number }> {
    const connection = await getConnection();
    const countResult = await connection.query(
      'SELECT COUNT(*) FROM customer_subscriptions WHERE organization_id = $1 AND status = $2',
      [organizationId, 'active']
    );

    const result = await connection.query(
      'SELECT * FROM customer_subscriptions WHERE organization_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4',
      [organizationId, 'active', limit, offset]
    );

    return { items: result.rows, total: parseInt(countResult.rows[0].count, 10) };
  },

  async updateSubscriptionStatus(subscriptionId: string, organizationId: string, status: string, reason?: string): Promise<CustomerSubscription> {
    if (!SUBSCRIPTION_STATUSES.includes(status as any)) {
      throw new ValidationError(`Invalid status: ${status}`);
    }

    const connection = await getConnection();
    const result = await connection.query(
      `UPDATE customer_subscriptions SET status = $1, cancel_reason = $2, canceled_at = CASE WHEN $1 = 'canceled' THEN NOW() ELSE canceled_at END, updated_at = NOW()
       WHERE id = $3 AND organization_id = $4
       RETURNING *`,
      [status, reason || null, subscriptionId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Subscription not found');
    }

    return result.rows[0];
  },

  async pauseSubscription(subscriptionId: string, organizationId: string): Promise<CustomerSubscription> {
    return this.updateSubscriptionStatus(subscriptionId, organizationId, 'paused');
  },

  async resumeSubscription(subscriptionId: string, organizationId: string): Promise<CustomerSubscription> {
    return this.updateSubscriptionStatus(subscriptionId, organizationId, 'active');
  },

  async cancelSubscription(subscriptionId: string, organizationId: string, reason?: string): Promise<CustomerSubscription> {
    return this.updateSubscriptionStatus(subscriptionId, organizationId, 'canceled', reason);
  },

  async renewSubscription(subscriptionId: string, organizationId: string): Promise<CustomerSubscription> {
    const subscription = await this.getSubscriptionById(subscriptionId, organizationId);
    const currentEnd = new Date(subscription.current_period_end);
    const newEnd = this.calculatePeriodEnd(currentEnd, subscription.billing_cycle);

    const connection = await getConnection();
    const result = await connection.query(
      `UPDATE customer_subscriptions SET
       current_period_start = $1,
       current_period_end = $2,
       next_billing_date = $3,
       status = 'active',
       updated_at = NOW()
       WHERE id = $4 AND organization_id = $5
       RETURNING *`,
      [currentEnd.toISOString(), newEnd.toISOString(), newEnd.toISOString(), subscriptionId, organizationId]
    );

    return result.rows[0];
  },

  async getSubscriptionsNeedingRenewal(organizationId: string): Promise<CustomerSubscription[]> {
    const connection = await getConnection();
    const result = await connection.query(
      `SELECT * FROM customer_subscriptions
       WHERE organization_id = $1 AND status = 'active' AND auto_renew = true
       AND current_period_end <= NOW() + INTERVAL '1 day'
       ORDER BY current_period_end ASC`,
      [organizationId]
    );

    return result.rows;
  },

  private calculatePeriodEnd(startDate: Date, billingCycle: string): Date {
    const endDate = new Date(startDate);

    switch (billingCycle) {
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'quarterly':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'annual':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      case 'custom':
        endDate.setDate(endDate.getDate() + 30);
        break;
    }

    return endDate;
  },
};
