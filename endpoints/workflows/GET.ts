// GET /api/v1/workflows - List workflows

import { workflowService } from '../../domains/ai/services/WorkflowService';
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

    const filters: any = {};
    if (req.query.status) {
      filters.status = req.query.status;
    }
    if (req.query.trigger) {
      filters.trigger = req.query.trigger;
    }

    const workflows = await workflowService.getOrganizationWorkflows(organizationId, filters);

    return {
      statusCode: 200,
      body: JSON.stringify({
        items: workflows,
        count: workflows.length,
      }),
    };
  } catch (error) {
    defaultLogger.error('Failed to list workflows', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to list workflows',
      }),
    };
  }
}
