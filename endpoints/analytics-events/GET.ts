import { analyticsEventService } from '../../domains/analytics/services/AnalyticsEventService';

export default async function handler(req: any) {
  if (req.method !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const organizationId = req.headers['x-organization-id'];
    if (!organizationId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const eventType = req.query?.eventType;
    const category = req.query?.category;
    const userId = req.query?.userId;
    const contactId = req.query?.contactId;
    const startDate = req.query?.startDate;
    const endDate = req.query?.endDate;
    const limit = parseInt(req.query?.limit || '100', 10);
    const offset = parseInt(req.query?.offset || '0', 10);

    let result;
    if (eventType) {
      result = await analyticsEventService.getEventsByType(organizationId, eventType, limit, offset);
    } else if (category) {
      result = await analyticsEventService.getEventsByCategory(organizationId, category, limit, offset);
    } else if (userId) {
      result = await analyticsEventService.getEventsByUser(organizationId, userId, limit, offset);
    } else if (contactId) {
      result = await analyticsEventService.getEventsByContact(organizationId, contactId, limit, offset);
    } else if (startDate && endDate) {
      result = await analyticsEventService.getEventsByDateRange(organizationId, startDate, endDate, limit, offset);
    } else {
      result = await analyticsEventService.getOrganizationEvents(organizationId, limit, offset);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: result.items,
        pagination: { limit, offset, total: result.total },
      }),
    };
  } catch (error: any) {
    console.error('Failed to list analytics events:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
}
