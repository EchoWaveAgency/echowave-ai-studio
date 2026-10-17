import { webhookEventService } from '../../domains/webhooks/services/WebhookEventService';

export default async function handler(req: any) {
  if (req.method !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const organizationId = req.headers['x-organization-id'];
    if (!organizationId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const endpointId = req.query?.endpointId;
    const status = req.query?.status;
    const limit = parseInt(req.query?.limit || '50', 10);
    const offset = parseInt(req.query?.offset || '0', 10);

    let result;
    if (status) {
      result = await webhookEventService.getEventsByStatus(organizationId, status, limit, offset);
    } else if (endpointId) {
      result = await webhookEventService.getEndpointEvents(organizationId, endpointId, limit, offset);
    } else {
      result = { items: [], total: 0 };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: result.items,
        pagination: { limit, offset, total: result.total },
      }),
    };
  } catch (error: any) {
    console.error('Failed to list webhook events:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
}
