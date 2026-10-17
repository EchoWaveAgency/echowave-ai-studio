import {
  AIAgent, AgentRun, AgentTool, AgentApproval, AgentEvaluation,
  ToolCall, AGENT_TYPES, AGENT_STATUSES, TOOL_CATEGORIES, APPROVAL_STATUSES
} from '../models';

export class OrchestratorService {
  private agents: Map<string, AIAgent> = new Map();
  private agentRuns: Map<string, AgentRun> = new Map();
  private tools: Map<string, AgentTool> = new Map();
  private approvals: Map<string, AgentApproval> = new Map();

  constructor(private db: any) {}

  async registerAgent(organizationId: string, input: {
    type: typeof AGENT_TYPES[number];
    name: string;
    description?: string;
    systemPrompt: string;
    tools: string[];
    requiresApproval: boolean;
    approvalThreshold?: number;
  }, createdBy: string): Promise<AIAgent> {
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Agent name is required');
    }

    if (!AGENT_TYPES.includes(input.type)) {
      throw new Error(`Invalid agent type: ${input.type}`);
    }

    if (!input.systemPrompt || input.systemPrompt.trim().length === 0) {
      throw new Error('System prompt is required');
    }

    if (!Array.isArray(input.tools) || input.tools.length === 0) {
      throw new Error('At least one tool is required');
    }

    const agent: AIAgent = {
      id: `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      type: input.type,
      name: input.name,
      description: input.description,
      systemPrompt: input.systemPrompt,
      tools: input.tools,
      requiresApproval: input.requiresApproval,
      approvalThreshold: input.approvalThreshold,
      enabled: true,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.agents.set(agent.id, agent);
    return agent;
  }

  async getAgentById(organizationId: string, agentId: string): Promise<AIAgent> {
    const agent = this.agents.get(agentId);
    if (!agent || agent.organizationId !== organizationId) {
      throw new Error('Agent not found');
    }
    return agent;
  }

  async getOrganizationAgents(organizationId: string, limit: number = 50, offset: number = 0): Promise<{ items: AIAgent[]; total: number }> {
    const agents = Array.from(this.agents.values())
      .filter(a => a.organizationId === organizationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      items: agents.slice(offset, offset + limit),
      total: agents.length,
    };
  }

  async getAgentsByType(organizationId: string, type: typeof AGENT_TYPES[number]): Promise<AIAgent[]> {
    return Array.from(this.agents.values())
      .filter(a => a.organizationId === organizationId && a.type === type && a.enabled)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateAgent(organizationId: string, agentId: string, updates: Partial<AIAgent>): Promise<AIAgent> {
    const agent = await this.getAgentById(organizationId, agentId);

    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length === 0) {
        throw new Error('Agent name cannot be empty');
      }
      agent.name = updates.name;
    }

    if (updates.description !== undefined) {
      agent.description = updates.description;
    }

    if (updates.systemPrompt !== undefined) {
      if (!updates.systemPrompt || updates.systemPrompt.trim().length === 0) {
        throw new Error('System prompt cannot be empty');
      }
      agent.systemPrompt = updates.systemPrompt;
    }

    if (updates.tools !== undefined) {
      if (!Array.isArray(updates.tools) || updates.tools.length === 0) {
        throw new Error('At least one tool is required');
      }
      agent.tools = updates.tools;
    }

    if (updates.enabled !== undefined) {
      agent.enabled = updates.enabled;
    }

    agent.updatedAt = new Date();
    return agent;
  }

  async deleteAgent(organizationId: string, agentId: string): Promise<void> {
    const agent = await this.getAgentById(organizationId, agentId);
    this.agents.delete(agentId);
  }

  async registerTool(organizationId: string, agentId: string, input: {
    name: string;
    category: typeof TOOL_CATEGORIES[number];
    description: string;
    inputSchema: Record<string, any>;
    outputSchema: Record<string, any>;
    requiresApproval: boolean;
    rateLimit?: number;
  }): Promise<AgentTool> {
    await this.getAgentById(organizationId, agentId);

    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Tool name is required');
    }

    if (!TOOL_CATEGORIES.includes(input.category)) {
      throw new Error(`Invalid tool category: ${input.category}`);
    }

    const tool: AgentTool = {
      id: `tool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      agentId,
      name: input.name,
      category: input.category,
      description: input.description,
      inputSchema: input.inputSchema,
      outputSchema: input.outputSchema,
      requiresApproval: input.requiresApproval,
      rateLimit: input.rateLimit,
      createdAt: new Date(),
    };

