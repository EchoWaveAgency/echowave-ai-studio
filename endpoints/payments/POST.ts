import { PaymentService } from '../../domains/integrations/services/PaymentService';

const service = new PaymentService();

export default async function handler(req: any, res: any) {
  const { 'x-organization-id': organizationId } = req.headers;

  if (!organizationId) {
    return res.status(400).json({ error: 'x-organization-id header required' });
  }

  const { action, amount, currency, gatewayType, externalTransactionId, description, documentId, invoiceId, paymentMethodId } = req.body;

  try {
    if (action === 'create_payment') {
      const payment = service.createPayment(
        organizationId,
        amount,
        currency,
        gatewayType,
        externalTransactionId,
        description,
        documentId,
        invoiceId,
        paymentMethodId
      );
      return res.status(201).json(payment);
    } else if (action === 'authorize') {
      const { paymentId } = req.body;
      const payment = service.authorizePayment(organizationId, paymentId);
      return res.status(200).json(payment);
    } else if (action === 'capture') {
      const { paymentId } = req.body;
      const payment = service.capturePayment(organizationId, paymentId);
      return res.status(200).json(payment);
    } else if (action === 'refund') {
      const { paymentId } = req.body;
      const payment = service.refundPayment(organizationId, paymentId);
      return res.status(200).json(payment);
    } else if (action === 'fail') {
      const { paymentId, failureReason } = req.body;
      const payment = service.failPayment(organizationId, paymentId, failureReason);
      return res.status(200).json(payment);
    } else if (action === 'add_method') {
      const { methodType, displayName, last4Digits, expiryDate, cardBrand } = req.body;
      const method = service.addPaymentMethod(
        organizationId,
        methodType,
        displayName,
        last4Digits,
        expiryDate,
        cardBrand
      );
      return res.status(201).json(method);
    } else if (action === 'webhook_event') {
      const { subscriptionId, eventType, payload } = req.body;
      const event = service.createWebhookEvent(organizationId, subscriptionId, eventType, payload);
      return res.status(201).json(event);
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
