// GET /api/v1/agent-executions - List agent executions

import { agentExecutionService } from '../../domains/ai/services/AgentExecutionService';
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

    const agentId = req.query.agentId;
    if (!agentId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'validation_error',
          message: 'Agent ID is required as query parameter',
        }),
      };
    }

    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 100;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;

    const result = await agentExecutionService.getAgentExecutions(agentId, organizationId, limit, offset);

    return {
      statusCode: 200,
      body: JSON.stringify({
        items: result.items,
        total: result.total,
        limit,
        offset,
      }),
    };
  } catch (error) {
    defaultLogger.error('Failed to list agent executions', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to list agent executions',
      }),
    };
  }
}