    this.tools.set(tool.id, tool);
    return tool;
  }

  async runAgent(organizationId: string, agentId: string, input: Record<string, any>): Promise<AgentRun> {
    const agent = await this.getAgentById(organizationId, agentId);

    if (!agent.enabled) {
      throw new Error('Agent is not enabled');
    }

    const run: AgentRun = {
      id: `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      agentId,
      agentType: agent.type,
      status: 'running',
      input,
      toolCalls: [],
      approvalRequired: agent.requiresApproval,
      startedAt: new Date(),
      createdAt: new Date(),
    };

    this.agentRuns.set(run.id, run);

    try {
      const toolCallResults: ToolCall[] = [];
      const output: Record<string, any> = {};

      for (const toolName of agent.tools) {
        const tool = Array.from(this.tools.values()).find(
          t => t.organizationId === organizationId && t.agentId === agentId && t.name === toolName
        );

        if (!tool) continue;

        const toolCall: ToolCall = {
          id: `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          toolName,
          input: { ...input },
          timestamp: new Date(),
        };

        output[toolName] = { success: true, result: `Tool ${toolName} executed successfully` };
        toolCall.output = output[toolName];
        toolCall.executedAt = new Date();

        toolCallResults.push(toolCall);
      }

      run.toolCalls = toolCallResults;
      run.output = output;

      if (agent.requiresApproval) {
        run.status = 'pending_approval';
        const approval: AgentApproval = {
          id: `approval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          organizationId,
          runId: run.id,
          agentId,
          status: 'pending',
          requestedBy: agentId,
          createdAt: new Date(),
        };
        this.approvals.set(approval.id, approval);
      } else {
        run.status = 'completed';
        run.completedAt = new Date();
      }

      return run;
    } catch (error: any) {
      run.status = 'failed';
      run.error = error.message;
      run.completedAt = new Date();
      return run;
    }
  }

  async getRunById(organizationId: string, runId: string): Promise<AgentRun> {
    const run = this.agentRuns.get(runId);
    if (!run || run.organizationId !== organizationId) {
      throw new Error('Agent run not found');
    }
    return run;
  }

  async getOrganizationRuns(organizationId: string, limit: number = 50, offset: number = 0): Promise<{ items: AgentRun[]; total: number }> {
    const runs = Array.from(this.agentRuns.values())
      .filter(r => r.organizationId === organizationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      items: runs.slice(offset, offset + limit),
      total: runs.length,
    };
  }

  async getRunsByAgent(organizationId: string, agentId: string, limit: number = 50, offset: number = 0): Promise<{ items: AgentRun[]; total: number }> {
    const runs = Array.from(this.agentRuns.values())
      .filter(r => r.organizationId === organizationId && r.agentId === agentId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      items: runs.slice(offset, offset + limit),
      total: runs.length,
    };
  }

  async approveRun(organizationId: string, runId: string, approvedBy: string): Promise<AgentRun> {
    const run = await this.getRunById(organizationId, runId);

    if (run.status !== 'pending_approval') {
      throw new Error('Run is not pending approval');
    }

    const approval = Array.from(this.approvals.values()).find(a => a.runId === runId);
    if (!approval) {
      throw new Error('Approval not found');
    }

    approval.status = 'approved';
    approval.approvedBy = approvedBy;
    approval.reviewedAt = new Date();

    run.status = 'completed';
    run.approvalStatus = 'approved';
    run.completedAt = new Date();

    return run;
  }

  async rejectRun(organizationId: string, runId: string, rejectedBy: string, reason: string): Promise<AgentRun> {
    const run = await this.getRunById(organizationId, runId);

    if (run.status !== 'pending_approval') {
      throw new Error('Run is not pending approval');
    }

    const approval = Array.from(this.approvals.values()).find(a => a.runId === runId);
    if (!approval) {
      throw new Error('Approval not found');
    }

    approval.status = 'rejected';
    approval.approvedBy = rejectedBy;
    approval.reason = reason;
    approval.reviewedAt = new Date();

    run.status = 'failed';
    run.approvalStatus = 'rejected';
    run.approvalReason = reason;
    run.completedAt = new Date();

    return run;
  }

  async getPendingApprovals(organizationId: string): Promise<AgentApproval[]> {
    return Array.from(this.approvals.values())
      .filter(a => a.organizationId === organizationId && a.status === 'pending')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getAgentMetrics(organizationId: string, agentId: string): Promise<{
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    avgExecutionTime: number;
    approvalRate: number;
  }> {
    const runs = Array.from(this.agentRuns.values()).filter(
      r => r.organizationId === organizationId && r.agentId === agentId
    );

    const successful = runs.filter(r => r.status === 'completed').length;
    const failed = runs.filter(r => r.status === 'failed').length;
    const avgTime = runs.length > 0
      ? runs.reduce((sum, r) => sum + ((r.completedAt?.getTime() || 0) - r.startedAt.getTime()), 0) / runs.length
      : 0;

    const approvalRequired = runs.filter(r => r.approvalRequired).length;
    const approved = runs.filter(r => r.approvalStatus === 'approved').length;

    return {
      totalRuns: runs.length,
      successfulRuns: successful,
      failedRuns: failed,
      avgExecutionTime: Math.round(avgTime),
      approvalRate: approvalRequired > 0 ? (approved / approvalRequired) * 100 : 0,
    };
  }
}
