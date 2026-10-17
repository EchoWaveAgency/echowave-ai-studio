// GET /api/v1/projects/{id} - Get project details

import { projectService } from '../../../domains/delivery/services/ProjectService';
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

    const project = await projectService.getProjectById(projectId, organizationId);

    defaultLogger.info('Project retrieved', {
      organizationId,
      projectId,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(project),
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'not_found',
          message: 'Project not found',
        }),
      };
    }

    defaultLogger.error('Failed to retrieve project', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to retrieve project',
      }),
    };
  }
}
