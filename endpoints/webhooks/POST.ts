import { webhookEndpointService } from '../../domains/webhooks/services/WebhookEndpointService';
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

    const userId = req.headers['x-user-id'];
    if (!userId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const { name, url, events, retryPolicy, headers, authentication, rateLimit, metadata } = req.body;
    const endpoint = await webhookEndpointService.createEndpoint(
      organizationId,
      {
        name,
        url,
        events,
        retryPolicy,
        headers,
        authentication,
        rateLimit,
        metadata,
      },
      userId,
    );

    return { statusCode: 201, body: JSON.stringify(endpoint) };
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
    }
    console.error('Failed to create webhook endpoint:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
}
