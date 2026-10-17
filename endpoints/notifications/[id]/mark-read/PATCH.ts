import { notificationService } from '../../../../domains/communications/services/NotificationService';
import { NotFoundError } from '../../../../platform/errors/errors';

export default async function handler(req: any) {
  if (req.method !== 'PATCH') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const organizationId = req.headers['x-organization-id'];
    const notificationId = req.params?.id;

    if (!organizationId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    if (!notificationId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Notification ID is required' }) };
    }

    const notification = await notificationService.markAsRead(notificationId, organizationId);

    return {
      statusCode: 200,
      body: JSON.stringify(notification),
    };
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: error.message }),
      };
    }

    console.error('Failed to mark notification as read:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
