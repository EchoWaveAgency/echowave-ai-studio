import { invoiceService } from '../../domains/subscriptions/services/InvoiceService';

export default async function handler(req: any) {
  if (req.method !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const organizationId = req.headers['x-organization-id'];
    if (!organizationId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const customerId = req.query?.customerId;
    const status = req.query?.status;
    const limit = parseInt(req.query?.limit || '50', 10);
    const offset = parseInt(req.query?.offset || '0', 10);

    let result;
    if (customerId) {
      result = await invoiceService.getCustomerInvoices(organizationId, customerId, limit, offset);
    } else if (status) {
      result = await invoiceService.getInvoicesByStatus(organizationId, status, limit, offset);
    } else {
      result = { items: [], total: 0 };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: result.items,
        pagination: { limit, offset, total: result.total },
      }),
    };
  } catch (error: any) {
    console.error('Failed to list invoices:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
}
