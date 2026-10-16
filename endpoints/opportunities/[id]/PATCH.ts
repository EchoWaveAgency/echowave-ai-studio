// PATCH /api/v1/opportunities/{id} - Update opportunity details

import { opportunityService } from '../../../domains/crm/services/OpportunityService';
import { ValidationError } from '../../../platform/errors/errors';
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

    const {
      title,
      description,
      value,
      probability,
      expectedCloseDate,
      notes,
    } = req.body;

    // Update opportunity with only provided fields
    const opportunity = await opportunityService.updateOpportunity(
      opportunityId,
      organizationId,
      {
        ...(title && { title }),
        ...(description && { description }),
        ...(value && { value }),
        ...(probability !== undefined && { probability }),
        ...(expectedCloseDate && { expectedCloseDate: new Date(expectedCloseDate) }),
        ...(notes && { notes }),
      }
    );

    defaultLogger.info('Opportunity updated', {
      organizationId,
      opportunityId,
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

    defaultLogger.error('Failed to update opportunity', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to update opportunity',
      }),
    };
  }
}
