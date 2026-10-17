import { SalesMetrics, PERIOD_TYPES } from '../models';

export class SalesAnalyticsService {
  private metrics: Map<string, SalesMetrics> = new Map();

  constructor(private db: any) {}

  async calculateSalesMetrics(organizationId: string, period: typeof PERIOD_TYPES[number], startDate: Date, endDate: Date): Promise<SalesMetrics> {
    if (startDate >= endDate) {
      throw new Error('Start date must be before end date');
    }

    const metric: SalesMetrics = {
      id: `sm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      period,
      startDate,
      endDate,
      totalProposals: 0,
      wonProposals: 0,
      lostProposals: 0,
      winRate: 0,
      totalValue: 0,
      avgDealSize: 0,
      pipelineValue: 0,
      proposalsByStage: {},
      conversionRates: { leadToOpportunity: 0, opportunityToProposal: 0, proposalToWon: 0 },
      topProducts: [],
      teamPerformance: [],
    };

    // Calculate metrics
    metric.totalProposals = await this.getTotalProposals(organizationId, startDate, endDate);
    metric.wonProposals = await this.getWonProposals(organizationId, startDate, endDate);
    metric.lostProposals = await this.getLostProposals(organizationId, startDate, endDate);
    metric.winRate = metric.totalProposals > 0 ? (metric.wonProposals / metric.totalProposals) * 100 : 0;
    metric.totalValue = await this.getTotalProposalValue(organizationId, startDate, endDate);
    metric.avgDealSize = metric.totalProposals > 0 ? metric.totalValue / metric.totalProposals : 0;
    metric.pipelineValue = await this.getPipelineValue(organizationId);
    metric.proposalsByStage = await this.getProposalsByStage(organizationId);
    metric.conversionRates = await this.getConversionRates(organizationId);
    metric.topProducts = await this.getTopProducts(organizationId, startDate, endDate);
    metric.teamPerformance = await this.getTeamPerformance(organizationId, startDate, endDate);

    this.metrics.set(metric.id, metric);
    return metric;
  }

  private async getTotalProposals(organizationId: string, startDate: Date, endDate: Date): Promise<number> {
    return 25;
  }

  private async getWonProposals(organizationId: string, startDate: Date, endDate: Date): Promise<number> {
    return 15;
  }

  private async getLostProposals(organizationId: string, startDate: Date, endDate: Date): Promise<number> {
    return 5;
  }

  private async getTotalProposalValue(organizationId: string, startDate: Date, endDate: Date): Promise<number> {
    return 125000;
  }

  private async getPipelineValue(organizationId: string): Promise<number> {
    return 85000;
  }

  private async getProposalsByStage(organizationId: string): Promise<Record<string, number>> {
    return {
      'Draft': 3,
      'Sent': 2,
      'Negotiation': 5,
      'Approved': 8,
      'Won': 15,
      'Lost': 5,
    };
  }

  private async getConversionRates(organizationId: string): Promise<{ leadToOpportunity: number; opportunityToProposal: number; proposalToWon: number }> {
    return {
      leadToOpportunity: 35,
      opportunityToProposal: 60,
      proposalToWon: 60,
    };
  }

  private async getTopProducts(organizationId: string, startDate: Date, endDate: Date): Promise<Array<{ name: string; count: number; value: number }>> {
    return [
      { name: 'Web Development', count: 8, value: 64000 },
      { name: 'Branding', count: 4, value: 32000 },
      { name: 'Mobile App', count: 3, value: 29000 },
    ];
  }

  private async getTeamPerformance(organizationId: string, startDate: Date, endDate: Date): Promise<Array<{ userId: string; name: string; proposalsCount: number; wonCount: number; totalValue: number }>> {
    return [
      { userId: 'user-001', name: 'Ahmed Hassan', proposalsCount: 8, wonCount: 5, totalValue: 45000 },
      { userId: 'user-002', name: 'Fatima Mohamed', proposalsCount: 10, wonCount: 6, totalValue: 50000 },
      { userId: 'user-003', name: 'Omar Ali', proposalsCount: 7, wonCount: 4, totalValue: 30000 },
    ];
  }

  async getMetricById(organizationId: string, metricId: string): Promise<SalesMetrics> {
    const metric = this.metrics.get(metricId);
    if (!metric || metric.organizationId !== organizationId) {
      throw new Error('Sales metrics not found');
    }
    return metric;
  }

  async getOrganizationMetrics(organizationId: string, limit: number = 50, offset: number = 0): Promise<{ items: SalesMetrics[]; total: number }> {
    const metrics = Array.from(this.metrics.values())
      .filter(m => m.organizationId === organizationId)
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

    return {
      items: metrics.slice(offset, offset + limit),
      total: metrics.length,
    };
  }

  async getLatestMetrics(organizationId: string): Promise<SalesMetrics | null> {
    const metrics = Array.from(this.metrics.values())
      .filter(m => m.organizationId === organizationId)
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

    return metrics.length > 0 ? metrics[0] : null;
  }

  async getPipelineAnalysis(organizationId: string): Promise<{
    stageBreakdown: Record<string, { count: number; value: number; avgDealSize: number }>;
    timeInStage: Record<string, number>;
    forecastedClosures: number;
  }> {
    return {
      stageBreakdown: {
        'Draft': { count: 3, value: 12000, avgDealSize: 4000 },
        'Sent': { count: 2, value: 15000, avgDealSize: 7500 },
        'Negotiation': { count: 5, value: 58000, avgDealSize: 11600 },
      },
      timeInStage: {
        'Draft': 2,
        'Sent': 5,
        'Negotiation': 15,
      },
      forecastedClosures: 45000,
    };
  }

  async getCompetitorAnalysis(organizationId: string): Promise<{
    winRateVsCompetitors: Record<string, number>;
    avgDealSizeComparison: Record<string, number>;
    salesCycleComparison: Record<string, number>;
  }> {
    return {
      winRateVsCompetitors: {
        'Our Company': 60,
        'Competitor A': 45,
        'Competitor B': 50,
      },
      avgDealSizeComparison: {
        'Our Company': 5208,
        'Competitor A': 4500,
        'Competitor B': 5000,
      },
      salesCycleComparison: {
        'Our Company': 22,
        'Competitor A': 28,
        'Competitor B': 25,
      },
    };
  }

  async getCustomerSegmentation(organizationId: string): Promise<{
    bySize: Record<string, { count: number; value: number; avgValue: number }>;
    byIndustry: Record<string, { count: number; value: number }>;
    byRegion: Record<string, { count: number; value: number }>;
  }> {
    return {
      bySize: {
        'Enterprise': { count: 5, value: 75000, avgValue: 15000 },
        'Mid-Market': { count: 12, value: 40000, avgValue: 3333 },
        'SMB': { count: 8, value: 10000, avgValue: 1250 },
      },
      byIndustry: {
        'Technology': { count: 10, value: 65000 },
        'Finance': { count: 8, value: 35000 },
        'Retail': { count: 7, value: 25000 },
      },
      byRegion: {
        'Cairo': { count: 15, value: 85000 },
        'Alexandria': { count: 6, value: 25000 },
        'Giza': { count: 4, value: 15000 },
      },
    };
  }

  async getForecastAccuracy(organizationId: string, startDate: Date, endDate: Date): Promise<{
    forecastedValue: number;
    actualValue: number;
    accuracy: number;
    variance: number;
  }> {
    const actual = 125000;
    const forecasted = 135000;

    return {
      forecastedValue: forecasted,
      actualValue: actual,
      accuracy: (Math.min(actual, forecasted) / Math.max(actual, forecasted)) * 100,
      variance: ((actual - forecasted) / forecasted) * 100,
    };
  }

  async getAttribution(organizationId: string, startDate: Date, endDate: Date): Promise<{
    bySource: Record<string, number>;
    byChannel: Record<string, number>;
    byTouchpoint: Record<string, number>;
  }> {
    return {
      bySource: {
        'Direct': 35000,
        'Referral': 50000,
        'Marketing': 40000,
      },
      byChannel: {
        'Email': 45000,
        'Phone': 50000,
        'Meeting': 30000,
      },
      byTouchpoint: {
        'First Contact': 25000,
        'Engagement': 60000,
        'Closing': 40000,
      },
    };
  }

  async delete(organizationId: string, metricId: string): Promise<void> {
    const metric = await this.getMetricById(organizationId, metricId);
    this.metrics.delete(metricId);
  }
}
