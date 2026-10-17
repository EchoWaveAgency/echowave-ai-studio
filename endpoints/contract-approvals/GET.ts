import { contractApprovalService } from '../../domains/contracts/services/ContractApprovalService';

export default async function handler(req: any) {
  if (req.method !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const organizationId = req.headers['x-organization-id'];
    if (!organizationId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const contractId = req.query?.contractId;
    const status = req.query?.status;
    const limit = parseInt(req.query?.limit || '50', 10);
    const offset = parseInt(req.query?.offset || '0', 10);

    if (!contractId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Contract ID is required' }) };
    }

    let result;
    if (status) {
      result = await contractApprovalService.getApprovalsByStatus(organizationId, contractId, status, limit, offset);
    } else {
      result = await contractApprovalService.getContractApprovals(organizationId, contractId, limit, offset);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: result.items,
        pagination: { limit, offset, total: result.total },
      }),
    };
  } catch (error: any) {
    console.error('Failed to list approvals:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
}
