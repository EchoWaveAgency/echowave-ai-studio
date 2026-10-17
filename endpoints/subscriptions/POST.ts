import { customerSubscriptionService } from '../../domains/subscriptions/services/CustomerSubscriptionService';
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

    const { customerId, planId, billingCycle, autoRenew, quantity, paymentMethod, metadata } = req.body;
    const subscription = await customerSubscriptionService.createSubscription(organizationId, {
      customerId,
      planId,
      billingCycle,
      autoRenew,
      quantity,
      paymentMethod,
      metadata,
    });

    return { statusCode: 201, body: JSON.stringify(subscription) };
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
    }
    console.error('Failed to create subscription:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
}
