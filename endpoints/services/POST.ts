// POST /api/v1/services - Create service catalog item

import { serviceCatalogService } from '../../domains/sales/services/ServiceCatalogService';
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

    const userId = req.context?.userId;
    const { name, description, category, basePrice, currency, deliveryDays } = req.body;

    const service = await serviceCatalogService.createServiceItem(
      organizationId,
      {
        name,
        description,
        category,
        basePrice,
        currency,
        deliveryDays,
      },
      userId
    );

    defaultLogger.info('Service catalog item created', {
      organizationId,
      category,
      basePrice,
    });

    return {
      statusCode: 201,
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

    defaultLogger.error('Failed to create service item', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to create service item',
      }),
    };
  }
}
