// AI Agent Models & Types

export const AGENT_TYPES = ['sales', 'finance', 'project', 'writer', 'brand', 'voice'] as const;
export const AGENT_STATUSES = ['idle', 'running', 'completed', 'failed', 'pending_approval'] as const;
export const TOOL_CATEGORIES = ['crm', 'finance', 'project', 'content', 'communication', 'analytics'] as const;
export const APPROVAL_STATUSES = ['pending', 'approved', 'rejected'] as const;

export interface AIAgent {
  id: string;
  organizationId: string;
  type: typeof AGENT_TYPES[number];
  name: string;
  description?: string;
  systemPrompt: string;
  tools: string[];
  requiresApproval: boolean;
  approvalThreshold?: number;
  enabled: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentTool {
  id: string;
  organizationId: string;
  agentId: string;
  name: string;
  category: typeof TOOL_CATEGORIES[number];
  description: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  requiresApproval: boolean;
  rateLimit?: number;
  createdAt: Date;
}

export interface AgentRun {
  id: string;
  organizationId: string;
  agentId: string;
  agentType: typeof AGENT_TYPES[number];
  status: typeof AGENT_STATUSES[number];
  input: Record<string, any>;
  output?: Record<string, any>;
  toolCalls: ToolCall[];
  error?: string;
  approvalRequired: boolean;
  approvalStatus?: typeof APPROVAL_STATUSES[number];
  approvalReason?: string;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface ToolCall {
  id: string;
  toolName: string;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  timestamp: Date;
  executedAt?: Date;
}

export interface AgentApproval {
  id: string;
  organizationId: string;
  runId: string;
  agentId: string;
  status: typeof APPROVAL_STATUSES[number];
  requestedBy: string;
  approvedBy?: string;
  reason?: string;
  impact?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  reviewedAt?: Date;
}

export interface AgentEvaluation {
  id: string;
  organizationId: string;
  runId: string;
  agentId: string;
  quality: number;
  correctness: number;
  completeness: number;
  relevance: number;
  notes?: string;
  evaluatedBy?: string;
  timestamp: Date;
}

export interface KnowledgeSource {
  id: string;
  organizationId: string;
  name: string;
  type: 'document' | 'database' | 'api' | 'file';
  content: string;
  category: string;
  updated: Date;
  relevance?: number;
}

export interface AgentPermission {
  id: string;
  organizationId: string;
  agentId: string;
  resource: string;
  action: 'read' | 'write' | 'delete' | 'execute';
  conditions?: Record<string, any>;
  createdAt: Date;
}

export interface SalesAgentConfig {
  autoQualifyLeads: boolean;
  proposalGenerationTemplate: string;
  followUpFrequency: number;
  maxProposalsPerDay: number;
}

export interface FinanceAgentConfig {
  autoReconcile: boolean;
  recurringTransactionDetection: boolean;
  taxCalculationEnabled: boolean;
  budgetAlertThreshold: number;
}

export interface ProjectAgentConfig {
  autoAssignTasks: boolean;
  riskDetection: boolean;
  resourceOptimization: boolean;
  milestoneTracking: boolean;
}

export interface WriterAgentConfig {
  brandVoiceEnabled: boolean;
  languagePreference: 'en' | 'ar' | 'bilingual';
  contentTemplates: string[];
  grammarCheckEnabled: boolean;
}

export interface BrandAgentConfig {
  enforceGuidelines: boolean;
  colorPaletteLock: boolean;
  typographyRules: string[];
  toneLock: boolean;
}

export interface VoiceAgentConfig {
  transcriptionEnabled: boolean;
  languageDetection: boolean;
  sentimentAnalysis: boolean;
  callRecordingRetention: number;
}

export interface AgentMetrics {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  avgExecutionTime: number;
  approvalRate: number;
  avgQualityScore: number;
  toolUsageStats: Record<string, number>;
}

export interface AgentChain {
  id: string;
  organizationId: string;
  name: string;
  agents: string[];
  inputMapping: Record<string, string>;
  outputMapping: Record<string, string>;
  conditionRules?: Array<{ condition: string; next: string }>;
  enabled: boolean;
  createdAt: Date;
}
