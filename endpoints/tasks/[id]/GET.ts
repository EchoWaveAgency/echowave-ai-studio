// GET /api/v1/tasks/{id} - Get task details

import { taskService } from '../../../domains/delivery/services/TaskService';
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

    const taskId = req.params.id;
    if (!taskId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'validation_error',
          message: 'Task ID is required',
        }),
      };
    }

    const task = await taskService.getTaskById(taskId, organizationId);

    defaultLogger.info('Task retrieved', {
      organizationId,
      taskId,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(task),
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'not_found',
          message: 'Task not found',
        }),
      };
    }

    defaultLogger.error('Failed to retrieve task', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to retrieve task',
      }),
    };
  }
}
