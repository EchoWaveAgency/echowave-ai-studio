import type { VercelRequest, VercelResponse } from '@vercel/functions';
import { PortalService } from '../../domains/client-portal/services/PortalService';
import { ClientAccountService } from '../../domains/client-portal/services/ClientAccountService';

const portalService = new PortalService();
const clientAccountService = new ClientAccountService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const orgId = req.headers['x-organization-id'] as string;
  const clientAccountId = req.query.clientAccountId as string;
  const threadId = req.query.threadId as string;
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

    if (threadId) {
      const messages = portalService.getThreadMessages(orgId, clientAccountId, threadId, limit, offset);
      return res.status(200).json(messages);
    }

    const threads = portalService.getClientThreads(orgId, clientAccountId, limit, offset);
    return res.status(200).json(threads);
  } catch (error) {
    console.error('Error retrieving messages:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
