import type { VercelRequest, VercelResponse } from '@vercel/functions';
import { InvoiceViewService } from '../../domains/client-portal/services/InvoiceViewService';
import { ClientAccountService } from '../../domains/client-portal/services/ClientAccountService';

const invoiceViewService = new InvoiceViewService();
const clientAccountService = new ClientAccountService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const orgId = req.headers['x-organization-id'] as string;
  const clientAccountId = req.query.clientAccountId as string;
  const invoiceId = req.query.invoiceId as string;
  const paymentStatus = req.query.paymentStatus as string;
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

    if (invoiceId) {
      const invoice = invoiceViewService.getClientInvoiceView(orgId, clientAccountId, invoiceId);
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      return res.status(200).json(invoice);
    }

    const invoices = invoiceViewService.getClientInvoices(
      orgId,
      clientAccountId,
      paymentStatus as any,
      limit,
      offset
    );

    return res.status(200).json(invoices);
  } catch (error) {
    console.error('Error retrieving invoices:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
