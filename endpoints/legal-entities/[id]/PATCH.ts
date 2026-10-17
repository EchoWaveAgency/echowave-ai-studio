// PATCH /api/v1/legal-entities/{id} - Update legal entity

import { taxService } from '../../../domains/finance/services/TaxService';
import { ValidationError, NotFoundError } from '../../../platform/errors/errors';
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

    const entityId = req.params.id;
    if (!entityId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'validation_error',
          message: 'Entity ID is required',
        }),
      };
    }

    const { registrationNumber, taxNumber, status, registrationDate } = req.body;

    const entity = await taxService.updateLegalEntity(entityId, organizationId, {
      registrationNumber,
      taxNumber,
      status,
      registrationDate,
    });

    defaultLogger.info('Legal entity updated', {
      organizationId,
      entityId,
      newStatus: entity.status,
    });

    return {
      statusCode: 200,
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

    if (error instanceof NotFoundError) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'not_found',
          message: 'Legal entity not found',
        }),
      };
    }

    defaultLogger.error('Failed to update legal entity', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to update legal entity',
      }),
    };
  }
}
