import { webhookDeliveryService } from '../../domains/webhooks/services/WebhookDeliveryService';

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
    const webhookEventId = req.query?.webhookEventId;
    const status = req.query?.status;
    const limit = parseInt(req.query?.limit || '50', 10);
    const offset = parseInt(req.query?.offset || '0', 10);

    let result;
    if (webhookEventId) {
      result = await webhookDeliveryService.getEventDeliveries(organizationId, webhookEventId, limit, offset);
    } else if (endpointId) {
      result = await webhookDeliveryService.getEndpointDeliveries(organizationId, endpointId, limit, offset);
    } else if (status === 'failed') {
      result = await webhookDeliveryService.getFailedDeliveries(organizationId, limit, offset);
    } else if (status === 'successful') {
      result = await webhookDeliveryService.getSuccessfulDeliveries(organizationId, limit, offset);
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
    console.error('Failed to list webhook deliveries:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
}
