import { communicationPreferenceService } from '../../../../domains/communications/services/CommunicationPreferenceService';
import { NotFoundError } from '../../../../platform/errors/errors';

export default async function handler(req: any) {
  if (req.method !== 'PATCH') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const token = req.params?.token;

    if (!token) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Token is required' }) };
    }

    const preference = await communicationPreferenceService.unsubscribeByToken(token);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Successfully unsubscribed',
        preference,
      }),
    };
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: error.message }),
      };
    }

    console.error('Failed to unsubscribe:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
