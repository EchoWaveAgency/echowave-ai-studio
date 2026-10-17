// PATCH /api/v1/deliverables/{id} - Update deliverable

import { deliverableService } from '../../../domains/delivery/services/DeliverableService';
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

    const deliverableId = req.params.id;
    if (!deliverableId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'validation_error',
          message: 'Deliverable ID is required',
        }),
      };
    }

    const userId = req.context?.userId;
    const { name, description, expectedDate, fileUrls, approvalNotes } = req.body;

    const deliverable = await deliverableService.updateDeliverable(
      deliverableId,
      organizationId,
      {
        name,
        description,
        expectedDate,
        fileUrls,
        approvalNotes,
      },
      userId
    );

    defaultLogger.info('Deliverable updated', {
      organizationId,
      deliverableId,
    });

    return {
      statusCode: 200,
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

    if (error instanceof NotFoundError) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'not_found',
          message: 'Deliverable not found',
        }),
      };
    }

    defaultLogger.error('Failed to update deliverable', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to update deliverable',
      }),
    };
  }
}
