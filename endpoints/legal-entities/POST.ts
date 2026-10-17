// POST /api/v1/legal-entities - Create legal entity

import { taxService } from '../../domains/finance/services/TaxService';
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

    const { name, countryCode, registrationNumber, taxNumber, registrationDate } = req.body;

    const entity = await taxService.createLegalEntity(organizationId, {
      name,
      countryCode,
      registrationNumber,
      taxNumber,
      registrationDate,
    });

    defaultLogger.info('Legal entity created', {
      organizationId,
      entityId: entity.id,
      countryCode: entity.countryCode,
    });

    return {
      statusCode: 201,
      body: JSON.stringify(entity),
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'validation_error',
          message: error.message,
          fields: error.fields,
        }),
      };
    }

    defaultLogger.error('Failed to create legal entity', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to create legal entity',
      }),
    };
  }
}
