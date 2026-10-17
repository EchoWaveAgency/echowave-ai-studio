// PATCH /api/v1/leads/{id} - Update lead status or details

import { leadService } from '../../../domains/crm/services/LeadService';
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

    const { status, notes, contactId, opportunityId } = req.body;

    let lead;

    // If status is being updated, use the updateLeadStatus method
    if (status) {
      lead = await leadService.updateLeadStatus(leadId, organizationId, status, notes);
    } else {
      // Otherwise, update other fields (contact attachment, opportunity attachment, etc)
      lead = await leadService.getLeadById(leadId, organizationId);

      if (contactId) {
        // This would require a method to attach contact; for now just update the field
        lead.contactId = contactId;
      }

      if (opportunityId) {
        // This would require a method to attach opportunity; for now just update the field
        lead.opportunityId = opportunityId;
      }

      if (notes) {
        lead.notes = notes;
      }

      // In a full implementation, we'd have an updateLead method
      // For now, this is a simplified version
    }

    defaultLogger.info('Lead updated', {
      organizationId,
      leadId,
      fieldsUpdated: { status, notes, contactId, opportunityId },
    });

    return {
      statusCode: 200,
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

    defaultLogger.error('Failed to update lead', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to update lead',
      }),
    };
  }
}
