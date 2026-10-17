import type { VercelRequest, VercelResponse } from '@vercel/functions';
import { ProjectViewService } from '../../domains/client-portal/services/ProjectViewService';
import { ClientAccountService } from '../../domains/client-portal/services/ClientAccountService';

const projectViewService = new ProjectViewService();
const clientAccountService = new ClientAccountService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const orgId = req.headers['x-organization-id'] as string;
  const clientAccountId = req.query.clientAccountId as string;
  const projectId = req.query.projectId as string;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = parseInt(req.query.offset as string) || 0;

  if (!orgId || !clientAccountId) {
    return res.status(400).json({ error: 'Missing required fields: clientAccountId' });
  }

  try {
    const account = clientAccountService.getClientAccountById(orgId, clientAccountId);
    if (!account) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (projectId) {
      const projectView = projectViewService.getClientProjectView(orgId, clientAccountId, projectId);
      if (!projectView) {
        return res.status(404).json({ error: 'Project not found' });
      }
      return res.status(200).json(projectView);
    }

    const projects = projectViewService.getClientProjects(orgId, clientAccountId, limit, offset);
    return res.status(200).json(projects);
  } catch (error) {
    console.error('Error retrieving project views:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
