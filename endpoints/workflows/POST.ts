// POST /api/v1/workflows - Create workflow

import { workflowService } from '../../domains/ai/services/WorkflowService';
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
    const input = req.body;

    const workflow = await workflowService.createWorkflow(organizationId, input, userId);

    defaultLogger.info('Workflow created', {
      organizationId,
      workflowId: workflow.id,
      workflowName: workflow.name,
      trigger: workflow.trigger,
      createdBy: userId,
    });

    return {
      statusCode: 201,
      body: JSON.stringify(workflow),
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'validation_error',
          message: error.message,
          fields: error.fields,
        }),
      };
    }

    defaultLogger.error('Failed to create workflow', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to create workflow',
      }),
    };
  }
}
