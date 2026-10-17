// GET /api/v1/ai-agents/{id} - Get AI agent

import { aiAgentService } from '../../../domains/ai/services/AIAgentService';
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

    const agentId = req.params.id;
    if (!agentId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'validation_error',
          message: 'Agent ID is required',
        }),
      };
    }

    const agent = await aiAgentService.getAgentById(agentId, organizationId);

    return {
      statusCode: 200,
      body: JSON.stringify(agent),
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'not_found',
          message: 'AI agent not found',
        }),
      };
    }

    defaultLogger.error('Failed to retrieve AI agent', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to retrieve AI agent',
      }),
    };
  }
}
