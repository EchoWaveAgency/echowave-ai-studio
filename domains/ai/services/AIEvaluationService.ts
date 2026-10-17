import { db } from '../../../platform/database/db';
import { ValidationError, NotFoundError } from '../../../platform/errors/errors';
import { AIEvaluation, AIEvaluationCreateInput } from '../models/index';

export class AIEvaluationService {
  async createEvaluation(
    organizationId: string,
    input: AIEvaluationCreateInput,
    userId: string
  ): Promise<AIEvaluation> {
    if (!input.agentId || !input.agentId.trim()) {
      throw new ValidationError('Agent ID is required', { agentId: 'Required' });
    }
    if (!input.executionId || !input.executionId.trim()) {
      throw new ValidationError('Execution ID is required', { executionId: 'Required' });
    }
    if (!input.metric || !['accuracy', 'relevance', 'safety', 'completeness', 'tone_match'].includes(input.metric)) {
      throw new ValidationError('Invalid metric', { metric: 'Invalid value' });
    }
    if (input.score < 0 || input.score > 100) {
      throw new ValidationError('Score must be between 0 and 100', { score: 'Invalid range' });
    }
    if (!input.feedback || !input.feedback.trim()) {
      throw new ValidationError('Feedback is required', { feedback: 'Required' });
    }

    const evaluationId = crypto.randomUUID();

    const result = await db.query(
      `
      INSERT INTO ai_evaluations (
        id, organization_id, agent_id, execution_id, metric, score, feedback,
        evaluated_by, evaluated_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
      `,
      [evaluationId, organizationId, input.agentId, input.executionId, input.metric, input.score, input.feedback, userId]
    );

    return this.mapToEvaluation(result.rows[0]);
  }

  async getEvaluationById(evaluationId: string, organizationId: string): Promise<AIEvaluation> {
    const result = await db.query(
      `SELECT * FROM ai_evaluations WHERE id = $1 AND organization_id = $2`,
      [evaluationId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Evaluation not found');
    }

    return this.mapToEvaluation(result.rows[0]);
  }

  async getEvaluationsByExecution(
    executionId: string,
    organizationId: string
  ): Promise<AIEvaluation[]> {
    const result = await db.query(
      `SELECT * FROM ai_evaluations WHERE execution_id = $1 AND organization_id = $2 ORDER BY evaluated_at DESC`,
      [executionId, organizationId]
    );

    return result.rows.map((row) => this.mapToEvaluation(row));
  }

  async getEvaluationsByAgent(
    agentId: string,
    organizationId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<{ items: AIEvaluation[]; total: number }> {
    const totalResult = await db.query(
      `SELECT COUNT(*) as count FROM ai_evaluations WHERE agent_id = $1 AND organization_id = $2`,
      [agentId, organizationId]
    );
    const total = totalResult.rows[0].count;

    const result = await db.query(
      `
      SELECT * FROM ai_evaluations
      WHERE agent_id = $1 AND organization_id = $2
      ORDER BY evaluated_at DESC
      LIMIT $3 OFFSET $4
      `,
      [agentId, organizationId, limit, offset]
    );

    return {
      items: result.rows.map((row) => this.mapToEvaluation(row)),
      total,
    };
  }

  async getAgentMetrics(
    agentId: string,
    organizationId: string
  ): Promise<{
    agentId: string;
    totalEvaluations: number;
    averageScore: number;
    metricBreakdown: Record<string, { count: number; averageScore: number }>;
  }> {
    const result = await db.query(
      `
      SELECT
        metric,
        COUNT(*) as count,
        ROUND(AVG(score)::numeric, 2) as average_score
      FROM ai_evaluations
      WHERE agent_id = $1 AND organization_id = $2
      GROUP BY metric
      `,
      [agentId, organizationId]
    );

    const metricBreakdown: Record<string, { count: number; averageScore: number }> = {};
    let totalCount = 0;
    let totalScore = 0;

    for (const row of result.rows) {
      metricBreakdown[row.metric] = {
        count: parseInt(row.count, 10),
        averageScore: parseFloat(row.average_score || '0'),
      };
      totalCount += parseInt(row.count, 10);
      totalScore += parseFloat(row.average_score || '0') * parseInt(row.count, 10);
    }

    const averageScore = totalCount > 0 ? totalScore / totalCount : 0;

    return {
      agentId,
      totalEvaluations: totalCount,
      averageScore: Math.round(averageScore * 100) / 100,
      metricBreakdown,
    };
  }

  private mapToEvaluation(row: any): AIEvaluation {
    return {
      id: row.id,
      organizationId: row.organization_id,
      agentId: row.agent_id,
      executionId: row.execution_id,
      metric: row.metric,
      score: row.score,
      feedback: row.feedback,
      evaluatedBy: row.evaluated_by,
      evaluatedAt: row.evaluated_at,
      createdAt: row.created_at,
    };
  }
}

export const aiEvaluationService = new AIEvaluationService();
