import { messageService } from '../../domains/communications/services/MessageService';

export default async function handler(req: any) {
  if (req.method !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const organizationId = req.headers['x-organization-id'];
    const channel = req.query?.channel;
    const category = req.query?.category;

    if (!organizationId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const templates = await messageService.getOrganizationTemplates(
      organizationId,
      { channel, category }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ data: templates }),
    };
  } catch (error: any) {
    console.error('Failed to list templates:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
