// PATCH /api/v1/contacts/{id}/consent - Update contact consent preferences

import { contactService } from '../../../../domains/crm/services/ContactService';
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

    const contactId = req.params.id;
    if (!contactId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'validation_error',
          message: 'Contact ID is required',
        }),
      };
    }

    const { marketing, email, phone } = req.body;

    // Update consent with only provided fields
    const contact = await contactService.updateConsent(contactId, organizationId, {
      ...(marketing !== undefined && { marketing }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
    });

    defaultLogger.info('Contact consent updated', {
      organizationId,
      contactId,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(contact),
    };
  } catch (error) {
    defaultLogger.error('Failed to update contact consent', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to update contact consent',
      }),
    };
  }
}
