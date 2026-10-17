import { contractTemplateService } from '../../domains/contracts/services/ContractTemplateService';

export default async function handler(req: any) {
  if (req.method !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const organizationId = req.headers['x-organization-id'];
    if (!organizationId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const category = req.query?.category;
    const limit = parseInt(req.query?.limit || '50', 10);
    const offset = parseInt(req.query?.offset || '0', 10);

    let result;
    if (category) {
      result = await contractTemplateService.getTemplatesByCategory(organizationId, category, limit, offset);
    } else {
      result = await contractTemplateService.getOrganizationTemplates(organizationId, limit, offset);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: result.items,
        pagination: { limit, offset, total: result.total },
      }),
    };
  } catch (error: any) {
    console.error('Failed to list templates:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
}
