// GET /api/v1/proposals - List proposals

import { proposalService } from '../../domains/sales/services/ProposalService';
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

    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;
    const status = req.query.status;
    const clientId = req.query.clientId;

    const result = await proposalService.getOrganizationProposals(
      organizationId,
      { status, clientId },
      limit,
      offset
    );

    defaultLogger.info('Proposals retrieved', {
      organizationId,
      count: result.proposals.length,
      total: result.total,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        proposals: result.proposals,
        pagination: {
          limit,
          offset,
          total: result.total,
          hasMore: offset + limit < result.total,
        },
      }),
    };
  } catch (error) {
    defaultLogger.error('Failed to retrieve proposals', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to retrieve proposals',
      }),
    };
  }
}
