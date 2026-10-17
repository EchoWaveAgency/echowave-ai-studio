import { contactChannelService } from '../../domains/communications/services/ContactChannelService';

export default async function handler(req: any) {
  if (req.method !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const organizationId = req.headers['x-organization-id'];
    const contactId = req.query?.contactId;
    const type = req.query?.type;
    const limit = parseInt(req.query?.limit || '100', 10);
    const offset = parseInt(req.query?.offset || '0', 10);

    if (!organizationId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    let result;
    if (contactId) {
      const channels = await contactChannelService.getContactChannels(contactId, organizationId);
      result = { items: channels, total: channels.length };
    } else if (type) {
      result = await contactChannelService.getChannelsByType(organizationId, type, limit, offset);
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Either contactId or type is required' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: result.items,
        pagination: { limit, offset, total: result.total },
      }),
    };
  } catch (error: any) {
    console.error('Failed to list contact channels:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
