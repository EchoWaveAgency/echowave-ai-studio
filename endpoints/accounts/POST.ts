// POST /api/v1/accounts - Create account

import { accountingService } from '../../domains/finance/services/AccountingService';
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
    const { accountNumber, name, type } = req.body;

    const account = await accountingService.createAccount(organizationId, {
      accountNumber,
      name,
      type,
    });

    defaultLogger.info('Account created', {
      organizationId,
      accountId: account.id,
      accountNumber: account.accountNumber,
      createdBy: userId,
    });

    return {
      statusCode: 201,
      body: JSON.stringify(account),
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

    defaultLogger.error('Failed to create account', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to create account',
      }),
    };
  }
}
