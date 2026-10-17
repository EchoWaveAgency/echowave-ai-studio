// GET /api/v1/tasks - List tasks for project

import { taskService } from '../../domains/delivery/services/TaskService';
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

    const projectId = req.query.projectId;
    if (!projectId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'validation_error',
          message: 'projectId query parameter is required',
        }),
      };
    }

    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;
    const status = req.query.status;
    const priority = req.query.priority;
    const assignedTo = req.query.assignedTo;

    const result = await taskService.getProjectTasks(
      projectId,
      organizationId,
      {
        status,
        priority,
        assignedTo,
      },
      limit,
      offset
    );

    defaultLogger.info('Tasks retrieved', {
      organizationId,
      projectId,
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
    defaultLogger.error('Failed to retrieve tasks', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to retrieve tasks',
      }),
    };
  }
}
