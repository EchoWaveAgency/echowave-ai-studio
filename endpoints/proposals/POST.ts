// POST /api/v1/proposals - Create a new proposal

import { proposalService } from '../../domains/sales/services/ProposalService';
import { ValidationError } from '../../platform/errors/errors';
import { defaultLogger } from '../../platform/logging/logger';

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

    const userId = req.context?.userId;
    const {
      clientId,
      leadId,
      opportunityId,
      title,
      description,
      validUntilDate,
      lineItems,
      discount,
      notes,
      internalNotes,
    } = req.body;

    const proposal = await proposalService.createProposal(
      organizationId,
      {
        clientId,
        leadId,
        opportunityId,
        title,
        description,
        validUntilDate,
        lineItems,
        discount,
        notes,
        internalNotes,
      },
      userId
    );

    defaultLogger.info(`Proposal created: ${proposal.id}`, {
      organizationId,
      clientId,
      finalPrice: proposal.finalPrice,
    });

    return {
      statusCode: 201,
      body: JSON.stringify(proposal),
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'validation_error',
          message: error.message,
          fields: error.context,
        }),
      };
    }

    defaultLogger.error('Failed to create proposal', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to create proposal',
      }),
    };
  }
}
