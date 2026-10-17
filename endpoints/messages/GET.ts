import { messageService } from '../../domains/communications/services/MessageService';

export default async function handler(req: any) {
  if (req.method !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const organizationId = req.headers['x-organization-id'];
    const contactId = req.query?.contactId;
    const limit = parseInt(req.query?.limit || '50', 10);
    const offset = parseInt(req.query?.offset || '0', 10);

    if (!organizationId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    if (!contactId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'contactId is required' }),
      };
    }

    const { items, total } = await messageService.getContactMessages(
      contactId,
      organizationId,
      limit,
      offset
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: items,
        pagination: { limit, offset, total },
      }),
    };
  } catch (error: any) {
    console.error('Failed to list messages:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
