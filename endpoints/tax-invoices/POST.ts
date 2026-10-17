// POST /api/v1/tax-invoices - Create tax invoice

import { taxService } from '../../domains/finance/services/TaxService';
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
    const { legalEntityId, issueDate, dueDate, documentId, clientTaxNumber } = req.body;

    const invoice = await taxService.issueTaxInvoice(
      organizationId,
      legalEntityId,
      {
        issueDate,
        dueDate,
        documentId,
        clientTaxNumber,
      },
      userId
    );

    defaultLogger.info('Tax invoice created', {
      organizationId,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      createdBy: userId,
    });

    return {
      statusCode: 201,
      body: JSON.stringify(invoice),
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

    defaultLogger.error('Failed to create tax invoice', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to create tax invoice',
      }),
    };
  }
}
