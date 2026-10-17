// PATCH /api/v1/tax-invoices/{id} - Update tax invoice amounts

import { taxService } from '../../../domains/finance/services/TaxService';
import { ValidationError, NotFoundError } from '../../../platform/errors/errors';
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

    const invoiceId = req.params.id;
    if (!invoiceId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'validation_error',
          message: 'Invoice ID is required',
        }),
      };
    }

    const { totalBeforeTax, taxAmount } = req.body;

    const invoice = await taxService.updateTaxInvoiceAmounts(
      invoiceId,
      organizationId,
      totalBeforeTax || 0,
      taxAmount || 0
    );

    defaultLogger.info('Tax invoice updated', {
      organizationId,
      invoiceId,
      totalAfterTax: invoice.totalAfterTax,
    });

    return {
      statusCode: 200,
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

    if (error instanceof NotFoundError) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'not_found',
          message: 'Tax invoice not found',
        }),
      };
    }

    defaultLogger.error('Failed to update tax invoice', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to update tax invoice',
      }),
    };
  }
}
