import { MessageCreateInput } from '../../domains/communications/models/index';
import { messageService } from '../../domains/communications/services/MessageService';
import { NotFoundError, ValidationError } from '../../platform/errors/errors';

export default async function handler(req: any) {
  if (req.method !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const organizationId = req.headers['x-organization-id'];
    const userId = req.user?.id;

    if (!organizationId || !userId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const input: MessageCreateInput = req.body;

    const message = await messageService.createMessage(organizationId, input, userId);

    return {
      statusCode: 201,
      body: JSON.stringify(message),
    };
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: error.message, details: error.details }),
      };
    }

    console.error('Failed to create message:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
