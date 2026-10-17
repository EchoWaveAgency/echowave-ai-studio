import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../../platform/database/db';
import { aiAgentService } from '../../domains/ai/services/AIAgentService';
import { agentExecutionService } from '../../domains/ai/services/AgentExecutionService';
import { workflowService } from '../../domains/ai/services/WorkflowService';
import { integrationHookService } from '../../domains/ai/services/IntegrationHookService';
import { aiEvaluationService } from '../../domains/ai/services/AIEvaluationService';

const TEST_ORG_ID = 'test-org-' + Date.now();
const TEST_USER_ID = 'test-user-' + Date.now();

describe('Phase 5: AI & Orchestration', () => {
  beforeAll(async () => {
    await db.query('SELECT 1');
  });

  afterAll(async () => {
    await db.query('DELETE FROM ai_evaluations WHERE organization_id = $1', [TEST_ORG_ID]);
    await db.query('DELETE FROM integration_hooks WHERE organization_id = $1', [TEST_ORG_ID]);
    await db.query('DELETE FROM workflow_executions WHERE organization_id = $1', [TEST_ORG_ID]);
    await db.query('DELETE FROM workflow_steps WHERE workflow_id IN (SELECT id FROM workflows WHERE organization_id = $1)', [TEST_ORG_ID]);
    await db.query('DELETE FROM workflows WHERE organization_id = $1', [TEST_ORG_ID]);
    await db.query('DELETE FROM agent_executions WHERE organization_id = $1', [TEST_ORG_ID]);
    await db.query('DELETE FROM ai_agents WHERE organization_id = $1', [TEST_ORG_ID]);
  });

  describe('AI Agents', () => {
    it('should create an AI agent', async () => {
      const agent = await aiAgentService.createAgent(
        TEST_ORG_ID,
        {
          name: 'Lead Scorer',
          type: 'specialist',
          systemPrompt: 'You are a lead scoring expert',
          capabilities: ['lead_scoring', 'data_extraction'],
          riskLevel: 'low',
        },
        TEST_USER_ID
      );

      expect(agent.id).toBeDefined();
      expect(agent.organizationId).toBe(TEST_ORG_ID);
      expect(agent.name).toBe('Lead Scorer');
      expect(agent.type).toBe('specialist');
      expect(agent.status).toBe('active');
      expect(agent.requiresApproval).toBe(false);
      expect(agent.capabilities).toContain('lead_scoring');
    });

    it('should auto-enable approval for medium-risk agents', async () => {
      const agent = await aiAgentService.createAgent(
        TEST_ORG_ID,
        {
          name: 'Contract Reviewer',
          type: 'specialist',
          systemPrompt: 'You are a contract review expert',
          capabilities: ['contract_review'],
          riskLevel: 'medium',
        },
        TEST_USER_ID
      );

      expect(agent.requiresApproval).toBe(true);
    });

    it('should auto-enable approval for high-risk agents', async () => {
      const agent = await aiAgentService.createAgent(
        TEST_ORG_ID,
        {
          name: 'Financial Decision Engine',
          type: 'decision_engine',
          systemPrompt: 'You make financial decisions',
          capabilities: ['payment_processing', 'financial_reporting'],
          riskLevel: 'high',
        },
        TEST_USER_ID
      );

      expect(agent.requiresApproval).toBe(true);
    });

    it('should validate agent name is required', async () => {
      try {
        await aiAgentService.createAgent(
          TEST_ORG_ID,
          {
            name: '',
            type: 'assistant',
            systemPrompt: 'Test',
            capabilities: ['email_analysis'],
            riskLevel: 'low',
          },
          TEST_USER_ID
        );
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('required');
      }
    });

    it('should validate agent type is valid', async () => {
      try {
        await aiAgentService.createAgent(
          TEST_ORG_ID,
          {
            name: 'Test Agent',
            type: 'invalid_type' as any,
            systemPrompt: 'Test',
            capabilities: ['email_analysis'],
            riskLevel: 'low',
          },
          TEST_USER_ID
        );
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('Invalid');
      }
    });

    it('should validate capabilities are required', async () => {
      try {
        await aiAgentService.createAgent(
          TEST_ORG_ID,
          {
            name: 'Test Agent',
            type: 'assistant',
            systemPrompt: 'Test',
            capabilities: [],
            riskLevel: 'low',
          },
          TEST_USER_ID
        );
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('capability');
      }
    });

    it('should retrieve agent by ID with org isolation', async () => {
      const created = await aiAgentService.createAgent(
        TEST_ORG_ID,
        {
          name: 'Email Analyzer',
          type: 'assistant',
          systemPrompt: 'Analyze emails',
          capabilities: ['email_analysis'],
          riskLevel: 'low',
        },
        TEST_USER_ID
      );

      const retrieved = await aiAgentService.getAgentById(created.id, TEST_ORG_ID);
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.name).toBe('Email Analyzer');

      try {
        await aiAgentService.getAgentById(created.id, 'wrong-org-id');
        expect.fail('Should have thrown not found error');
      } catch (error: any) {
        expect(error.message).toContain('not found');
      }
    });

    it('should list organization agents with filtering', async () => {
      await aiAgentService.createAgent(
        TEST_ORG_ID,
        {
          name: 'Proposal Generator',
          type: 'workflow',
          systemPrompt: 'Generate proposals',
          capabilities: ['proposal_generation'],
          riskLevel: 'low',
        },
        TEST_USER_ID
      );

      const agents = await aiAgentService.getOrganizationAgents(TEST_ORG_ID);
      expect(agents.length).toBeGreaterThan(0);

      const workflows = await aiAgentService.getOrganizationAgents(TEST_ORG_ID, { type: 'workflow' });
      for (const agent of workflows) {
        expect(agent.type).toBe('workflow');
      }
    });

    it('should update agent status', async () => {
      const agent = await aiAgentService.createAgent(
        TEST_ORG_ID,
        {
          name: 'Task Scheduler',
          type: 'assistant',
          systemPrompt: 'Schedule tasks',
          capabilities: ['task_creation', 'meeting_scheduling'],
          riskLevel: 'low',
        },
        TEST_USER_ID
      );

      const updated = await aiAgentService.updateAgentStatus(agent.id, TEST_ORG_ID, 'inactive');
      expect(updated.status).toBe('inactive');

      const archived = await aiAgentService.updateAgentStatus(agent.id, TEST_ORG_ID, 'archived');
      expect(archived.status).toBe('archived');
    });

    it('should update agent capabilities', async () => {
      const agent = await aiAgentService.createAgent(
        TEST_ORG_ID,
        {
          name: 'Multi-tool Agent',
          type: 'assistant',
          systemPrompt: 'Multi-purpose assistant',
          capabilities: ['email_analysis'],
          riskLevel: 'low',
        },
        TEST_USER_ID
      );

      const updated = await aiAgentService.updateAgentCapabilities(agent.id, TEST_ORG_ID, [
        'email_analysis',
        'document_generation',
        'task_creation',
      ]);

      expect(updated.capabilities).toContain('email_analysis');
      expect(updated.capabilities).toContain('document_generation');
      expect(updated.capabilities).toContain('task_creation');
      expect(updated.capabilities.length).toBe(3);
    });
  });

  describe('Agent Executions', () => {
    it('should execute a low-risk agent without approval requirement', async () => {
      const agent = await aiAgentService.createAgent(
        TEST_ORG_ID,
        {
          name: 'Low Risk Executor',
          type: 'specialist',
          systemPrompt: 'Execute low-risk tasks',
          capabilities: ['data_extraction'],
          riskLevel: 'low',
        },
        TEST_USER_ID
      );

      const execution = await agentExecutionService.executeAgent(
        TEST_ORG_ID,
        {
          agentId: agent.id,
          input: 'Extract data from email',
          context: { emailId: '123' },
        },
        TEST_USER_ID
      );

      expect(execution.id).toBeDefined();
      expect(execution.agentId).toBe(agent.id);
      expect(execution.status).toBe('running');
      expect(execution.approvalRequired).toBe(false);
      expect(execution.input).toBe('Extract data from email');
    });

    it('should require approval for high-risk agent execution', async () => {
      const agent = await aiAgentService.createAgent(
        TEST_ORG_ID,
        {
          name: 'High Risk Agent',
          type: 'decision_engine',
          systemPrompt: 'Make financial decisions',
          capabilities: ['payment_processing'],
          riskLevel: 'high',
        },
        TEST_USER_ID
      );

      const execution = await agentExecutionService.executeAgent(
        TEST_ORG_ID,
        {
          agentId: agent.id,
          input: 'Process payment',
          context: { amount: 10000 },
        },
        TEST_USER_ID
      );

      expect(execution.status).toBe('pending');
      expect(execution.approvalRequired).toBe(true);
    });

    it('should validate agent exists before execution', async () => {
      try {
        await agentExecutionService.executeAgent(
          TEST_ORG_ID,
          {
            agentId: 'non-existent-agent',
            input: 'Test',
          },
          TEST_USER_ID
        );
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('not found');
      }
    });

    it('should validate agent is active before execution', async () => {
      const agent = await aiAgentService.createAgent(
        TEST_ORG_ID,
        {
          name: 'Inactive Agent',
          type: 'assistant',
          systemPrompt: 'Test',
          capabilities: ['email_analysis'],
          riskLevel: 'low',
        },
        TEST_USER_ID
      );

      await aiAgentService.updateAgentStatus(agent.id, TEST_ORG_ID, 'inactive');

      try {
        await agentExecutionService.executeAgent(
          TEST_ORG_ID,
          {
            agentId: agent.id,
            input: 'Test',
          },
          TEST_USER_ID
        );
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('not active');
      }
    });

    it('should approve pending execution', async () => {
      const agent = await aiAgentService.createAgent(
        TEST_ORG_ID,
        {
          name: 'Approval Test Agent',
          type: 'decision_engine',
          systemPrompt: 'Test approvals',
          capabilities: ['payment_processing'],
          riskLevel: 'high',
        },
        TEST_USER_ID
      );

      const execution = await agentExecutionService.executeAgent(
        TEST_ORG_ID,
        {
          agentId: agent.id,
          input: 'Process',
          context: { amount: 1000 },
        },
        TEST_USER_ID
      );

      expect(execution.status).toBe('pending');

      const approverUserId = 'approver-' + Date.now();
      const approved = await agentExecutionService.approveExecution(execution.id, TEST_ORG_ID, approverUserId);

      expect(approved.status).toBe('approved');
      expect(approved.approvedBy).toBe(approverUserId);
      expect(approved.approvedAt).toBeDefined();
    });

    it('should reject pending execution', async () => {
      const agent = await aiAgentService.createAgent(
        TEST_ORG_ID,
        {
          name: 'Rejection Test Agent',
          type: 'decision_engine',
          systemPrompt: 'Test rejections',
          capabilities: ['payment_processing'],
          riskLevel: 'high',
        },
        TEST_USER_ID
      );

      const execution = await agentExecutionService.executeAgent(
        TEST_ORG_ID,
        {
          agentId: agent.id,
          input: 'Process high amount',
          context: { amount: 50000 },
        },
        TEST_USER_ID
      );

      const rejectorUserId = 'rejector-' + Date.now();
      const rejected = await agentExecutionService.rejectExecution(
        execution.id,
        TEST_ORG_ID,
        'Amount exceeds daily limit',
        rejectorUserId
      );

      expect(rejected.status).toBe('rejected');
      expect(rejected.errorMessage).toContain('Amount exceeds');
    });

    it('should complete execution', async () => {
      const agent = await aiAgentService.createAgent(
        TEST_ORG_ID,
        {
          name: 'Completion Test Agent',
          type: 'specialist',
          systemPrompt: 'Complete tasks',
          capabilities: ['document_generation'],
          riskLevel: 'low',
        },
        TEST_USER_ID
      );

      const execution = await agentExecutionService.executeAgent(
        TEST_ORG_ID,
        {
          agentId: agent.id,
          input: 'Generate document',
          context: { documentType: 'proposal' },
        },
        TEST_USER_ID
      );

      const completed = await agentExecutionService.completeExecution(execution.id, TEST_ORG_ID, {
        documentId: 'doc-123',
        status: 'generated',
        pageCount: 5,
      });

      expect(completed.status).toBe('completed');
      expect(completed.result).toBeDefined();
      expect(completed.result?.documentId).toBe('doc-123');
    });

    it('should fail execution with error message', async () => {
      const agent = await aiAgentService.createAgent(
        TEST_ORG_ID,
        {
          name: 'Failure Test Agent',
          type: 'assistant',
          systemPrompt: 'Test failures',
          capabilities: ['email_analysis'],
          riskLevel: 'low',
        },
        TEST_USER_ID
      );

      const execution = await agentExecutionService.executeAgent(
        TEST_ORG_ID,
        {
          agentId: agent.id,
          input: 'Analyze email',
        },
        TEST_USER_ID
      );

      const failed = await agentExecutionService.failExecution(
        execution.id,
        TEST_ORG_ID,
        'Email service unavailable'
      );

      expect(failed.status).toBe('failed');
      expect(failed.errorMessage).toBe('Email service unavailable');
    });

    it('should retrieve execution with org isolation', async () => {
      const agent = await aiAgentService.createAgent(
        TEST_ORG_ID,
        {
          name: 'Isolation Test Agent',
          type: 'assistant',
          systemPrompt: 'Test isolation',
          capabilities: ['task_creation'],
          riskLevel: 'low',
        },
        TEST_USER_ID
      );

      const execution = await agentExecutionService.executeAgent(
        TEST_ORG_ID,
        {
          agentId: agent.id,
          input: 'Create task',
        },
        TEST_USER_ID
      );

      const retrieved = await agentExecutionService.getExecutionById(execution.id, TEST_ORG_ID);
      expect(retrieved.id).toBe(execution.id);

      try {
        await agentExecutionService.getExecutionById(execution.id, 'wrong-org-id');
        expect.fail('Should have thrown not found error');
      } catch (error: any) {
        expect(error.message).toContain('not found');
      }
    });

    it('should list agent executions with pagination', async () => {
      const agent = await aiAgentService.createAgent(
        TEST_ORG_ID,
        {
          name: 'Pagination Test Agent',
          type: 'assistant',
          systemPrompt: 'Test pagination',
          capabilities: ['task_creation'],
          riskLevel: 'low',
        },
        TEST_USER_ID
      );

      for (let i = 0; i < 5; i++) {
        await agentExecutionService.executeAgent(
          TEST_ORG_ID,
          {
            agentId: agent.id,
            input: `Task ${i}`,
          },
          TEST_USER_ID
        );
      }

      const result = await agentExecutionService.getAgentExecutions(agent.id, TEST_ORG_ID, 3, 0);

      expect(result.items.length).toBeLessThanOrEqual(3);
      expect(result.total).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Workflows', () => {
    it('should create a workflow with steps', async () => {
      const workflow = await workflowService.createWorkflow(
        TEST_ORG_ID,
        {
          name: 'Lead Processing Pipeline',
          description: 'Process new leads',
          trigger: 'webhook',
          steps: [
            {
              name: 'Validate Lead',
              action: 'validate_lead',
              parameters: { requiredFields: ['name', 'email'] },
            },
            {
              name: 'Score Lead',
              action: 'score_lead',
              parameters: { model: 'v2' },
            },
            {
              name: 'Assign to Sales',
              action: 'assign_sales',
              parameters: { team: 'enterprise' },
            },
          ],
        },
        TEST_USER_ID
      );

      expect(workflow.id).toBeDefined();
      expect(workflow.name).toBe('Lead Processing Pipeline');
      expect(workflow.trigger).toBe('webhook');
      expect(workflow.status).toBe('draft');
    });

    it('should validate workflow steps are required', async () => {
      try {
        await workflowService.createWorkflow(
          TEST_ORG_ID,
          {
            name: 'Test Workflow',
            trigger: 'manual',
            steps: [],
          },
          TEST_USER_ID
        );
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('At least one step');
      }
    });

    it('should retrieve workflow by ID with org isolation', async () => {
      const created = await workflowService.createWorkflow(
        TEST_ORG_ID,
        {
          name: 'Retrieval Test Workflow',
          trigger: 'manual',
          steps: [
            {
              name: 'Step 1',
              action: 'do_something',
              parameters: {},
            },
          ],
        },
        TEST_USER_ID
      );

      const retrieved = await workflowService.getWorkflowById(created.id, TEST_ORG_ID);
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.name).toBe('Retrieval Test Workflow');

      try {
        await workflowService.getWorkflowById(created.id, 'wrong-org-id');
        expect.fail('Should have thrown not found error');
      } catch (error: any) {
        expect(error.message).toContain('not found');
      }
    });

    it('should update workflow status', async () => {
      const workflow = await workflowService.createWorkflow(
        TEST_ORG_ID,
        {
          name: 'Status Update Workflow',
          trigger: 'manual',
          steps: [
            {
              name: 'Execute',
              action: 'execute',
              parameters: {},
            },
          ],
        },
        TEST_USER_ID
      );

      const activated = await workflowService.updateWorkflowStatus(workflow.id, TEST_ORG_ID, 'active');
      expect(activated.status).toBe('active');

      const paused = await workflowService.updateWorkflowStatus(workflow.id, TEST_ORG_ID, 'paused');
      expect(paused.status).toBe('paused');
    });

    it('should execute active workflow', async () => {
      const workflow = await workflowService.createWorkflow(
        TEST_ORG_ID,
        {
          name: 'Executable Workflow',
          trigger: 'manual',
          steps: [
            {
              name: 'Process',
              action: 'process_data',
              parameters: { timeout: 30000 },
            },
          ],
        },
        TEST_USER_ID
      );

      await workflowService.updateWorkflowStatus(workflow.id, TEST_ORG_ID, 'active');

      const execution = await workflowService.executeWorkflow(
        workflow.id,
        TEST_ORG_ID,
        {
          workflowId: workflow.id,
          context: { inputData: 'test' },
        },
        TEST_USER_ID
      );

      expect(execution.id).toBeDefined();
      expect(execution.workflowId).toBe(workflow.id);
      expect(execution.status).toBe('running');
    });

    it('should not execute inactive workflow', async () => {
      const workflow = await workflowService.createWorkflow(
        TEST_ORG_ID,
        {
          name: 'Inactive Workflow',
          trigger: 'manual',
          steps: [
            {
              name: 'Execute',
              action: 'execute',
              parameters: {},
            },
          ],
        },
        TEST_USER_ID
      );

      try {
        await workflowService.executeWorkflow(
          workflow.id,
          TEST_ORG_ID,
          { workflowId: workflow.id },
          TEST_USER_ID
        );
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('not active');
      }
    });
  });

  describe('Integration Hooks', () => {
    it('should create integration hook for agent', async () => {
      const agent = await aiAgentService.createAgent(
        TEST_ORG_ID,
        {
          name: 'Hook Target Agent',
          type: 'assistant',
          systemPrompt: 'Target for hooks',
          capabilities: ['email_analysis'],
          riskLevel: 'low',
        },
        TEST_USER_ID
      );

      const hook = await integrationHookService.createHook(
        TEST_ORG_ID,
        {
          name: 'Email Received Hook',
          eventType: 'email.received',
          service: 'communications',
          action: 'analyze_email',
          targetAgentId: agent.id,
        },
        TEST_USER_ID
      );

      expect(hook.id).toBeDefined();
      expect(hook.name).toBe('Email Received Hook');
      expect(hook.eventType).toBe('email.received');
      expect(hook.targetAgentId).toBe(agent.id);
      expect(hook.status).toBe('active');
    });

    it('should create integration hook for workflow', async () => {
      const workflow = await workflowService.createWorkflow(
        TEST_ORG_ID,
        {
          name: 'Hook Target Workflow',
          trigger: 'webhook',
          steps: [
            {
              name: 'Step',
              action: 'do_work',
              parameters: {},
            },
          ],
        },
        TEST_USER_ID
      );

      const hook = await integrationHookService.createHook(
        TEST_ORG_ID,
        {
          name: 'Payment Hook',
          eventType: 'payment.processed',
          service: 'finance',
          action: 'record_payment',
          targetWorkflowId: workflow.id,
        },
        TEST_USER_ID
      );

      expect(hook.targetWorkflowId).toBe(workflow.id);
    });

    it('should require either agent or workflow as target', async () => {
      try {
        await integrationHookService.createHook(
          TEST_ORG_ID,
          {
            name: 'Invalid Hook',
            eventType: 'test.event',
            service: 'crm',
            action: 'test_action',
          },
          TEST_USER_ID
        );
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('Required');
      }
    });

    it('should retrieve hook by ID with org isolation', async () => {
      const agent = await aiAgentService.createAgent(
        TEST_ORG_ID,
        {
          name: 'Isolation Agent',
          type: 'assistant',
          systemPrompt: 'Test',
          capabilities: ['task_creation'],
          riskLevel: 'low',
        },
        TEST_USER_ID
      );

      const created = await integrationHookService.createHook(
        TEST_ORG_ID,
        {
          name: 'Test Hook',
          eventType: 'test.event',
          service: 'external',
          action: 'test_action',
          targetAgentId: agent.id,
        },
        TEST_USER_ID
      );

      const retrieved = await integrationHookService.getHookById(created.id, TEST_ORG_ID);
      expect(retrieved.id).toBe(created.id);

      try {
        await integrationHookService.getHookById(created.id, 'wrong-org-id');
        expect.fail('Should have thrown not found error');
      } catch (error: any) {
        expect(error.message).toContain('not found');
      }
    });

    it('should update hook status', async () => {
      const agent = await aiAgentService.createAgent(
        TEST_ORG_ID,
        {
          name: 'Status Agent',
          type: 'assistant',
          systemPrompt: 'Test',
          capabilities: ['email_analysis'],
          riskLevel: 'low',
        },
        TEST_USER_ID
      );

      const hook = await integrationHookService.createHook(
        TEST_ORG_ID,
        {
          name: 'Status Hook',
          eventType: 'test.event',
          service: 'external',
          action: 'test',
          targetAgentId: agent.id,
        },
        TEST_USER_ID
      );

      const inactive = await integrationHookService.updateHookStatus(hook.id, TEST_ORG_ID, 'inactive');
      expect(inactive.status).toBe('inactive');

      const active = await integrationHookService.updateHookStatus(hook.id, TEST_ORG_ID, 'active');
      expect(active.status).toBe('active');
    });
  });

  describe('AI Evaluations', () => {
    it('should create evaluation for agent execution', async () => {
      const agent = await aiAgentService.createAgent(
        TEST_ORG_ID,
        {
          name: 'Evaluation Agent',
          type: 'specialist',
          systemPrompt: 'Evaluation test',
          capabilities: ['data_extraction'],
          riskLevel: 'low',
        },
        TEST_USER_ID
      );

      const execution = await agentExecutionService.executeAgent(
        TEST_ORG_ID,
        {
          agentId: agent.id,
          input: 'Extract data',
        },
        TEST_USER_ID
      );

      const evaluation = await aiEvaluationService.createEvaluation(
        TEST_ORG_ID,
        {
          agentId: agent.id,
          executionId: execution.id,
          metric: 'accuracy',
          score: 92,
          feedback: 'Extraction was accurate for all fields',
        },
        TEST_USER_ID
      );

      expect(evaluation.id).toBeDefined();
      expect(evaluation.agentId).toBe(agent.id);
      expect(evaluation.metric).toBe('accuracy');
      expect(evaluation.score).toBe(92);
    });

    it('should validate evaluation score range', async () => {
      const agent = await aiAgentService.createAgent(
        TEST_ORG_ID,
        {
          name: 'Score Validation Agent',
          type: 'assistant',
          systemPrompt: 'Test',
          capabilities: ['task_creation'],
          riskLevel: 'low',
        },
        TEST_USER_ID
      );

      const execution = await agentExecutionService.executeAgent(
        TEST_ORG_ID,
        {
          agentId: agent.id,
          input: 'Test',
        },
        TEST_USER_ID
      );

      try {
        await aiEvaluationService.createEvaluation(
          TEST_ORG_ID,
          {
            agentId: agent.id,
            executionId: execution.id,
            metric: 'relevance',
            score: 150,
            feedback: 'Test',
          },
          TEST_USER_ID
        );
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('0 and 100');
      }
    });

    it('should retrieve evaluations by execution', async () => {
      const agent = await aiAgentService.createAgent(
        TEST_ORG_ID,
        {
          name: 'Multi-Eval Agent',
          type: 'specialist',
          systemPrompt: 'Multi evaluation test',
          capabilities: ['document_generation'],
          riskLevel: 'low',
        },
        TEST_USER_ID
      );

      const execution = await agentExecutionService.executeAgent(
        TEST_ORG_ID,
        {
          agentId: agent.id,
          input: 'Generate content',
        },
        TEST_USER_ID
      );

      const evaluatorId = 'evaluator-' + Date.now();

      await aiEvaluationService.createEvaluation(
        TEST_ORG_ID,
        {
          agentId: agent.id,
          executionId: execution.id,
          metric: 'accuracy',
          score: 88,
          feedback: 'Good accuracy',
        },
        evaluatorId
      );

      await aiEvaluationService.createEvaluation(
        TEST_ORG_ID,
        {
          agentId: agent.id,
          executionId: execution.id,
          metric: 'relevance',
          score: 90,
          feedback: 'Relevant content',
        },
        evaluatorId
      );

      const evaluations = await aiEvaluationService.getEvaluationsByExecution(execution.id, TEST_ORG_ID);

      expect(evaluations.length).toBeGreaterThanOrEqual(2);
      expect(evaluations.some((e) => e.metric === 'accuracy')).toBe(true);
      expect(evaluations.some((e) => e.metric === 'relevance')).toBe(true);
    });

    it('should calculate agent metrics', async () => {
      const agent = await aiAgentService.createAgent(
        TEST_ORG_ID,
        {
          name: 'Metrics Agent',
          type: 'specialist',
          systemPrompt: 'Metrics test',
          capabilities: ['lead_scoring'],
          riskLevel: 'low',
        },
        TEST_USER_ID
      );

      const evaluatorId = 'evaluator-metrics-' + Date.now();

      for (let i = 0; i < 3; i++) {
        const execution = await agentExecutionService.executeAgent(
          TEST_ORG_ID,
          {
            agentId: agent.id,
            input: `Test execution ${i}`,
          },
          TEST_USER_ID
        );

        await aiEvaluationService.createEvaluation(
          TEST_ORG_ID,
          {
            agentId: agent.id,
            executionId: execution.id,
            metric: 'accuracy',
            score: 85 + i * 5,
            feedback: 'Test evaluation',
          },
          evaluatorId
        );
      }

      const metrics = await aiEvaluationService.getAgentMetrics(agent.id, TEST_ORG_ID);

      expect(metrics.agentId).toBe(agent.id);
      expect(metrics.totalEvaluations).toBeGreaterThanOrEqual(3);
      expect(metrics.averageScore).toBeGreaterThan(0);
      expect(metrics.metricBreakdown['accuracy']).toBeDefined();
    });
  });
});
