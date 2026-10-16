// PATCH /api/v1/opportunities/{id}/stage - Update opportunity stage

import { opportunityService } from '../../../../domains/crm/services/OpportunityService';
import { ValidationError } from '../../../../platform/errors/errors';
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

    const { stage } = req.body;

    if (!stage) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'validation_error',
          message: 'Stage is required',
        }),
      };
    }

    // Update opportunity stage
    const opportunity = await opportunityService.updateStage(
      opportunityId,
      organizationId,
      stage
    );

    defaultLogger.info('Opportunity stage updated', {
      organizationId,
      opportunityId,
      stage,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(opportunity),
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

    defaultLogger.error('Failed to update opportunity stage', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to update opportunity stage',
      }),
    };
  }
}
