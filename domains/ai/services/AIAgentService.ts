import { db } from '../../../platform/database/db';
import { ValidationError, NotFoundError } from '../../../platform/errors/errors';
import { AIAgent, AIAgentCreateInput } from '../models/index';

export class AIAgentService {
  async createAgent(
    organizationId: string,
    input: AIAgentCreateInput,
    userId: string
  ): Promise<AIAgent> {
    if (!input.name || !input.name.trim()) {
      throw new ValidationError('Agent name is required', { name: 'Required' });
    }
    if (!input.type || !['workflow', 'assistant', 'specialist', 'decision_engine'].includes(input.type)) {
      throw new ValidationError('Invalid agent type', { type: 'Invalid value' });
    }
    if (!input.systemPrompt || !input.systemPrompt.trim()) {
      throw new ValidationError('System prompt is required', { systemPrompt: 'Required' });
    }
    if (!input.capabilities || input.capabilities.length === 0) {
      throw new ValidationError('At least one capability is required', { capabilities: 'Minimum 1 required' });
    }
    if (!input.riskLevel || !['low', 'medium', 'high'].includes(input.riskLevel)) {
      throw new ValidationError('Invalid risk level', { riskLevel: 'Invalid value' });
    }

    const agentId = crypto.randomUUID();
    const requiresApproval = input.requiresApproval ?? input.riskLevel !== 'low';

    const result = await db.query(
      `
      INSERT INTO ai_agents (
        id, organization_id, name, description, type, status, system_prompt, capabilities,
        risk_level, requires_approval, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, 'active', $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *
      `,
      [
        agentId,
        organizationId,
        input.name,
        input.description || null,
        input.type,
        input.systemPrompt,
        JSON.stringify(input.capabilities),
        input.riskLevel,
        requiresApproval,
        userId,
      ]
    );

    return this.mapToAgent(result.rows[0]);
  }

  async getAgentById(agentId: string, organizationId: string): Promise<AIAgent> {
    const result = await db.query(
      `SELECT * FROM ai_agents WHERE id = $1 AND organization_id = $2`,
      [agentId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Agent not found');
    }

    return this.mapToAgent(result.rows[0]);
  }

  async getOrganizationAgents(
    organizationId: string,
    filters: {
      type?: string;
      status?: string;
    } = {}
  ): Promise<AIAgent[]> {
    let query = `SELECT * FROM ai_agents WHERE organization_id = $1`;
    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (filters.type) {
      query += ` AND type = $${paramIndex}`;
      params.push(filters.type);
      paramIndex++;
    }
    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await db.query(query, params);
    return result.rows.map((row) => this.mapToAgent(row));
  }

  async updateAgentStatus(
    agentId: string,
    organizationId: string,
    status: string
  ): Promise<AIAgent> {
    if (!['active', 'inactive', 'archived'].includes(status)) {
      throw new ValidationError('Invalid status', { status: 'Invalid value' });
    }

    const result = await db.query(
      `
      UPDATE ai_agents
      SET status = $3, updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
      `,
      [agentId, organizationId, status]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Agent not found');
    }

    return this.mapToAgent(result.rows[0]);
  }

  async updateAgentCapabilities(
    agentId: string,
    organizationId: string,
    capabilities: string[]
  ): Promise<AIAgent> {
    if (capabilities.length === 0) {
      throw new ValidationError('At least one capability is required', {
        capabilities: 'Minimum 1 required',
      });
    }

    const result = await db.query(
      `
      UPDATE ai_agents
      SET capabilities = $3, updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *
      `,
      [agentId, organizationId, JSON.stringify(capabilities)]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Agent not found');
    }

    return this.mapToAgent(result.rows[0]);
  }

  private mapToAgent(row: any): AIAgent {
    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      description: row.description,
      type: row.type,
      status: row.status,
      systemPrompt: row.system_prompt,
      capabilities: JSON.parse(row.capabilities || '[]'),
      riskLevel: row.risk_level,
      requiresApproval: row.requires_approval,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const aiAgentService = new AIAgentService();
