// POST /api/v1/contacts - Create a new contact

import { contactService } from '../../domains/crm/services/ContactService';
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
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      country,
      postalCode,
      notes,
      consentMarketing,
      consentEmail,
      consentPhone,
    } = req.body;

    // Create contact via service
    const contact = await contactService.createContact(organizationId, {
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      country,
      postalCode,
      notes,
      consentMarketing: consentMarketing ?? true,
      consentEmail: consentEmail ?? true,
      consentPhone: consentPhone ?? false,
    });

    defaultLogger.info(`Contact created via API: ${contact.id}`, {
      organizationId,
      email,
    });

    return {
      statusCode: 201,
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

    defaultLogger.error('Failed to create contact', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to create contact',
      }),
    };
  }
}
