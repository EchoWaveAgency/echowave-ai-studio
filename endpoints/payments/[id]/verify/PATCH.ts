// PATCH /api/v1/payments/{id}/verify - Verify payment

import { paymentService } from '../../../../domains/finance/services/PaymentService';
import { ValidationError, NotFoundError } from '../../../../platform/errors/errors';
import { defaultLogger } from '../../../../platform/logging/logger';

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

    const userId = req.context?.userId;

    const payment = await paymentService.verifyPayment(paymentId, organizationId, userId);

    defaultLogger.info('Payment verified', {
      organizationId,
      paymentId,
      verifiedBy: userId,
    });

    return {
      statusCode: 200,
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

    if (error instanceof NotFoundError) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'not_found',
          message: 'Payment not found',
        }),
      };
    }

    defaultLogger.error('Failed to verify payment', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to verify payment',
      }),
    };
  }
}
