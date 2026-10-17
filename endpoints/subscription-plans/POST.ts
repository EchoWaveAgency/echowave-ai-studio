import { subscriptionPlanService } from '../../domains/subscriptions/services/SubscriptionPlanService';
import { ValidationError } from '../../platform/errors/errors';

export default async function handler(req: any) {
  if (req.method !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const organizationId = req.headers['x-organization-id'];
    if (!organizationId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const { name, description, type, currency, basePrice, discountPercentage, features, maxUsers, maxProjects, maxStorage } = req.body;
    const plan = await subscriptionPlanService.createPlan(organizationId, {
      name,
      description,
      type,
      currency,
      basePrice,
      discountPercentage,
      features,
      maxUsers,
      maxProjects,
      maxStorage,
    });

    return { statusCode: 201, body: JSON.stringify(plan) };
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
    }
    console.error('Failed to create subscription plan:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
}
