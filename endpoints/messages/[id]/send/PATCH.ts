import { messageService } from '../../../../domains/communications/services/MessageService';
import { NotFoundError, ValidationError } from '../../../../platform/errors/errors';

export default async function handler(req: any) {
  if (req.method !== 'PATCH') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const organizationId = req.headers['x-organization-id'];
    const messageId = req.params?.id;
    const externalId = req.body?.externalId;

    if (!organizationId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    if (!messageId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Message ID is required' }) };
    }

    const message = await messageService.sendMessage(messageId, organizationId, externalId);

    return {
      statusCode: 200,
      body: JSON.stringify(message),
    };
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: error.message, details: error.details }),
      };
    }
    if (error instanceof NotFoundError) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: error.message }),
      };
    }

    console.error('Failed to send message:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
