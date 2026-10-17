import { PaymentService } from '../../domains/integrations/services/PaymentService';

const service = new PaymentService();

export default async function handler(req: any, res: any) {
  const { 'x-organization-id': organizationId } = req.headers;

  if (!organizationId) {
    return res.status(400).json({ error: 'x-organization-id header required' });
  }

  const { paymentId, methodId, status, reconciliationId, limit = 50, offset = 0 } = req.query;

  try {
    if (paymentId) {
      const payment = service.getPaymentById(organizationId, paymentId);
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }
      return res.status(200).json(payment);
    }

    if (methodId) {
      const method = service.getPaymentMethodById(organizationId, methodId);
      if (!method) {
        return res.status(404).json({ error: 'Payment method not found' });
      }
      return res.status(200).json(method);
    }

    if (reconciliationId) {
      const reconciliation = service.getReconciliationById(organizationId, reconciliationId);
      if (!reconciliation) {
        return res.status(404).json({ error: 'Reconciliation not found' });
      }
      return res.status(200).json(reconciliation);
    }

    if (status) {
      const payments = service.getPaymentsByStatus(
        organizationId,
        status,
        parseInt(limit),
        parseInt(offset)
      );
      return res.status(200).json(payments);
    }

    const payments = service.getOrganizationPayments(
      organizationId,
      parseInt(limit),
      parseInt(offset)
    );
    return res.status(200).json(payments);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
