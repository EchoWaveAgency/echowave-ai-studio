// AI & Orchestration Domain Models

// AI Agent
export interface AIAgent {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  type: 'workflow' | 'assistant' | 'specialist' | 'decision_engine';
  status: 'active' | 'inactive' | 'archived';
  systemPrompt: string;
  capabilities: string[];
  riskLevel: 'low' | 'medium' | 'high';
  requiresApproval: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIAgentCreateInput {
  name: string;
  description: string;
  type: 'workflow' | 'assistant' | 'specialist' | 'decision_engine';
  systemPrompt: string;
  capabilities: string[];
  riskLevel: 'low' | 'medium' | 'high';
  requiresApproval?: boolean;
}

// Agent Execution
export interface AgentExecution {
  id: string;
  organizationId: string;
  agentId: string;
  context: Record<string, any>;
  input: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'approved' | 'rejected';
  result?: Record<string, any>;
  errorMessage?: string;
  approvalRequired: boolean;
  approvedBy?: string;
  approvedAt?: string;
  executedBy: string;
  executedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentExecutionCreateInput {
  agentId: string;
  context?: Record<string, any>;
  input: string;
}

// Workflow
export interface Workflow {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  trigger: 'manual' | 'event' | 'schedule' | 'webhook';
  steps: WorkflowStep[];
  status: 'draft' | 'active' | 'paused' | 'archived';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStep {
  id: string;
  workflowId: string;
  stepNumber: number;
  name: string;
  action: string;
  parameters: Record<string, any>;
  condition?: string;
  onSuccess?: string;
  onFailure?: string;
  createdAt: string;
}

export interface WorkflowCreateInput {
  name: string;
  description: string;
  trigger: 'manual' | 'event' | 'schedule' | 'webhook';
  steps: Array<{
    name: string;
    action: string;
    parameters: Record<string, any>;
    condition?: string;
    onSuccess?: string;
    onFailure?: string;
  }>;
}

// Workflow Execution
export interface WorkflowExecution {
  id: string;
  organizationId: string;
  workflowId: string;
  context: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  currentStep?: number;
  stepResults: Array<{
    stepId: string;
    status: 'pending' | 'completed' | 'failed';
    result?: Record<string, any>;
    error?: string;
  }>;
  errorMessage?: string;
  triggeredBy: string;
  triggeredAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowExecutionCreateInput {
  workflowId: string;
  context?: Record<string, any>;
}

// Integration Hook
export interface IntegrationHook {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  eventType: string;
  service: 'crm' | 'sales' | 'delivery' | 'finance' | 'communications' | 'external';
  action: string;
  targetAgentId?: string;
  targetWorkflowId?: string;
  status: 'active' | 'inactive';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationHookCreateInput {
  name: string;
  description: string;
  eventType: string;
  service: 'crm' | 'sales' | 'delivery' | 'finance' | 'communications' | 'external';
  action: string;
  targetAgentId?: string;
  targetWorkflowId?: string;
}

// AI Evaluation
export interface AIEvaluation {
  id: string;
  organizationId: string;
  agentId: string;
  executionId: string;
  metric: 'accuracy' | 'relevance' | 'safety' | 'completeness' | 'tone_match';
  score: number;
  feedback: string;
  evaluatedBy: string;
  evaluatedAt: string;
  createdAt: string;
}

export interface AIEvaluationCreateInput {
  agentId: string;
  executionId: string;
  metric: 'accuracy' | 'relevance' | 'safety' | 'completeness' | 'tone_match';
  score: number;
  feedback: string;
}

// Constants
export const AGENT_TYPES = ['workflow', 'assistant', 'specialist', 'decision_engine'] as const;
export const AGENT_STATUSES = ['active', 'inactive', 'archived'] as const;
export const RISK_LEVELS = ['low', 'medium', 'high'] as const;
export const EXECUTION_STATUSES = ['pending', 'running', 'completed', 'failed', 'approved', 'rejected'] as const;
export const WORKFLOW_TRIGGERS = ['manual', 'event', 'schedule', 'webhook'] as const;
export const WORKFLOW_STATUSES = ['draft', 'active', 'paused', 'archived'] as const;
export const EVAL_METRICS = ['accuracy', 'relevance', 'safety', 'completeness', 'tone_match'] as const;

// Common Agent Capabilities
export const COMMON_CAPABILITIES = [
  'email_analysis',
  'document_generation',
  'data_extraction',
  'lead_scoring',
  'proposal_generation',
  'contract_review',
  'email_composition',
  'meeting_scheduling',
  'task_creation',
  'status_updates',
  'financial_reporting',
  'invoice_generation',
  'payment_processing',
  'client_communication',
  'project_milestone_tracking',
  'deliverable_approval',
] as const;
