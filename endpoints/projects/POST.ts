// POST /api/v1/projects - Create project

import { projectService } from '../../domains/delivery/services/ProjectService';
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
    const { clientId, contractId, name, description, startDate, targetEndDate, budget } = req.body;

    const project = await projectService.createProject(
      organizationId,
      {
        clientId,
        contractId,
        name,
        description,
        startDate,
        targetEndDate,
        budget,
      },
      userId
    );

    defaultLogger.info('Project created', {
      organizationId,
      projectId: project.id,
      clientId,
    });

    return {
      statusCode: 201,
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

    defaultLogger.error('Failed to create project', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to create project',
      }),
    };
  }
}
