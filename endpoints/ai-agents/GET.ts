// GET /api/v1/ai-agents - List AI agents

import { aiAgentService } from '../../domains/ai/services/AIAgentService';
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

    const filters: any = {};
    if (req.query.type) {
      filters.type = req.query.type;
    }
    if (req.query.status) {
      filters.status = req.query.status;
    }

    const agents = await aiAgentService.getOrganizationAgents(organizationId, filters);

    return {
      statusCode: 200,
      body: JSON.stringify({
        items: agents,
        count: agents.length,
      }),
    };
  } catch (error) {
    defaultLogger.error('Failed to list AI agents', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to list AI agents',
      }),
    };
  }
}
