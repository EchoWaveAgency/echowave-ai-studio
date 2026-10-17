// POST /api/v1/ai-agents - Create AI agent

import { aiAgentService } from '../../domains/ai/services/AIAgentService';
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

    const agent = await aiAgentService.createAgent(organizationId, input, userId);

    defaultLogger.info('AI agent created', {
      organizationId,
      agentId: agent.id,
      agentName: agent.name,
      agentType: agent.type,
      createdBy: userId,
    });

    return {
      statusCode: 201,
      body: JSON.stringify(agent),
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

    defaultLogger.error('Failed to create AI agent', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to create AI agent',
      }),
    };
  }
}
