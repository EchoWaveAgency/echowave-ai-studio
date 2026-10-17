import { OrchestratorService } from '../../domains/ai/services/OrchestratorService';

export default async function handler(req: any) {
  if (req.method !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const organizationId = req.headers['x-organization-id'];
  const userId = req.headers['x-user-id'];

  if (!organizationId || !userId) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Missing auth headers' }) };
  }

  try {
    const orchestrator = new OrchestratorService(null);
    const agent = await orchestrator.registerAgent(organizationId, req.body, userId);

    return {
      statusCode: 201,
      body: JSON.stringify(agent),
    };
  } catch (error: any) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
