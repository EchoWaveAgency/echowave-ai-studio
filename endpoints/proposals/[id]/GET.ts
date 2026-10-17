// GET /api/v1/proposals/{id} - Retrieve proposal

import { proposalService } from '../../../domains/sales/services/ProposalService';
import { NotFoundError } from '../../../platform/errors/errors';
import { defaultLogger } from '../../../platform/logging/logger';

export default async function handler(req: any) {
  try {
    const organizationId = req.context?.organizationId;
    if (!organizationId) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          error: 'unauthorized',
          message: 'Authentication required',
        }),
      };
    }

    const proposalId = req.params.id;
    if (!proposalId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'validation_error',
          message: 'Proposal ID is required',
        }),
      };
    }

    const proposal = await proposalService.getProposalById(proposalId, organizationId);
    const lineItems = await proposalService.getProposalLineItems(proposalId, organizationId);

    defaultLogger.info('Proposal retrieved', {
      organizationId,
      proposalId,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        ...proposal,
        lineItems,
      }),
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'not_found',
          message: 'Proposal not found',
        }),
      };
    }

    defaultLogger.error('Failed to retrieve proposal', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to retrieve proposal',
      }),
    };
  }
}
