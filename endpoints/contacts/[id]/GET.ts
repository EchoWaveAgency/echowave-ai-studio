// GET /api/v1/contacts/{id} - Retrieve a specific contact

import { contactService } from '../../../domains/crm/services/ContactService';
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

    const contact = await contactService.getContactById(contactId, organizationId);

    defaultLogger.info('Contact retrieved', {
      organizationId,
      contactId,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(contact),
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'not_found',
          message: 'Contact not found',
        }),
      };
    }

    defaultLogger.error('Failed to retrieve contact', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to retrieve contact',
      }),
    };
  }
}
