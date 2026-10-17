// PATCH /api/v1/contacts/{id} - Update contact details

import { contactService } from '../../../domains/crm/services/ContactService';
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

    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      country,
      postalCode,
      notes,
    } = req.body;

    // Update contact with only provided fields
    const contact = await contactService.updateContact(contactId, organizationId, {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(address && { address }),
      ...(city && { city }),
      ...(country && { country }),
      ...(postalCode && { postalCode }),
      ...(notes && { notes }),
    });

    defaultLogger.info('Contact updated', {
      organizationId,
      contactId,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(contact),
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

    defaultLogger.error('Failed to update contact', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to update contact',
      }),
    };
  }
}
