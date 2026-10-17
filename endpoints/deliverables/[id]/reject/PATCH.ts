// PATCH /api/v1/deliverables/{id}/reject - Reject deliverable

import { deliverableService } from '../../../../domains/delivery/services/DeliverableService';
import { NotFoundError } from '../../../../platform/errors/errors';
import { defaultLogger } from '../../../../platform/logging/logger';

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
    const { notes } = req.body;

    const deliverable = await deliverableService.rejectDeliverable(
      deliverableId,
      organizationId,
      notes || '',
      userId
    );

    defaultLogger.info('Deliverable rejected', {
      organizationId,
      deliverableId,
      rejectedBy: userId,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(deliverable),
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'not_found',
          message: 'Deliverable not found',
        }),
      };
    }

    defaultLogger.error('Failed to reject deliverable', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to reject deliverable',
      }),
    };
  }
}
