import { messageService } from '../../../domains/communications/services/MessageService';
import { NotFoundError } from '../../../platform/errors/errors';

export default async function handler(req: any) {
  if (req.method !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const organizationId = req.headers['x-organization-id'];
    const messageId = req.params?.id;

    if (!organizationId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    if (!messageId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Message ID is required' }) };
    }

    const message = await messageService.getMessageById(messageId, organizationId);

    return {
      statusCode: 200,
      body: JSON.stringify(message),
    };
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: error.message }),
      };
    }

    console.error('Failed to get message:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
