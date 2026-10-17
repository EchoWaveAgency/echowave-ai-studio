// PATCH /api/v1/services/{id} - Update service item

import { serviceCatalogService } from '../../../domains/sales/services/ServiceCatalogService';
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

    const userId = req.context?.userId;
    const { name, description, category, basePrice, deliveryDays } = req.body;

    const service = await serviceCatalogService.updateServiceItem(
      serviceId,
      organizationId,
      {
        name,
        description,
        category,
        basePrice,
        deliveryDays,
      },
      userId
    );

    defaultLogger.info('Service item updated', {
      organizationId,
      serviceId,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(service),
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

    if (error instanceof NotFoundError) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'not_found',
          message: 'Service not found',
        }),
      };
    }

    defaultLogger.error('Failed to update service item', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to update service item',
      }),
    };
  }
}
