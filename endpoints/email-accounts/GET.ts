import { emailAccountService } from '../../domains/communications/services/EmailAccountService';

export default async function handler(req: any) {
  if (req.method !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const organizationId = req.headers['x-organization-id'];

    if (!organizationId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const accounts = await emailAccountService.getOrganizationEmailAccounts(organizationId);

    return {
      statusCode: 200,
      body: JSON.stringify({ data: accounts }),
    };
  } catch (error: any) {
    console.error('Failed to list email accounts:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
