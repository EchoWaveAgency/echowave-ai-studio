import { analyticsEventService } from '../../domains/analytics/services/AnalyticsEventService';
import { ValidationError } from '../../platform/errors/errors';

export default async function handler(req: any) {
  if (req.method !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const organizationId = req.headers['x-organization-id'];
    const userId = req.user?.id;

    if (!organizationId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const { eventType, category, action, label, value, properties, sessionId, metadata, contactId } = req.body;
    const event = await analyticsEventService.trackEvent(
      organizationId,
      { eventType, category, action, label, value, properties, sessionId, metadata },
      userId,
      contactId
    );

    return { statusCode: 201, body: JSON.stringify(event) };
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
    }
    console.error('Failed to track event:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
}
