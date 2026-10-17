import type { VercelRequest, VercelResponse } from '@vercel/functions';
import { PortalService } from '../../domains/client-portal/services/PortalService';
import { ClientAccountService } from '../../domains/client-portal/services/ClientAccountService';

const portalService = new PortalService();
const clientAccountService = new ClientAccountService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const orgId = req.headers['x-organization-id'] as string;
  const { clientAccountId, fromPortalUserId, toPortalUserId, messageText, threadId, attachmentUrls } = req.body;

  if (!orgId || !clientAccountId || !messageText) {
    return res.status(400).json({ error: 'Missing required fields: clientAccountId, messageText' });
  }

  try {
    const account = clientAccountService.getClientAccountById(orgId, clientAccountId);
    if (!account) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const message = portalService.createMessage(
      orgId,
      clientAccountId,
      fromPortalUserId,
      toPortalUserId,
      messageText,
      threadId,
      attachmentUrls
    );

    return res.status(201).json(message);
  } catch (error) {
    console.error('Error creating message:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
