// POST /api/v1/deliverables - Create deliverable

import { deliverableService } from '../../domains/delivery/services/DeliverableService';
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
    const { projectId, name, description, expectedDate, fileUrls } = req.body;

    const deliverable = await deliverableService.createDeliverable(
      organizationId,
      {
        projectId,
        name,
        description,
        expectedDate,
        fileUrls,
      },
      userId
    );

    defaultLogger.info('Deliverable created', {
      organizationId,
      deliverableId: deliverable.id,
      projectId,
    });

    return {
      statusCode: 201,
      body: JSON.stringify(deliverable),
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

    defaultLogger.error('Failed to create deliverable', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to create deliverable',
      }),
    };
  }
}
