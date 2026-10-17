// GET /api/v1/journal-entries - List journal entries

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

    const startDate = req.query?.startDate;
    const endDate = req.query?.endDate;
    const limit = parseInt(req.query?.limit || '100');
    const offset = parseInt(req.query?.offset || '0');

    if (!startDate || !endDate) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'validation_error',
          message: 'startDate and endDate are required',
        }),
      };
    }

    const result = await accountingService.getJournalEntriesByDate(
      organizationId,
      startDate,
      endDate,
      limit,
      offset
    );

    defaultLogger.info('Journal entries retrieved', {
      organizationId,
      count: result.items.length,
      total: result.total,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    defaultLogger.error('Failed to retrieve journal entries', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to retrieve journal entries',
      }),
    };
  }
}
