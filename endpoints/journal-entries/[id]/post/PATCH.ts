// PATCH /api/v1/journal-entries/{id}/post - Post journal entry

import { accountingService } from '../../../../domains/finance/services/AccountingService';
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

    const userId = req.context?.userId;

    const entry = await accountingService.postJournalEntry(entryId, organizationId, userId);

    defaultLogger.info('Journal entry posted', {
      organizationId,
      entryId,
      postedBy: userId,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(entry),
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
          message: 'Journal entry not found',
        }),
      };
    }

    defaultLogger.error('Failed to post journal entry', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to post journal entry',
      }),
    };
  }
}
