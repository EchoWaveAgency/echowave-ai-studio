import { OrchestratorService } from '../../domains/ai/services/OrchestratorService';

export default async function handler(req: any) {
  if (req.method !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const organizationId = req.headers['x-organization-id'];
  if (!organizationId) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Missing auth header' }) };
  }

  try {
    const orchestrator = new OrchestratorService(null);
    const { agentId, type, limit = 50, offset = 0 } = req.query;

    if (agentId) {
      const agent = await orchestrator.getAgentById(organizationId, agentId);
      return {
        statusCode: 200,
        body: JSON.stringify(agent),
      };
    }

    if (type) {
      const agents = await orchestrator.getAgentsByType(organizationId, type);
      return {
        statusCode: 200,
        body: JSON.stringify({
          items: agents.slice(offset, offset + limit),
          total: agents.length,
        }),
      };
    }

    const result = await orchestrator.getOrganizationAgents(organizationId, limit, offset);
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error: any) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
