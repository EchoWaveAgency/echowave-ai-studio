// GET /api/v1/projects - List projects

import { projectService } from '../../domains/delivery/services/ProjectService';
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
    const clientId = req.query.clientId;
    const status = req.query.status;

    const result = await projectService.getOrganizationProjects(
      organizationId,
      {
        clientId,
        status,
      },
      limit,
      offset
    );

    defaultLogger.info('Projects retrieved', {
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
    defaultLogger.error('Failed to retrieve projects', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to retrieve projects',
      }),
    };
  }
}
