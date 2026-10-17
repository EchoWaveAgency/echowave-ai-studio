import type { VercelRequest, VercelResponse } from '@vercel/functions';
import { InvoiceViewService } from '../../domains/client-portal/services/InvoiceViewService';
import { ClientAccountService } from '../../domains/client-portal/services/ClientAccountService';

const invoiceViewService = new InvoiceViewService();
const clientAccountService = new ClientAccountService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const orgId = req.headers['x-organization-id'] as string;
  const { clientAccountId, invoiceId } = req.body;

  if (!orgId || !clientAccountId || !invoiceId) {
    return res.status(400).json({ error: 'Missing required fields: clientAccountId, invoiceId' });
  }

  try {
    const account = clientAccountService.getClientAccountById(orgId, clientAccountId);
    if (!account) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const invoice = invoiceViewService.markInvoiceAsViewed(orgId, clientAccountId, invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    return res.status(200).json(invoice);
  } catch (error) {
    console.error('Error marking invoice as viewed:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
