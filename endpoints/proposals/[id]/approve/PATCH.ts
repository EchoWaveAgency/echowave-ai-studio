// PATCH /api/v1/proposals/{id}/approve - Approve proposal

import { proposalService } from '../../../../domains/sales/services/ProposalService';
import { ValidationError, NotFoundError } from '../../../../platform/errors/errors';
import { defaultLogger } from '../../../../platform/logging/logger';

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

    const userId = req.context?.userId;

    const proposal = await proposalService.approveProposal(proposalId, organizationId, userId);

    defaultLogger.info('Proposal approved', {
      organizationId,
      proposalId,
      approvedBy: userId,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(proposal),
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'validation_error',
          message: error.message,
        }),
      };
    }

    if (error instanceof NotFoundError) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'not_found',
          message: 'Proposal not found',
        }),
      };
    }

    defaultLogger.error('Failed to approve proposal', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to approve proposal',
      }),
    };
  }
}
