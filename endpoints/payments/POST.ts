// POST /api/v1/payments - Create payment

import { paymentService } from '../../domains/finance/services/PaymentService';
import { ValidationError } from '../../platform/errors/errors';
import { defaultLogger } from '../../platform/logging/logger';

export default async function handler(req: any) {
  try {
    const organizationId = req.context?.organizationId;
    if (!organizationId) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          error: 'unauthorized',
          message: 'Authentication required',
        }),
      };
    }

    const userId = req.context?.userId;
    const { amount, currency, paymentMethod, paymentSourceId, referenceNumber, documentId, reconciliationNotes } = req.body;

    const payment = await paymentService.createPayment(
      organizationId,
      {
        amount,
        currency,
        paymentMethod,
        paymentSourceId,
        referenceNumber,
        documentId,
        reconciliationNotes,
      },
      userId
    );

    defaultLogger.info('Payment created', {
      organizationId,
      paymentId: payment.id,
      amount: payment.amount,
      reportedBy: userId,
    });

    return {
      statusCode: 201,
      body: JSON.stringify(payment),
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'validation_error',
          message: error.message,
          fields: error.fields,
        }),
      };
    }

    defaultLogger.error('Failed to create payment', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to create payment',
      }),
    };
  }
}
