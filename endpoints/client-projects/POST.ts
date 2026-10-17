import type { VercelRequest, VercelResponse } from '@vercel/functions';
import { ProjectViewService } from '../../domains/client-portal/services/ProjectViewService';
import { ClientAccountService } from '../../domains/client-portal/services/ClientAccountService';

const projectViewService = new ProjectViewService();
const clientAccountService = new ClientAccountService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const orgId = req.headers['x-organization-id'] as string;
  const { clientAccountId, projectId } = req.body;

  if (!orgId || !clientAccountId || !projectId) {
    return res.status(400).json({ error: 'Missing required fields: clientAccountId, projectId' });
  }

  try {
    const account = clientAccountService.getClientAccountById(orgId, clientAccountId);
    if (!account) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const projectView = projectViewService.createProjectViewForClient(
      orgId,
      clientAccountId,
      projectId
    );

    return res.status(201).json(projectView);
  } catch (error) {
    console.error('Error creating project view:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
