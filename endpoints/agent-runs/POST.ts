import { OrchestratorService } from '../../domains/ai/services/OrchestratorService';

export default async function handler(req: any) {
  if (req.method !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const organizationId = req.headers['x-organization-id'];
  if (!organizationId) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Missing auth header' }) };
  }

  try {
    const orchestrator = new OrchestratorService(null);
    const { agentId, input } = req.body;

    if (!agentId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Agent ID is required' }) };
    }

    const run = await orchestrator.runAgent(organizationId, agentId, input || {});

    return {
      statusCode: 201,
      body: JSON.stringify(run),
    };
  } catch (error: any) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
