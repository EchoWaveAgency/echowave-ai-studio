// GET /api/v1/leads - List leads with pagination and filters

import { leadService } from '../../domains/crm/services/LeadService';
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
    const status = req.query.status;
    const source = req.query.source;
    const search = req.query.search;

    // Build filters object
    const filters: any = {};
    if (status) filters.status = status;
    if (source) filters.source = source;
    if (search) filters.search = search;

    // Get leads
    const result = await leadService.getOrganizationLeads(
      organizationId,
      Object.keys(filters).length > 0 ? filters : undefined,
      limit,
      offset
    );

    defaultLogger.info('Leads retrieved', {
      organizationId,
      count: result.leads.length,
      total: result.total,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: result.leads,
        pagination: {
          limit,
          offset,
          total: result.total,
          hasMore: offset + limit < result.total,
        },
      }),
    };
  } catch (error) {
    defaultLogger.error('Failed to retrieve leads', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to retrieve leads',
      }),
    };
  }
}
