// PATCH /api/v1/services/{id}/toggle - Toggle service active status

import { serviceCatalogService } from '../../../../domains/sales/services/ServiceCatalogService';
import { NotFoundError } from '../../../../platform/errors/errors';
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

    const serviceId = req.params.id;
    if (!serviceId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'validation_error',
          message: 'Service ID is required',
        }),
      };
    }

    const { isActive } = req.body;
    if (isActive === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'validation_error',
          message: 'isActive is required',
        }),
      };
    }

    const userId = req.context?.userId;

    const service = await serviceCatalogService.toggleActive(
      serviceId,
      organizationId,
      isActive,
      userId
    );

    defaultLogger.info('Service item toggled', {
      organizationId,
      serviceId,
      isActive,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(service),
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'not_found',
          message: 'Service not found',
        }),
      };
    }

    defaultLogger.error('Failed to toggle service', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to toggle service',
      }),
    };
  }
}
