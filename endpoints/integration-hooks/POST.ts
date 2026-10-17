// POST /api/v1/integration-hooks - Create integration hook

import { integrationHookService } from '../../domains/ai/services/IntegrationHookService';
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
    const input = req.body;

    const hook = await integrationHookService.createHook(organizationId, input, userId);

    defaultLogger.info('Integration hook created', {
      organizationId,
      hookId: hook.id,
      hookName: hook.name,
      service: hook.service,
      eventType: hook.eventType,
      createdBy: userId,
    });

    return {
      statusCode: 201,
      body: JSON.stringify(hook),
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

    defaultLogger.error('Failed to create integration hook', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to create integration hook',
      }),
    };
  }
}
