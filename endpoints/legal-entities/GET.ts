// GET /api/v1/legal-entities - List legal entities

import { taxService } from '../../domains/finance/services/TaxService';
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

    const activeOnly = req.query?.activeOnly === 'true';

    const entities = await taxService.getOrganizationLegalEntities(organizationId, activeOnly);

    defaultLogger.info('Legal entities retrieved', {
      organizationId,
      count: entities.length,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        items: entities,
        total: entities.length,
      }),
    };
  } catch (error) {
    defaultLogger.error('Failed to retrieve legal entities', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to retrieve legal entities',
      }),
    };
  }
}
