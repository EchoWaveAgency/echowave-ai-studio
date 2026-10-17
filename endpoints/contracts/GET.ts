import { contractService } from '../../domains/contracts/services/ContractService';

export default async function handler(req: any) {
  if (req.method !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const organizationId = req.headers['x-organization-id'];
    if (!organizationId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const status = req.query?.status;
    const category = req.query?.category;
    const limit = parseInt(req.query?.limit || '50', 10);
    const offset = parseInt(req.query?.offset || '0', 10);

    let result;
    if (status) {
      result = await contractService.getContractsByStatus(organizationId, status, limit, offset);
    } else if (category) {
      result = await contractService.getContractsByCategory(organizationId, category, limit, offset);
    } else {
      result = await contractService.getOrganizationContracts(organizationId, limit, offset);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: result.items,
        pagination: { limit, offset, total: result.total },
      }),
    };
  } catch (error: any) {
    console.error('Failed to list contracts:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
}
