// GET /api/v1/accounts/{id} - Get account by ID

import { accountingService } from '../../../domains/finance/services/AccountingService';
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

    const accountId = req.params.id;
    if (!accountId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'validation_error',
          message: 'Account ID is required',
        }),
      };
    }

    const account = await accountingService.getAccountById(accountId, organizationId);

    defaultLogger.info('Account retrieved', {
      organizationId,
      accountId,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(account),
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'not_found',
          message: 'Account not found',
        }),
      };
    }

    defaultLogger.error('Failed to retrieve account', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to retrieve account',
      }),
    };
  }
}
