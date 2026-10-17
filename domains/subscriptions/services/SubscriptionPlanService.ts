import { getConnection } from '../../../platform/database/connection';
import { ValidationError, NotFoundError } from '../../../platform/errors/errors';
import { SubscriptionPlan, SubscriptionPlanCreateInput, PLAN_TYPES, CURRENCIES } from '../models/index';

export const subscriptionPlanService = {
  async createPlan(organizationId: string, input: SubscriptionPlanCreateInput): Promise<SubscriptionPlan> {
    if (!input.name?.trim()) {
      throw new ValidationError('Plan name is required');
    }
    if (!PLAN_TYPES.includes(input.type)) {
      throw new ValidationError(`Invalid plan type: ${input.type}`);
    }
    if (!CURRENCIES.includes(input.currency)) {
      throw new ValidationError(`Invalid currency: ${input.currency}`);
    }
    if (input.basePrice < 0) {
      throw new ValidationError('Base price must be non-negative');
    }
    if (input.discountPercentage && (input.discountPercentage < 0 || input.discountPercentage > 100)) {
      throw new ValidationError('Discount percentage must be between 0 and 100');
    }

    const connection = await getConnection();
    const result = await connection.query(
      `INSERT INTO subscription_plans (organization_id, name, description, type, currency, base_price, discount_percentage, features, max_users, max_projects, max_storage, status, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'draft', $12, NOW(), NOW())
       RETURNING *`,
      [organizationId, input.name, input.description || null, input.type, input.currency, input.basePrice, input.discountPercentage || null, JSON.stringify(input.features || []), input.maxUsers || null, input.maxProjects || null, input.maxStorage || null, organizationId]
    );

    return result.rows[0];
  },

  async getPlanById(planId: string, organizationId: string): Promise<SubscriptionPlan> {
    const connection = await getConnection();
    const result = await connection.query(
      'SELECT * FROM subscription_plans WHERE id = $1 AND organization_id = $2',
      [planId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Subscription plan not found');
    }

    return result.rows[0];
  },

  async getOrganizationPlans(organizationId: string, limit: number = 50, offset: number = 0): Promise<{ items: SubscriptionPlan[]; total: number }> {
    const connection = await getConnection();
    const countResult = await connection.query(
      'SELECT COUNT(*) FROM subscription_plans WHERE organization_id = $1',
      [organizationId]
    );

    const result = await connection.query(
      'SELECT * FROM subscription_plans WHERE organization_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [organizationId, limit, offset]
    );

    return { items: result.rows, total: parseInt(countResult.rows[0].count, 10) };
  },

  async getActivePlans(organizationId: string): Promise<SubscriptionPlan[]> {
    const connection = await getConnection();
    const result = await connection.query(
      'SELECT * FROM subscription_plans WHERE organization_id = $1 AND status = $2 ORDER BY base_price ASC',
      [organizationId, 'active']
    );

    return result.rows;
  },

  async updatePlan(planId: string, organizationId: string, updates: Partial<SubscriptionPlanCreateInput>): Promise<SubscriptionPlan> {
    await this.getPlanById(planId, organizationId);

    if (updates.type && !PLAN_TYPES.includes(updates.type)) {
      throw new ValidationError(`Invalid plan type: ${updates.type}`);
    }
    if (updates.currency && !CURRENCIES.includes(updates.currency)) {
      throw new ValidationError(`Invalid currency: ${updates.currency}`);
    }
    if (updates.basePrice !== undefined && updates.basePrice < 0) {
      throw new ValidationError('Base price must be non-negative');
    }
    if (updates.discountPercentage !== undefined && (updates.discountPercentage < 0 || updates.discountPercentage > 100)) {
      throw new ValidationError('Discount percentage must be between 0 and 100');
    }

    const connection = await getConnection();
    const result = await connection.query(
      `UPDATE subscription_plans SET
       name = COALESCE($1, name),
       description = COALESCE($2, description),
       type = COALESCE($3, type),
       currency = COALESCE($4, currency),
       base_price = COALESCE($5, base_price),
       discount_percentage = COALESCE($6, discount_percentage),
       features = COALESCE($7, features),
       max_users = COALESCE($8, max_users),
       max_projects = COALESCE($9, max_projects),
       max_storage = COALESCE($10, max_storage),
       updated_at = NOW()
       WHERE id = $11 AND organization_id = $12
       RETURNING *`,
      [updates.name || null, updates.description || null, updates.type || null, updates.currency || null, updates.basePrice !== undefined ? updates.basePrice : null, updates.discountPercentage || null, updates.features ? JSON.stringify(updates.features) : null, updates.maxUsers || null, updates.maxProjects || null, updates.maxStorage || null, planId, organizationId]
    );

    return result.rows[0];
  },

  async activatePlan(planId: string, organizationId: string): Promise<SubscriptionPlan> {
    const connection = await getConnection();
    const result = await connection.query(
      `UPDATE subscription_plans SET status = 'active', updated_at = NOW()
       WHERE id = $1 AND organization_id = $2
       RETURNING *`,
      [planId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Plan not found');
    }

    return result.rows[0];
  },

  async archivePlan(planId: string, organizationId: string): Promise<SubscriptionPlan> {
    const connection = await getConnection();
    const result = await connection.query(
      `UPDATE subscription_plans SET status = 'archived', updated_at = NOW()
       WHERE id = $1 AND organization_id = $2
       RETURNING *`,
      [planId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Plan not found');
    }

    return result.rows[0];
  },

  async deletePlan(planId: string, organizationId: string): Promise<void> {
    const connection = await getConnection();
    const result = await connection.query(
      'DELETE FROM subscription_plans WHERE id = $1 AND organization_id = $2',
      [planId, organizationId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('Plan not found');
    }
  },
};
