import { describe, it, expect } from 'vitest';
import { OrchestratorService } from '../../domains/ai/services/OrchestratorService';
import { SalesAgentService } from '../../domains/ai/services/SalesAgentService';
import { FinanceAgentService } from '../../domains/ai/services/FinanceAgentService';
import { ProjectAgentService } from '../../domains/ai/services/ProjectAgentService';
import { WriterAgentService } from '../../domains/ai/services/WriterAgentService';
import { BrandAgentService } from '../../domains/ai/services/BrandAgentService';
import { VoiceAgentService } from '../../domains/ai/services/VoiceAgentService';

describe('Phase 12: AI Agents & Automation', () => {
  const organizationId = 'org-test-123';
  const userId = 'user-test-456';

  describe('OrchestratorService', () => {
    const orchestrator = new OrchestratorService(null);

    it('should register a sales agent', async () => {
      const agent = await orchestrator.registerAgent(organizationId, {
        type: 'sales',
        name: 'Sales Agent v1',
        systemPrompt: 'You are a sales agent...',
        tools: ['lead_qualify', 'proposal_generate'],
        requiresApproval: true,
      }, userId);

      expect(agent).toBeDefined();
      expect(agent.id).toBeDefined();
      expect(agent.organizationId).toBe(organizationId);
      expect(agent.type).toBe('sales');
      expect(agent.name).toBe('Sales Agent v1');
      expect(agent.enabled).toBe(true);
      expect(agent.createdBy).toBe(userId);
    });

    it('should reject agent without name', async () => {
      try {
        await orchestrator.registerAgent(organizationId, {
          type: 'finance',
          name: '',
          systemPrompt: 'test',
          tools: ['reconcile'],
          requiresApproval: false,
        }, userId);
        expect.fail('Should throw error');
      } catch (error: any) {
        expect(error.message).toBe('Agent name is required');
      }
    });

    it('should reject invalid agent type', async () => {
      try {
        await orchestrator.registerAgent(organizationId, {
          type: 'invalid' as any,
          name: 'Test Agent',
          systemPrompt: 'test',
          tools: ['tool1'],
          requiresApproval: false,
        }, userId);
        expect.fail('Should throw error');
      } catch (error: any) {
        expect(error.message).toContain('Invalid agent type');
      }
    });

    it('should reject agent without tools', async () => {
      try {
        await orchestrator.registerAgent(organizationId, {
          type: 'sales',
          name: 'Test Agent',
          systemPrompt: 'test',
          tools: [],
          requiresApproval: false,
        }, userId);
        expect.fail('Should throw error');
      } catch (error: any) {
        expect(error.message).toBe('At least one tool is required');
      }
    });

    it('should retrieve agent by ID', async () => {
      const agent = await orchestrator.registerAgent(organizationId, {
        type: 'finance',
        name: 'Finance Agent',
        systemPrompt: 'You are a finance agent...',
        tools: ['reconcile', 'tax_calc'],
        requiresApproval: true,
      }, userId);

      const retrieved = await orchestrator.getAgentById(organizationId, agent.id);
      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(agent.id);
      expect(retrieved.type).toBe('finance');
    });

    it('should list organization agents', async () => {
      const agent1 = await orchestrator.registerAgent(organizationId, {
        type: 'sales',
        name: 'Sales Agent A',
        systemPrompt: 'test',
        tools: ['tool1'],
        requiresApproval: false,
      }, userId);

      const agent2 = await orchestrator.registerAgent(organizationId, {
        type: 'finance',
        name: 'Finance Agent B',
        systemPrompt: 'test',
        tools: ['tool2'],
        requiresApproval: true,
      }, userId);

      const result = await orchestrator.getOrganizationAgents(organizationId, 50, 0);
      expect(result.items.length).toBeGreaterThanOrEqual(2);
      expect(result.total).toBeGreaterThanOrEqual(2);
    });

    it('should filter agents by type', async () => {
      await orchestrator.registerAgent(organizationId, {
        type: 'sales',
        name: 'Sales Agent',
        systemPrompt: 'test',
        tools: ['tool1'],
        requiresApproval: false,
      }, userId);

      const salesAgents = await orchestrator.getAgentsByType(organizationId, 'sales');
      expect(salesAgents.length).toBeGreaterThan(0);
      expect(salesAgents.every(a => a.type === 'sales')).toBe(true);
      expect(salesAgents.every(a => a.enabled)).toBe(true);
    });

    it('should update agent properties', async () => {
      const agent = await orchestrator.registerAgent(organizationId, {
        type: 'project',
        name: 'Original Name',
        systemPrompt: 'Original prompt',
        tools: ['tool1'],
        requiresApproval: false,
      }, userId);

      const updated = await orchestrator.updateAgent(organizationId, agent.id, {
        name: 'Updated Name',
        systemPrompt: 'Updated prompt',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.systemPrompt).toBe('Updated prompt');
    });

    it('should disable/enable agents', async () => {
      const agent = await orchestrator.registerAgent(organizationId, {
        type: 'writer',
        name: 'Writer Agent',
        systemPrompt: 'test',
        tools: ['write'],
        requiresApproval: false,
      }, userId);

      const disabled = await orchestrator.updateAgent(organizationId, agent.id, { enabled: false });
      expect(disabled.enabled).toBe(false);

      const enabled = await orchestrator.updateAgent(organizationId, agent.id, { enabled: true });
      expect(enabled.enabled).toBe(true);
    });

    it('should register tools for agents', async () => {
      const agent = await orchestrator.registerAgent(organizationId, {
        type: 'sales',
        name: 'Sales Agent',
        systemPrompt: 'test',
        tools: ['qualify_lead', 'generate_proposal'],
        requiresApproval: false,
      }, userId);

      const tool = await orchestrator.registerTool(organizationId, agent.id, {
        name: 'qualify_lead',
        category: 'crm',
        description: 'Qualify a lead',
        inputSchema: { type: 'object', properties: { leadId: { type: 'string' } } },
        outputSchema: { type: 'object', properties: { qualified: { type: 'boolean' } } },
        requiresApproval: false,
        rateLimit: 100,
      });

      expect(tool).toBeDefined();
      expect(tool.name).toBe('qualify_lead');
      expect(tool.category).toBe('crm');
      expect(tool.rateLimit).toBe(100);
    });

    it('should run agent without approval', async () => {
      const agent = await orchestrator.registerAgent(organizationId, {
        type: 'sales',
        name: 'Sales Agent',
        systemPrompt: 'test',
        tools: ['lead_qualify'],
        requiresApproval: false,
      }, userId);

      const run = await orchestrator.runAgent(organizationId, agent.id, { leadId: 'lead-123' });

      expect(run).toBeDefined();
      expect(run.id).toBeDefined();
      expect(run.organizationId).toBe(organizationId);
      expect(run.agentId).toBe(agent.id);
      expect(run.status).toBe('completed');
      expect(run.approvalRequired).toBe(false);
    });

    it('should run agent with approval required', async () => {
      const agent = await orchestrator.registerAgent(organizationId, {
        type: 'finance',
        name: 'Finance Agent',
        systemPrompt: 'test',
        tools: ['record_payment'],
        requiresApproval: true,
        approvalThreshold: 50000,
      }, userId);

      const run = await orchestrator.runAgent(organizationId, agent.id, { amount: 75000 });

      expect(run.status).toBe('pending_approval');
      expect(run.approvalRequired).toBe(true);
    });

    it('should retrieve run by ID', async () => {
      const agent = await orchestrator.registerAgent(organizationId, {
        type: 'project',
        name: 'Project Agent',
        systemPrompt: 'test',
        tools: ['assign_task'],
        requiresApproval: false,
      }, userId);

      const run = await orchestrator.runAgent(organizationId, agent.id, { taskId: 'task-456' });
      const retrieved = await orchestrator.getRunById(organizationId, run.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(run.id);
      expect(retrieved.agentId).toBe(agent.id);
    });

    it('should list runs by organization', async () => {
      const agent = await orchestrator.registerAgent(organizationId, {
        type: 'sales',
        name: 'Sales Agent',
        systemPrompt: 'test',
        tools: ['lead_qualify'],
        requiresApproval: false,
      }, userId);

      await orchestrator.runAgent(organizationId, agent.id, {});
      await orchestrator.runAgent(organizationId, agent.id, {});

      const result = await orchestrator.getOrganizationRuns(organizationId, 50, 0);
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
    });

    it('should list runs by agent', async () => {
      const agent = await orchestrator.registerAgent(organizationId, {
        type: 'finance',
        name: 'Finance Agent',
        systemPrompt: 'test',
        tools: ['reconcile'],
        requiresApproval: false,
      }, userId);

      const run1 = await orchestrator.runAgent(organizationId, agent.id, {});
      const run2 = await orchestrator.runAgent(organizationId, agent.id, {});

      const result = await orchestrator.getRunsByAgent(organizationId, agent.id, 50, 0);
      expect(result.items.length).toBeGreaterThanOrEqual(2);
      expect(result.total).toBeGreaterThanOrEqual(2);
    });

    it('should approve pending run', async () => {
      const agent = await orchestrator.registerAgent(organizationId, {
        type: 'finance',
        name: 'Finance Agent',
        systemPrompt: 'test',
        tools: ['record_payment'],
        requiresApproval: true,
      }, userId);

      const run = await orchestrator.runAgent(organizationId, agent.id, { amount: 50000 });
      expect(run.status).toBe('pending_approval');

      const approved = await orchestrator.approveRun(organizationId, run.id, userId);
      expect(approved.status).toBe('completed');
      expect(approved.approvalStatus).toBe('approved');
    });

    it('should reject pending run', async () => {
      const agent = await orchestrator.registerAgent(organizationId, {
        type: 'sales',
        name: 'Sales Agent',
        systemPrompt: 'test',
        tools: ['send_proposal'],
        requiresApproval: true,
      }, userId);

      const run = await orchestrator.runAgent(organizationId, agent.id, { clientId: 'client-123' });

      const rejected = await orchestrator.rejectRun(organizationId, run.id, userId, 'Client not ready');
      expect(rejected.status).toBe('failed');
      expect(rejected.approvalStatus).toBe('rejected');
      expect(rejected.approvalReason).toBe('Client not ready');
    });

    it('should get pending approvals', async () => {
      const agent = await orchestrator.registerAgent(organizationId, {
        type: 'finance',
        name: 'Finance Agent',
        systemPrompt: 'test',
        tools: ['record_payment'],
        requiresApproval: true,
      }, userId);

      const run = await orchestrator.runAgent(organizationId, agent.id, { amount: 60000 });

      const pendingApprovals = await orchestrator.getPendingApprovals(organizationId);
      expect(pendingApprovals.length).toBeGreaterThan(0);
      expect(pendingApprovals[0].status).toBe('pending');
    });

    it('should calculate agent metrics', async () => {
      const agent = await orchestrator.registerAgent(organizationId, {
        type: 'project',
        name: 'Project Agent',
        systemPrompt: 'test',
        tools: ['assign_task'],
        requiresApproval: false,
      }, userId);

      await orchestrator.runAgent(organizationId, agent.id, {});
      await orchestrator.runAgent(organizationId, agent.id, {});

      const metrics = await orchestrator.getAgentMetrics(organizationId, agent.id);

      expect(metrics).toBeDefined();
      expect(metrics.totalRuns).toBeGreaterThanOrEqual(2);
      expect(metrics.successfulRuns).toBeGreaterThanOrEqual(2);
      expect(metrics.avgExecutionTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('SalesAgentService', () => {
    const salesAgent = new SalesAgentService(null);
    const config = {
      autoQualifyLeads: true,
      proposalGenerationTemplate: 'standard',
      followUpFrequency: 7,
      maxProposalsPerDay: 10,
    };

    it('should initialize sales agent config', async () => {
      await salesAgent.initializeAgent(organizationId, config);
      const retrieved = await salesAgent.getAgentConfig(organizationId);
      expect(retrieved.maxProposalsPerDay).toBe(10);
    });

    it('should qualify leads', async () => {
      await salesAgent.initializeAgent(organizationId, config);
      const result = await salesAgent.qualifyLead(organizationId, {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '01001234567',
        serviceInterest: 'web development',
        budget: 50000,
      });

      expect(result.qualified).toBe(true);
      expect(result.score).toBeGreaterThan(60);
      expect(result.recommendedNext).toBe('send_proposal_template');
    });

    it('should generate proposals', async () => {
      await salesAgent.initializeAgent(organizationId, config);
      const result = await salesAgent.generateProposal(organizationId, {
        leadId: 'lead-123',
        serviceType: 'web development',
        estimatedValue: 50000,
        timeline: '3 months',
      });

      expect(result.proposalId).toBeDefined();
      expect(result.content).toContain('PROPOSAL');
      expect(result.content).toContain('web development');
      expect(result.generatedAt).toBeDefined();
    });

    it('should send follow-ups', async () => {
      await salesAgent.initializeAgent(organizationId, config);
      const result = await salesAgent.sendFollowUp(organizationId, 'lead-456');

      expect(result.status).toBe('sent');
      expect(result.sentAt).toBeDefined();
      expect(result.nextFollowUp).toBeDefined();
    });

    it('should analyze win rates', async () => {
      await salesAgent.initializeAgent(organizationId, config);
      const result = await salesAgent.analyzeWinRate(organizationId, {
        startDate: new Date(2025, 0, 1),
        endDate: new Date(2025, 0, 31),
      });

      expect(result.totalProposals).toBeGreaterThan(0);
      expect(result.winRate).toBeGreaterThanOrEqual(0);
      expect(result.avgDealSize).toBeGreaterThan(0);
    });

    it('should identify upsell opportunities', async () => {
      await salesAgent.initializeAgent(organizationId, config);
      const opportunities = await salesAgent.identifyUpsellOpportunities(organizationId, 'client-123');

      expect(Array.isArray(opportunities)).toBe(true);
      expect(opportunities.length).toBeGreaterThan(0);
      expect(opportunities[0].estimatedValue).toBeGreaterThan(0);
      expect(opportunities[0].probability).toBeGreaterThan(0);
    });
  });

  describe('FinanceAgentService', () => {
    const financeAgent = new FinanceAgentService(null);
    const config = {
      autoReconcile: true,
      recurringTransactionDetection: true,
      taxCalculationEnabled: true,
      budgetAlertThreshold: 80,
    };

    it('should initialize finance agent config', async () => {
      await financeAgent.initializeAgent(organizationId, config);
      const retrieved = await financeAgent.getAgentConfig(organizationId);
      expect(retrieved.budgetAlertThreshold).toBe(80);
    });

    it('should record payments', async () => {
      await financeAgent.initializeAgent(organizationId, config);
      const result = await financeAgent.recordPayment(organizationId, {
        invoiceId: 'inv-123',
        amount: 25000,
        date: new Date(),
        method: 'bank_transfer',
        reference: 'transfer-456',
      });

      expect(result.paymentId).toBeDefined();
      expect(result.status).toBe('recorded');
      expect(result.reconcilationStatus).toBe('pending');
    });

    it('should reconcile accounts', async () => {
      await financeAgent.initializeAgent(organizationId, config);
      const result = await financeAgent.reconcileAccounts(organizationId, {
        startDate: new Date(2025, 0, 1),
        endDate: new Date(2025, 0, 31),
      });

      expect(result.totalTransactions).toBeGreaterThan(0);
      expect(result.reconciled).toBeGreaterThanOrEqual(0);
      expect(result.pending).toBeGreaterThanOrEqual(0);
    });

    it('should detect recurring transactions', async () => {
      await financeAgent.initializeAgent(organizationId, config);
      const recurring = await financeAgent.detectRecurringTransactions(organizationId);

      expect(Array.isArray(recurring)).toBe(true);
      expect(recurring.every(r => r.confidence > 0.9)).toBe(true);
    });

    it('should calculate tax liability', async () => {
      await financeAgent.initializeAgent(organizationId, config);
      const result = await financeAgent.calculateTaxLiability(organizationId, {
        startDate: new Date(2025, 0, 1),
        endDate: new Date(2025, 0, 31),
      });

      expect(result.taxableIncome).toBeGreaterThan(0);
      expect(result.estimatedTax).toBeGreaterThan(0);
      expect(result.effectiveTaxRate).toBe(14);
    });

    it('should check budget compliance', async () => {
      await financeAgent.initializeAgent(organizationId, config);
      const result = await financeAgent.checkBudgetCompliance(organizationId);

      expect(result.withinBudget).toBeDefined();
      expect(result.percentageUsed).toBeGreaterThanOrEqual(0);
      expect(result.percentageUsed).toBeLessThanOrEqual(100);
    });
  });

  describe('ProjectAgentService', () => {
    const projectAgent = new ProjectAgentService(null);
    const config = {
      autoAssignTasks: true,
      riskDetection: true,
      resourceOptimization: true,
      milestoneTracking: true,
    };

    it('should initialize project agent config', async () => {
      await projectAgent.initializeAgent(organizationId, config);
      const retrieved = await projectAgent.getAgentConfig(organizationId);
      expect(retrieved.riskDetection).toBe(true);
    });

    it('should assign tasks', async () => {
      await projectAgent.initializeAgent(organizationId, config);
      const result = await projectAgent.assignTask(organizationId, {
        taskId: 'task-123',
        projectId: 'proj-456',
        assignees: ['user-1', 'user-2'],
        priority: 'high',
        estimatedHours: 40,
      });

      expect(result.assignmentId).toBeDefined();
      expect(result.status).toBe('assigned');
    });

    it('should detect risks', async () => {
      await projectAgent.initializeAgent(organizationId, config);
      const risks = await projectAgent.detectRisks(organizationId, 'proj-123');

      expect(Array.isArray(risks)).toBe(true);
      expect(risks.every(r => r.probability >= 0 && r.probability <= 1)).toBe(true);
    });

    it('should optimize resources', async () => {
      await projectAgent.initializeAgent(organizationId, config);
      const result = await projectAgent.optimizeResources(organizationId);

      expect(result.recommendations).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('should track milestones', async () => {
      await projectAgent.initializeAgent(organizationId, config);
      const result = await projectAgent.trackMilestones(organizationId, 'proj-123');

      expect(result.totalMilestones).toBeGreaterThan(0);
      expect(result.completed).toBeGreaterThanOrEqual(0);
      expect(result.onTrack).toBeGreaterThanOrEqual(0);
    });
  });

  describe('WriterAgentService', () => {
    const writerAgent = new WriterAgentService(null);
    const config = {
      brandVoiceEnabled: true,
      languagePreference: 'bilingual' as const,
      contentTemplates: ['proposal', 'email', 'social'],
      grammarCheckEnabled: true,
    };

    it('should initialize writer agent config', async () => {
      await writerAgent.initializeAgent(organizationId, config);
      const retrieved = await writerAgent.getAgentConfig(organizationId);
      expect(retrieved.brandVoiceEnabled).toBe(true);
    });

    it('should generate proposal content', async () => {
      await writerAgent.initializeAgent(organizationId, config);
      const result = await writerAgent.generateContent(organizationId, {
        contentType: 'proposal',
        topic: 'Web Development Services',
        tone: 'professional',
        language: 'en',
      });

      expect(result.contentId).toBeDefined();
      expect(result.content).toContain('PROPOSAL');
      expect(result.wordCount).toBeGreaterThan(0);
    });

    it('should draft emails', async () => {
      await writerAgent.initializeAgent(organizationId, config);
      const result = await writerAgent.draftEmail(organizationId, {
        recipient: 'john@example.com',
        purpose: 'proposal',
        context: 'Web Development Project',
      });

      expect(result.emailId).toBeDefined();
      expect(result.subject).toBeDefined();
      expect(result.body).toContain('ECHOWAVE');
    });

    it('should check grammar', async () => {
      await writerAgent.initializeAgent(organizationId, config);
      const result = await writerAgent.checkGrammar(organizationId, 'This is a test sentence.');

      expect(result.isCorrect).toBeDefined();
      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('BrandAgentService', () => {
    const brandAgent = new BrandAgentService(null);
    const config = {
      enforceGuidelines: true,
      colorPaletteLock: true,
      typographyRules: ['Cairo Bold for headers', 'Inter for body'],
      toneLock: true,
    };

    it('should initialize brand agent config', async () => {
      await brandAgent.initializeAgent(organizationId, config);
      const retrieved = await brandAgent.getAgentConfig(organizationId);
      expect(retrieved.enforceGuidelines).toBe(true);
    });

    it('should validate brand consistency', async () => {
      await brandAgent.initializeAgent(organizationId, config);
      const result = await brandAgent.validateBrandConsistency(organizationId, {
        content: 'This is brand-aligned content.',
        contentType: 'email',
      });

      expect(result.consistent).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should check color compliance', async () => {
      await brandAgent.initializeAgent(organizationId, config);
      const result = await brandAgent.checkColorCompliance(organizationId, [
        { hex: '#1a1a1a', usage: 'background' },
        { hex: '#3498db', usage: 'accent' },
      ]);

      expect(result.compliant).toBeDefined();
      expect(Array.isArray(result.violatedColors)).toBe(true);
    });

    it('should check typography', async () => {
      await brandAgent.initializeAgent(organizationId, config);
      const result = await brandAgent.checkTypography(organizationId, {
        fontFamily: 'Cairo',
        fontSize: 32,
        fontWeight: 'bold',
        usage: 'header',
      });

      expect(result.compliant).toBeDefined();
    });

    it('should generate brand guidelines summary', async () => {
      await brandAgent.initializeAgent(organizationId, config);
      const result = await brandAgent.generateBrandGuidelinesSummary(organizationId);

      expect(result.summary).toBeDefined();
      expect(result.guidelines.length).toBeGreaterThan(0);
    });

    it('should audit brand assets', async () => {
      await brandAgent.initializeAgent(organizationId, config);
      const result = await brandAgent.auditBrandAssets(organizationId);

      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.recommendations).toBeDefined();
    });
  });

  describe('VoiceAgentService', () => {
    const voiceAgent = new VoiceAgentService(null);
    const config = {
      transcriptionEnabled: true,
      languageDetection: true,
      sentimentAnalysis: true,
      callRecordingRetention: 30,
    };

    it('should initialize voice agent config', async () => {
      await voiceAgent.initializeAgent(organizationId, config);
      const retrieved = await voiceAgent.getAgentConfig(organizationId);
      expect(retrieved.callRecordingRetention).toBe(30);
    });

    it('should transcribe calls', async () => {
      await voiceAgent.initializeAgent(organizationId, config);
      const result = await voiceAgent.transcribeCall(organizationId, {
        callId: 'call-123',
        audioUrl: 'https://example.com/call.mp3',
        duration: 300,
      });

      expect(result.transcriptionId).toBeDefined();
      expect(result.text).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect sentiment', async () => {
      await voiceAgent.initializeAgent(organizationId, config);
      const result = await voiceAgent.detectSentiment(organizationId, 'The service was excellent!');

      expect(result.overallSentiment).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
      expect(Array.isArray(result.segments)).toBe(true);
    });

    it('should extract key points', async () => {
      await voiceAgent.initializeAgent(organizationId, config);
      const result = await voiceAgent.extractKeyPoints(organizationId, 'Call about web development project');

      expect(result.summary).toBeDefined();
      expect(result.keyPoints.length).toBeGreaterThan(0);
      expect(Array.isArray(result.actionItems)).toBe(true);
    });

    it('should route calls', async () => {
      await voiceAgent.initializeAgent(organizationId, config);
      const result = await voiceAgent.routeCall(organizationId, {
        callId: 'call-456',
        callType: 'sales',
        urgency: 'high',
      });

      expect(result.routed).toBe(true);
      expect(result.department).toBeDefined();
    });

    it('should generate call summaries', async () => {
      await voiceAgent.initializeAgent(organizationId, config);
      const result = await voiceAgent.generateCallSummary(organizationId, {
        callId: 'call-789',
        transcription: 'Discussion about project timeline',
        duration: 600,
      });

      expect(result.summaryId).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.sentiment).toBeDefined();
    });
  });

  describe('Organization Isolation', () => {
    it('should not return agents from other organizations', async () => {
      const orchestrator = new OrchestratorService(null);
      const org2 = 'org-test-789';

      const agent1 = await orchestrator.registerAgent(organizationId, {
        type: 'sales',
        name: 'Agent Org1',
        systemPrompt: 'test',
        tools: ['tool1'],
        requiresApproval: false,
      }, userId);

      const agent2 = await orchestrator.registerAgent(org2, {
        type: 'finance',
        name: 'Agent Org2',
        systemPrompt: 'test',
        tools: ['tool2'],
        requiresApproval: false,
      }, userId);

      const org1Agents = await orchestrator.getOrganizationAgents(organizationId, 50, 0);
      const org1AgentIds = org1Agents.items.map(a => a.id);

      expect(org1AgentIds).toContain(agent1.id);
      expect(org1AgentIds).not.toContain(agent2.id);
    });

    it('should not return runs from other organizations', async () => {
      const orchestrator = new OrchestratorService(null);
      const org2 = 'org-test-999';

      const agent1 = await orchestrator.registerAgent(organizationId, {
        type: 'sales',
        name: 'Agent Org1',
        systemPrompt: 'test',
        tools: ['tool1'],
        requiresApproval: false,
      }, userId);

      const agent2 = await orchestrator.registerAgent(org2, {
        type: 'finance',
        name: 'Agent Org2',
        systemPrompt: 'test',
        tools: ['tool2'],
        requiresApproval: false,
      }, userId);

      const run1 = await orchestrator.runAgent(organizationId, agent1.id, {});
      const run2 = await orchestrator.runAgent(org2, agent2.id, {});

      const org1Runs = await orchestrator.getOrganizationRuns(organizationId, 50, 0);
      const org1RunIds = org1Runs.items.map(r => r.id);

      expect(org1RunIds).toContain(run1.id);
      expect(org1RunIds).not.toContain(run2.id);
    });
  });

  describe('Integration Scenarios', () => {
    it('should execute complete sales workflow', async () => {
      const orchestrator = new OrchestratorService(null);
      const salesAgent = new SalesAgentService(null);

      const agent = await orchestrator.registerAgent(organizationId, {
        type: 'sales',
        name: 'Sales Workflow Agent',
        systemPrompt: 'Execute sales workflow',
        tools: ['qualify_lead', 'generate_proposal', 'send_followup'],
        requiresApproval: false,
      }, userId);

      await salesAgent.initializeAgent(organizationId, {
        autoQualifyLeads: true,
        proposalGenerationTemplate: 'standard',
        followUpFrequency: 7,
        maxProposalsPerDay: 10,
      });

      const qualifyResult = await salesAgent.qualifyLead(organizationId, {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '01234567890',
        serviceInterest: 'branding',
        budget: 30000,
      });

      expect(qualifyResult.qualified).toBe(true);

      if (qualifyResult.qualified) {
        const proposalResult = await salesAgent.generateProposal(organizationId, {
          leadId: 'lead-workflow',
          serviceType: 'branding',
          estimatedValue: 30000,
        });

        expect(proposalResult.proposalId).toBeDefined();
        expect(proposalResult.content).toContain('PROPOSAL');
      }
    });

    it('should execute complete finance workflow', async () => {
      const orchestrator = new OrchestratorService(null);
      const financeAgent = new FinanceAgentService(null);

      const agent = await orchestrator.registerAgent(organizationId, {
        type: 'finance',
        name: 'Finance Workflow Agent',
        systemPrompt: 'Execute finance workflow',
        tools: ['record_payment', 'reconcile', 'tax_calc'],
        requiresApproval: true,
      }, userId);

      await financeAgent.initializeAgent(organizationId, {
        autoReconcile: true,
        recurringTransactionDetection: true,
        taxCalculationEnabled: true,
        budgetAlertThreshold: 80,
      });

      const paymentResult = await financeAgent.recordPayment(organizationId, {
        invoiceId: 'inv-workflow',
        amount: 50000,
        date: new Date(),
        method: 'bank_transfer',
        reference: 'workflow-001',
      });

      expect(paymentResult.paymentId).toBeDefined();

      const reconcileResult = await financeAgent.reconcileAccounts(organizationId, {
        startDate: new Date(2025, 0, 1),
        endDate: new Date(2025, 0, 31),
      });

      expect(reconcileResult.totalTransactions).toBeGreaterThan(0);
    });

    it('should execute multi-agent approval workflow', async () => {
      const orchestrator = new OrchestratorService(null);

      const salesAgent = await orchestrator.registerAgent(organizationId, {
        type: 'sales',
        name: 'Sales Review',
        systemPrompt: 'Review sales',
        tools: ['review_proposal'],
        requiresApproval: false,
      }, userId);

      const financeAgent = await orchestrator.registerAgent(organizationId, {
        type: 'finance',
        name: 'Finance Approval',
        systemPrompt: 'Approve finance',
        tools: ['approve_payment'],
        requiresApproval: true,
      }, userId);

      const salesRun = await orchestrator.runAgent(organizationId, salesAgent.id, { proposalId: 'prop-123' });
      expect(salesRun.status).toBe('completed');

      const financeRun = await orchestrator.runAgent(organizationId, financeAgent.id, { amount: 50000 });
      expect(financeRun.status).toBe('pending_approval');

      const approved = await orchestrator.approveRun(organizationId, financeRun.id, userId);
      expect(approved.status).toBe('completed');
    });
  });
});
