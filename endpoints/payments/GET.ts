// GET /api/v1/payments - List payments

import { paymentService } from '../../domains/finance/services/PaymentService';
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

    const status = req.query?.status;
    const paymentMethod = req.query?.paymentMethod;
    const startDate = req.query?.startDate;
    const endDate = req.query?.endDate;
    const limit = parseInt(req.query?.limit || '100');
    const offset = parseInt(req.query?.offset || '0');

    const result = await paymentService.getOrganizationPayments(
      organizationId,
      {
        status,
        paymentMethod,
        startDate,
        endDate,
      },
      limit,
      offset
    );

    defaultLogger.info('Payments retrieved', {
      organizationId,
      count: result.items.length,
      total: result.total,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    defaultLogger.error('Failed to retrieve payments', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to retrieve payments',
      }),
    };
  }
}
