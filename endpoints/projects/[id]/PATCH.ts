// PATCH /api/v1/projects/{id} - Update project

import { projectService } from '../../../domains/delivery/services/ProjectService';
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

    const projectId = req.params.id;
    if (!projectId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'validation_error',
          message: 'Project ID is required',
        }),
      };
    }

    const userId = req.context?.userId;
    const { name, description, startDate, targetEndDate, budget, status, actualEndDate } = req.body;

    const project = await projectService.updateProject(
      projectId,
      organizationId,
      {
        name,
        description,
        startDate,
        targetEndDate,
        budget,
        status,
        actualEndDate,
      },
      userId
    );

    defaultLogger.info('Project updated', {
      organizationId,
      projectId,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(project),
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
          message: 'Project not found',
        }),
      };
    }

    defaultLogger.error('Failed to update project', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to update project',
      }),
    };
  }
}
