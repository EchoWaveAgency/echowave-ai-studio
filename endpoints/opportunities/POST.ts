// POST /api/v1/opportunities - Create a new opportunity

import { opportunityService } from '../../domains/crm/services/OpportunityService';
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

    const {
      leadId,
      title,
      description,
      value,
      currency,
      stage,
      expectedCloseDate,
      probability,
      notes,
    } = req.body;

    // Create opportunity via service
    const opportunity = await opportunityService.createOpportunity(organizationId, {
      leadId,
      title,
      description,
      value,
      currency,
      stage,
      expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
      probability,
      notes,
    });

    defaultLogger.info(`Opportunity created via API: ${opportunity.id}`, {
      organizationId,
      leadId,
      stage,
      value,
    });

    return {
      statusCode: 201,
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

    defaultLogger.error('Failed to create opportunity', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to create opportunity',
      }),
    };
  }
}
