// GET /api/v1/services/{id} - Get service catalog item

import { serviceCatalogService } from '../../../domains/sales/services/ServiceCatalogService';
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

    const service = await serviceCatalogService.getServiceItemById(serviceId, organizationId);

    defaultLogger.info('Service item retrieved', {
      organizationId,
      serviceId,
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

    defaultLogger.error('Failed to retrieve service item', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to retrieve service item',
      }),
    };
  }
}
