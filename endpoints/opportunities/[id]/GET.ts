// GET /api/v1/opportunities/{id} - Retrieve a specific opportunity

import { opportunityService } from '../../../domains/crm/services/OpportunityService';
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

    const opportunityId = req.params.id;
    if (!opportunityId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'validation_error',
          message: 'Opportunity ID is required',
        }),
      };
    }

    const opportunity = await opportunityService.getOpportunityById(
      opportunityId,
      organizationId
    );

    defaultLogger.info('Opportunity retrieved', {
      organizationId,
      opportunityId,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(opportunity),
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'not_found',
          message: 'Opportunity not found',
        }),
      };
    }

    defaultLogger.error('Failed to retrieve opportunity', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to retrieve opportunity',
      }),
    };
  }
}
