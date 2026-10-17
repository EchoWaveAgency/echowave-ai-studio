// POST /api/v1/agent-executions - Execute agent

import { agentExecutionService } from '../../domains/ai/services/AgentExecutionService';
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

    const execution = await agentExecutionService.executeAgent(organizationId, input, userId);

    defaultLogger.info('Agent execution started', {
      organizationId,
      executionId: execution.id,
      agentId: execution.agentId,
      status: execution.status,
      executedBy: userId,
    });

    return {
      statusCode: 201,
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

    defaultLogger.error('Failed to execute agent', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to execute agent',
      }),
    };
  }
}
