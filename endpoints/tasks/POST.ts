// POST /api/v1/tasks - Create task

import { taskService } from '../../domains/delivery/services/TaskService';
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
    const { projectId, phaseId, title, description, priority, dueDate, estimatedHours, assignedTo } =
      req.body;

    const task = await taskService.createTask(
      organizationId,
      {
        projectId,
        phaseId,
        title,
        description,
        priority,
        dueDate,
        estimatedHours,
        assignedTo,
      },
      userId
    );

    defaultLogger.info('Task created', {
      organizationId,
      taskId: task.id,
      projectId,
    });

    return {
      statusCode: 201,
      body: JSON.stringify(task),
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

    defaultLogger.error('Failed to create task', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to create task',
      }),
    };
  }
}
