// GET /api/v1/leads/{id} - Retrieve a specific lead

import { leadService } from '../../../domains/crm/services/LeadService';
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

    const leadId = req.params.id;
    if (!leadId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'validation_error',
          message: 'Lead ID is required',
        }),
      };
    }

    const lead = await leadService.getLeadById(leadId, organizationId);

    defaultLogger.info('Lead retrieved', {
      organizationId,
      leadId,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(lead),
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'not_found',
          message: 'Lead not found',
        }),
      };
    }

    defaultLogger.error('Failed to retrieve lead', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to retrieve lead',
      }),
    };
  }
}
