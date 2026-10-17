// PATCH /api/v1/agent-executions/{id}/reject - Reject agent execution

import { agentExecutionService } from '../../../../domains/ai/services/AgentExecutionService';
import { ValidationError, NotFoundError } from '../../../../platform/errors/errors';
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

    const executionId = req.params.id;
    if (!executionId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'validation_error',
          message: 'Execution ID is required',
        }),
      };
    }

    const userId = req.context?.userId;
    const reason = req.body?.reason;

    const execution = await agentExecutionService.rejectExecution(executionId, organizationId, reason, userId);

    defaultLogger.info('Agent execution rejected', {
      organizationId,
      executionId,
      rejectedBy: userId,
      reason,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(execution),
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

    if (error instanceof NotFoundError) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'not_found',
          message: 'Agent execution not found',
        }),
      };
    }

    defaultLogger.error('Failed to reject agent execution', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to reject agent execution',
      }),
    };
  }
}
