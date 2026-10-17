// POST /api/v1/journal-entries - Create journal entry

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
    const { entryDate, description, reference, legalEntityId, lines } = req.body;

    const entry = await accountingService.createJournalEntry(
      organizationId,
      {
        entryDate,
        description,
        reference,
        legalEntityId,
        lines,
      },
      userId
    );

    defaultLogger.info('Journal entry created', {
      organizationId,
      entryId: entry.id,
      lineCount: entry.lines.length,
      createdBy: userId,
    });

    return {
      statusCode: 201,
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

    defaultLogger.error('Failed to create journal entry', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to create journal entry',
      }),
    };
  }
}
