import { communicationPreferenceService } from '../../domains/communications/services/CommunicationPreferenceService';

export default async function handler(req: any) {
  if (req.method !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const organizationId = req.headers['x-organization-id'];
    const contactId = req.query?.contactId;

    if (!organizationId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    if (!contactId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'contactId is required' }),
      };
    }

    const preferences = await communicationPreferenceService.getContactPreferences(
      contactId,
      organizationId
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ data: preferences }),
    };
  } catch (error: any) {
    console.error('Failed to list communication preferences:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
