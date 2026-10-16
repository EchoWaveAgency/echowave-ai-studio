// GET /api/v1/opportunities - List opportunities with pagination and filters

import { opportunityService } from '../../domains/crm/services/OpportunityService';
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

    // Parse query parameters
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;
    const stage = req.query.stage;
    const leadId = req.query.leadId;

    // Build filters object
    const filters: any = {};
    if (stage) filters.stage = stage;
    if (leadId) filters.leadId = leadId;

    // Get opportunities
    const result = await opportunityService.getOrganizationOpportunities(
      organizationId,
      Object.keys(filters).length > 0 ? filters : undefined,
      limit,
      offset
    );

    defaultLogger.info('Opportunities retrieved', {
      organizationId,
      count: result.opportunities.length,
      total: result.total,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: result.opportunities,
        pagination: {
          limit,
          offset,
          total: result.total,
          hasMore: offset + limit < result.total,
        },
      }),
    };
  } catch (error) {
    defaultLogger.error('Failed to retrieve opportunities', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to retrieve opportunities',
      }),
    };
  }
}
