import { invoiceService } from '../../domains/subscriptions/services/InvoiceService';
import { ValidationError } from '../../platform/errors/errors';

export default async function handler(req: any) {
  if (req.method !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const organizationId = req.headers['x-organization-id'];
    if (!organizationId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const { customerId, subscriptionId, issueDate, dueDate, items, notes, paymentTerms, metadata, taxRate } = req.body;
    const invoice = await invoiceService.createInvoice(
      organizationId,
      {
        customerId,
        subscriptionId,
        issueDate,
        dueDate,
        items,
        notes,
        paymentTerms,
        metadata,
      },
      taxRate || 0.14
    );

    return { statusCode: 201, body: JSON.stringify(invoice) };
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
    }
    console.error('Failed to create invoice:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
}
