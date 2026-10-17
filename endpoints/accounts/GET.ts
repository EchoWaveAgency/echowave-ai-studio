// GET /api/v1/accounts - List chart of accounts

import { accountingService } from '../../domains/finance/services/AccountingService';
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

    const type = req.query?.type;

    let accounts;
    if (type) {
      accounts = await accountingService.getAccountsByType(organizationId, type);
    } else {
      accounts = await accountingService.getChartOfAccounts(organizationId);
    }

    defaultLogger.info('Chart of accounts retrieved', {
      organizationId,
      count: accounts.length,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        items: accounts,
        total: accounts.length,
      }),
    };
  } catch (error) {
    defaultLogger.error('Failed to retrieve accounts', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to retrieve accounts',
      }),
    };
  }
}
