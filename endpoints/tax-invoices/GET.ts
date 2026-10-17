// GET /api/v1/tax-invoices - List tax invoices by entity

import { taxService } from '../../domains/finance/services/TaxService';
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

    const legalEntityId = req.query?.legalEntityId;
    if (!legalEntityId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'validation_error',
          message: 'legalEntityId query parameter is required',
        }),
      };
    }

    const limit = parseInt(req.query?.limit || '100');
    const offset = parseInt(req.query?.offset || '0');

    const result = await taxService.getTaxInvoicesByEntity(
      legalEntityId,
      organizationId,
      limit,
      offset
    );

    defaultLogger.info('Tax invoices retrieved', {
      organizationId,
      legalEntityId,
      count: result.items.length,
      total: result.total,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    defaultLogger.error('Failed to retrieve tax invoices', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to retrieve tax invoices',
      }),
    };
  }
}
