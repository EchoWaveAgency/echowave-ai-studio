// GET /api/v1/services - List service catalog items

import { serviceCatalogService } from '../../domains/sales/services/ServiceCatalogService';
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

    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;
    const category = req.query.category;
    const isActive = req.query.isActive === 'true';

    const result = await serviceCatalogService.getOrganizationServices(
      organizationId,
      {
        category,
        isActive: req.query.isActive !== undefined ? isActive : undefined,
      },
      limit,
      offset
    );

    defaultLogger.info('Service catalog items retrieved', {
      organizationId,
      count: result.items.length,
      total: result.total,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        items: result.items,
        pagination: {
          limit,
          offset,
          total: result.total,
          hasMore: offset + limit < result.total,
        },
      }),
    };
  } catch (error) {
    defaultLogger.error('Failed to retrieve service items', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to retrieve service items',
      }),
    };
  }
}
