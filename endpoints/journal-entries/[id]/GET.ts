// GET /api/v1/journal-entries/{id} - Get journal entry by ID

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

    const entryId = req.params.id;
    if (!entryId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'validation_error',
          message: 'Entry ID is required',
        }),
      };
    }

    const entry = await accountingService.getJournalEntryById(entryId, organizationId);

    defaultLogger.info('Journal entry retrieved', {
      organizationId,
      entryId,
      status: entry.status,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(entry),
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'not_found',
          message: 'Journal entry not found',
        }),
      };
    }

    defaultLogger.error('Failed to retrieve journal entry', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to retrieve journal entry',
      }),
    };
  }
}
