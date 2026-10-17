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
  const { clientAccountId, projectId, deliverableId, feedback } = req.body;

  if (!orgId || !clientAccountId || !projectId || !deliverableId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const account = clientAccountService.getClientAccountById(orgId, clientAccountId);
    if (!account) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const deliverable = projectViewService.addFeedbackToDeliverable(
      orgId,
      clientAccountId,
      projectId,
      deliverableId,
      feedback || ''
    );

    return res.status(201).json(deliverable);
  } catch (error) {
    console.error('Error adding deliverable feedback:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
