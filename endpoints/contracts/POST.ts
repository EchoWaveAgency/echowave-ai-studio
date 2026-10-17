import { contractService } from '../../domains/contracts/services/ContractService';
import { ValidationError } from '../../platform/errors/errors';

export default async function handler(req: any) {
  if (req.method !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const organizationId = req.headers['x-organization-id'];
    if (!organizationId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const userId = req.headers['x-user-id'];
    if (!userId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const { templateId, title, content, parties, category, startDate, endDate, variables, metadata, relatedToSubscriptionId, relatedToProposalId } = req.body;
    const contract = await contractService.createContract(
      organizationId,
      {
        templateId,
        title,
        content,
        parties,
        category,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        variables,
        metadata,
        relatedToSubscriptionId,
        relatedToProposalId,
      },
      userId,
    );

    return { statusCode: 201, body: JSON.stringify(contract) };
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
    }
    console.error('Failed to create contract:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
}
