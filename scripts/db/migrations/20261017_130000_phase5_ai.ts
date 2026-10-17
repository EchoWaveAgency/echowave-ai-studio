import { db } from '../../../platform/database/db';

export async function up() {
  await db.query(`
    CREATE TABLE ai_agents (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      type VARCHAR(50) NOT NULL CHECK (type IN ('workflow', 'assistant', 'specialist', 'decision_engine')),
      status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
      system_prompt TEXT NOT NULL,
      capabilities JSONB DEFAULT '[]'::jsonb,
      risk_level VARCHAR(50) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
      requires_approval BOOLEAN DEFAULT false,
      created_by UUID NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_ai_agents_org_id ON ai_agents(organization_id);
    CREATE INDEX idx_ai_agents_org_status ON ai_agents(organization_id, status);
    CREATE INDEX idx_ai_agents_org_type ON ai_agents(organization_id, type);

    CREATE TABLE agent_executions (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL,
      agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
      context JSONB DEFAULT '{}'::jsonb,
      input TEXT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'running' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'approved', 'rejected')),
      result JSONB,
      error_message TEXT,
      approval_required BOOLEAN DEFAULT false,
      approved_by UUID,
      approved_at TIMESTAMP,
      executed_by UUID NOT NULL,
      executed_at TIMESTAMP NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_agent_executions_org_id ON agent_executions(organization_id);
    CREATE INDEX idx_agent_executions_agent_id ON agent_executions(agent_id);
    CREATE INDEX idx_agent_executions_org_status ON agent_executions(organization_id, status);

    CREATE TABLE workflows (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      trigger VARCHAR(50) NOT NULL CHECK (trigger IN ('manual', 'event', 'schedule', 'webhook')),
      status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
      created_by UUID NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_workflows_org_id ON workflows(organization_id);
    CREATE INDEX idx_workflows_org_status ON workflows(organization_id, status);
    CREATE INDEX idx_workflows_org_trigger ON workflows(organization_id, trigger);

    CREATE TABLE workflow_steps (
      id UUID PRIMARY KEY,
      workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
      step_number INTEGER NOT NULL,
      name VARCHAR(255) NOT NULL,
      action VARCHAR(255) NOT NULL,
      parameters JSONB DEFAULT '{}'::jsonb,
      condition TEXT,
      on_success VARCHAR(255),
      on_failure VARCHAR(255),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(workflow_id, step_number)
    );

    CREATE INDEX idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);

    CREATE TABLE workflow_executions (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL,
      workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
      context JSONB DEFAULT '{}'::jsonb,
      status VARCHAR(50) NOT NULL DEFAULT 'running' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'paused')),
      current_step INTEGER,
      step_results JSONB DEFAULT '[]'::jsonb,
      error_message TEXT,
      triggered_by UUID NOT NULL,
      triggered_at TIMESTAMP NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_workflow_executions_org_id ON workflow_executions(organization_id);
    CREATE INDEX idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
    CREATE INDEX idx_workflow_executions_org_status ON workflow_executions(organization_id, status);

    CREATE TABLE integration_hooks (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      event_type VARCHAR(255) NOT NULL,
      service VARCHAR(50) NOT NULL CHECK (service IN ('crm', 'sales', 'delivery', 'finance', 'communications', 'external')),
      action VARCHAR(255) NOT NULL,
      target_agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
      target_workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      created_by UUID NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_integration_hooks_org_id ON integration_hooks(organization_id);
    CREATE INDEX idx_integration_hooks_service_event ON integration_hooks(organization_id, service, event_type);
    CREATE INDEX idx_integration_hooks_status ON integration_hooks(organization_id, status);

    CREATE TABLE ai_evaluations (
      id UUID PRIMARY KEY,
      organization_id UUID NOT NULL,
      agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
      execution_id UUID NOT NULL REFERENCES agent_executions(id) ON DELETE CASCADE,
      metric VARCHAR(50) NOT NULL CHECK (metric IN ('accuracy', 'relevance', 'safety', 'completeness', 'tone_match')),
      score NUMERIC(5, 2) NOT NULL,
      feedback TEXT NOT NULL,
      evaluated_by UUID NOT NULL,
      evaluated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_ai_evaluations_org_id ON ai_evaluations(organization_id);
    CREATE INDEX idx_ai_evaluations_agent_id ON ai_evaluations(agent_id);
    CREATE INDEX idx_ai_evaluations_execution_id ON ai_evaluations(execution_id);
    CREATE INDEX idx_ai_evaluations_metric ON ai_evaluations(agent_id, metric);
  `);
}

export async function down() {
  await db.query(`
    DROP TABLE IF EXISTS ai_evaluations;
    DROP TABLE IF EXISTS integration_hooks;
    DROP TABLE IF EXISTS workflow_executions;
    DROP TABLE IF EXISTS workflow_steps;
    DROP TABLE IF EXISTS workflows;
    DROP TABLE IF EXISTS agent_executions;
    DROP TABLE IF EXISTS ai_agents;
  `);
}
