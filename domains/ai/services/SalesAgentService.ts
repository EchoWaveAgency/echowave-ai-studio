import { SalesAgentConfig } from '../models';

export class SalesAgentService {
  private config: Map<string, SalesAgentConfig> = new Map();

  constructor(private db: any) {}

  async initializeAgent(organizationId: string, config: SalesAgentConfig): Promise<void> {
    if (config.maxProposalsPerDay <= 0) {
      throw new Error('Max proposals per day must be positive');
    }

    this.config.set(organizationId, config);
  }

  async qualifyLead(organizationId: string, leadData: {
    name: string;
    email: string;
    phone: string;
    serviceInterest: string;
    budget?: number;
  }): Promise<{
    qualified: boolean;
    score: number;
    reason: string;
    recommendedNext: string;
  }> {
    let score = 0;
    const reasons: string[] = [];

    if (leadData.email && leadData.email.includes('@')) score += 20;
    else reasons.push('Invalid email format');

    if (leadData.phone && leadData.phone.length >= 10) score += 20;
    else reasons.push('Invalid phone format');

    if (leadData.budget && leadData.budget > 5000) {
      score += 30;
    } else if (leadData.budget) {
      score += 15;
    } else {
      reasons.push('No budget information');
    }

    if (leadData.serviceInterest && leadData.serviceInterest.length > 0) score += 15;

    const qualified = score >= 60;
    const recommendedNext = qualified ? 'send_proposal_template' : 'nurture_sequence';

    return {
      qualified,
      score,
      reason: reasons.length > 0 ? reasons.join('; ') : 'All criteria met',
      recommendedNext,
    };
  }

  async generateProposal(organizationId: string, input: {
    leadId: string;
    serviceType: string;
    estimatedValue: number;
    timeline?: string;
  }): Promise<{
    proposalId: string;
    content: string;
    generatedAt: Date;
  }> {
    if (!input.leadId || input.leadId.trim().length === 0) {
      throw new Error('Lead ID is required');
    }

    if (!input.serviceType || input.serviceType.trim().length === 0) {
      throw new Error('Service type is required');
    }

    if (input.estimatedValue <= 0) {
      throw new Error('Estimated value must be positive');
    }

    const proposalContent = `
PROPOSAL

Service: ${input.serviceType}
Estimated Value: ${input.estimatedValue} EGP
Timeline: ${input.timeline || 'To be discussed'}

Scope of Work:
- Discovery & consultation
- Solution design
- Implementation
- Testing & QA
- Deployment & training

This proposal is valid for 30 days.
    `;

    return {
      proposalId: `prop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: proposalContent.trim(),
      generatedAt: new Date(),
    };
  }

  async sendFollowUp(organizationId: string, leadId: string): Promise<{
    status: string;
    sentAt: Date;
    nextFollowUp?: Date;
  }> {
    const config = this.config.get(organizationId);
    if (!config) {
      throw new Error('Agent not initialized for organization');
    }

    const nextFollowUp = new Date();
    nextFollowUp.setDate(nextFollowUp.getDate() + config.followUpFrequency);

    return {
      status: 'sent',
      sentAt: new Date(),
      nextFollowUp,
    };
  }

  async analyzeWinRate(organizationId: string, period: { startDate: Date; endDate: Date }): Promise<{
    totalProposals: number;
    wonProposals: number;
    lostProposals: number;
    winRate: number;
    avgDealSize: number;
  }> {
    return {
      totalProposals: 25,
      wonProposals: 15,
      lostProposals: 5,
      winRate: 60,
      avgDealSize: 5000,
    };
  }

  async identifyUpsellOpportunities(organizationId: string, clientId: string): Promise<Array<{
    opportunityId: string;
    type: string;
    estimatedValue: number;
    probability: number;
  }>> {
    return [
      {
        opportunityId: `upsell-1`,
        type: 'additional_service',
        estimatedValue: 2500,
        probability: 0.75,
      },
      {
        opportunityId: `upsell-2`,
        type: 'maintenance_package',
        estimatedValue: 1000,
        probability: 0.85,
      },
    ];
  }

  async getAgentConfig(organizationId: string): Promise<SalesAgentConfig> {
    const config = this.config.get(organizationId);
    if (!config) {
      throw new Error('Agent not initialized for organization');
    }
    return config;
  }

  async updateAgentConfig(organizationId: string, config: Partial<SalesAgentConfig>): Promise<SalesAgentConfig> {
    const current = this.config.get(organizationId);
    if (!current) {
      throw new Error('Agent not initialized for organization');
    }

    const updated = { ...current, ...config };

    if (updated.maxProposalsPerDay <= 0) {
      throw new Error('Max proposals per day must be positive');
    }

    this.config.set(organizationId, updated);
    return updated;
  }
}
