// POST /api/v1/ai-evaluations - Create AI evaluation

import { aiEvaluationService } from '../../domains/ai/services/AIEvaluationService';
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

    const evaluation = await aiEvaluationService.createEvaluation(organizationId, input, userId);

    defaultLogger.info('AI evaluation created', {
      organizationId,
      evaluationId: evaluation.id,
      agentId: evaluation.agentId,
      metric: evaluation.metric,
      score: evaluation.score,
      evaluatedBy: userId,
    });

    return {
      statusCode: 201,
      body: JSON.stringify(evaluation),
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

    defaultLogger.error('Failed to create AI evaluation', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to create AI evaluation',
      }),
    };
  }
}
