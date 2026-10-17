// POST /api/v1/leads - Create a new lead

import { leadService } from '../../domains/crm/services/LeadService';
import { ValidationError } from '../../platform/errors/errors';
import { defaultLogger } from '../../platform/logging/logger';

export default async function handler(req: any) {
  try {
    // Extract organization from auth context
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

    const { name, email, phone, message, serviceInterest, source } = req.body;

    // Create lead via service
    const lead = await leadService.createLead(organizationId, {
      name,
      email,
      phone,
      message,
      serviceInterest,
      status: 'new',
      source: source || 'website',
    });

    defaultLogger.info(`Lead created via API: ${lead.id}`, {
      organizationId,
      source,
    });

    return {
      statusCode: 201,
      body: JSON.stringify(lead),
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

    defaultLogger.error('Failed to create lead', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to create lead',
      }),
    };
  }
}
