// GET /api/v1/payments/{id} - Get payment by ID

import { paymentService } from '../../../domains/finance/services/PaymentService';
import { NotFoundError } from '../../../platform/errors/errors';
import { defaultLogger } from '../../../platform/logging/logger';

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

    const paymentId = req.params.id;
    if (!paymentId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'validation_error',
          message: 'Payment ID is required',
        }),
      };
    }

    const payment = await paymentService.getPaymentById(paymentId, organizationId);

    defaultLogger.info('Payment retrieved', {
      organizationId,
      paymentId,
      status: payment.status,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(payment),
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'not_found',
          message: 'Payment not found',
        }),
      };
    }

    defaultLogger.error('Failed to retrieve payment', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to retrieve payment',
      }),
    };
  }
}
