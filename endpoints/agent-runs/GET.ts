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
    const { runId, agentId, limit = 50, offset = 0 } = req.query;

    if (runId) {
      const run = await orchestrator.getRunById(organizationId, runId);
      return {
        statusCode: 200,
        body: JSON.stringify(run),
      };
    }

    if (agentId) {
      const result = await orchestrator.getRunsByAgent(organizationId, agentId, limit, offset);
      return {
        statusCode: 200,
        body: JSON.stringify(result),
      };
    }

    const result = await orchestrator.getOrganizationRuns(organizationId, limit, offset);
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
