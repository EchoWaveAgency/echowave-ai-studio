import { OperationalMetrics, PERIOD_TYPES } from '../models';

export class OperationalAnalyticsService {
  private metrics: Map<string, OperationalMetrics> = new Map();

  constructor(private db: any) {}

  async calculateOperationalMetrics(organizationId: string, period: typeof PERIOD_TYPES[number], startDate: Date, endDate: Date): Promise<OperationalMetrics> {
    if (startDate >= endDate) {
      throw new Error('Start date must be before end date');
    }

    const metric: OperationalMetrics = {
      id: `om-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      period,
      startDate,
      endDate,
      totalProjects: 0,
      completedProjects: 0,
      completionRate: 0,
      avgProjectDuration: 0,
      onTimeDeliveryRate: 0,
      contractMetrics: { totalContracts: 0, activeContracts: 0, signedContracts: 0, expiringContracts: 0 },
      teamMetrics: { totalTeamMembers: 0, activeMembers: 0, utilizationRate: 0, avgTasksPerMember: 0 },
      qualityMetrics: { defectRate: 0, customerSatisfactionScore: 0, reworkRate: 0 },
    };

    metric.totalProjects = await this.getTotalProjects(organizationId, startDate, endDate);
    metric.completedProjects = await this.getCompletedProjects(organizationId, startDate, endDate);
    metric.completionRate = metric.totalProjects > 0 ? (metric.completedProjects / metric.totalProjects) * 100 : 0;
    metric.avgProjectDuration = await this.getAverageProjectDuration(organizationId, startDate, endDate);
    metric.onTimeDeliveryRate = await this.getOnTimeDeliveryRate(organizationId, startDate, endDate);
    metric.contractMetrics = await this.getContractMetrics(organizationId);
    metric.teamMetrics = await this.getTeamMetrics(organizationId);
    metric.qualityMetrics = await this.getQualityMetrics(organizationId, startDate, endDate);

    this.metrics.set(metric.id, metric);
    return metric;
  }

  private async getTotalProjects(organizationId: string, startDate: Date, endDate: Date): Promise<number> {
    return 12;
  }

  private async getCompletedProjects(organizationId: string, startDate: Date, endDate: Date): Promise<number> {
    return 10;
  }

  private async getAverageProjectDuration(organizationId: string, startDate: Date, endDate: Date): Promise<number> {
    return 25;
  }

  private async getOnTimeDeliveryRate(organizationId: string, startDate: Date, endDate: Date): Promise<number> {
    return 85;
  }

  private async getContractMetrics(organizationId: string): Promise<{ totalContracts: number; activeContracts: number; signedContracts: number; expiringContracts: number }> {
    return { totalContracts: 45, activeContracts: 35, signedContracts: 40, expiringContracts: 8 };
  }

  private async getTeamMetrics(organizationId: string): Promise<{ totalTeamMembers: number; activeMembers: number; utilizationRate: number; avgTasksPerMember: number }> {
    return { totalTeamMembers: 25, activeMembers: 23, utilizationRate: 78, avgTasksPerMember: 8.5 };
  }

  private async getQualityMetrics(organizationId: string, startDate: Date, endDate: Date): Promise<{ defectRate: number; customerSatisfactionScore: number; reworkRate: number }> {
    return { defectRate: 2.5, customerSatisfactionScore: 4.2, reworkRate: 5 };
  }

  async getMetricById(organizationId: string, metricId: string): Promise<OperationalMetrics> {
    const metric = this.metrics.get(metricId);
    if (!metric || metric.organizationId !== organizationId) {
      throw new Error('Operational metrics not found');
    }
    return metric;
  }

  async getOrganizationMetrics(organizationId: string, limit: number = 50, offset: number = 0): Promise<{ items: OperationalMetrics[]; total: number }> {
    const metrics = Array.from(this.metrics.values())
      .filter(m => m.organizationId === organizationId)
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

    return {
      items: metrics.slice(offset, offset + limit),
      total: metrics.length,
    };
  }

  async getLatestMetrics(organizationId: string): Promise<OperationalMetrics | null> {
    const metrics = Array.from(this.metrics.values())
      .filter(m => m.organizationId === organizationId)
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

    return metrics.length > 0 ? metrics[0] : null;
  }

  async getProjectEfficiency(organizationId: string): Promise<{
    avgCostPerProject: number;
    avgRevenuePerProject: number;
    projectProfitMargin: number;
    resourceUtilization: number;
  }> {
    return {
      avgCostPerProject: 8333,
      avgRevenuePerProject: 12500,
      projectProfitMargin: 33,
      resourceUtilization: 78,
    };
  }

  async getDeliveryMetrics(organizationId: string): Promise<{
    avgDeliveryTime: number;
    estimateAccuracy: number;
    scheduleVariance: number;
    costVariance: number;
  }> {
    return {
      avgDeliveryTime: 25,
      estimateAccuracy: 92,
      scheduleVariance: 3.5,
      costVariance: -2.1,
    };
  }

  async getContractAnalysis(organizationId: string): Promise<{
    renewalRate: number;
    expansionRate: number;
    churnRate: number;
    avgContractValue: number;
    avgContractDuration: number;
  }> {
    return {
      renewalRate: 78,
      expansionRate: 35,
      churnRate: 22,
      avgContractValue: 15000,
      avgContractDuration: 24,
    };
  }

  async getTeamProductivity(organizationId: string): Promise<{
    tasksCompletedPerDay: number;
    avgTaskDuration: number;
    onTimeCompletionRate: number;
    skillUtilization: Record<string, number>;
  }> {
    return {
      tasksCompletedPerDay: 8.5,
      avgTaskDuration: 4.2,
      onTimeCompletionRate: 88,
      skillUtilization: {
        'Frontend Development': 85,
        'Backend Development': 82,
        'Design': 75,
        'QA': 80,
      },
    };
  }

  async getBottlenecks(organizationId: string): Promise<{
    processBottlenecks: Array<{ process: string; avgTime: number; impact: string }>;
    resourceBottlenecks: Array<{ resource: string; utilization: number; gap: string }>;
    skillGaps: Array<{ skill: string; demand: number; supply: number }>;
  }> {
    return {
      processBottlenecks: [
        { process: 'Code Review', avgTime: 8, impact: 'High' },
        { process: 'Testing', avgTime: 12, impact: 'Medium' },
        { process: 'Deployment', avgTime: 4, impact: 'Medium' },
      ],
      resourceBottlenecks: [
        { resource: 'Senior Developer', utilization: 95, gap: 'High Demand' },
        { resource: 'Designer', utilization: 88, gap: 'Medium Demand' },
      ],
      skillGaps: [
        { skill: 'Machine Learning', demand: 5, supply: 1 },
        { skill: 'Cloud Architecture', demand: 8, supply: 3 },
      ],
    };
  }

  async getRiskAssessment(organizationId: string): Promise<{
    scheduleRisks: Array<{ risk: string; probability: number; impact: string }>;
    resourceRisks: Array<{ risk: string; severity: string }>;
    technicalRisks: Array<{ risk: string; mitigation: string }>;
  }> {
    return {
      scheduleRisks: [
        { risk: 'Dependency delays', probability: 0.3, impact: 'High' },
        { risk: 'Scope creep', probability: 0.4, impact: 'Medium' },
      ],
      resourceRisks: [
        { risk: 'Key person departure', severity: 'High' },
        { risk: 'Skill shortage', severity: 'Medium' },
      ],
      technicalRisks: [
        { risk: 'Legacy system integration', mitigation: 'Parallel testing' },
        { risk: 'Performance issues', mitigation: 'Load testing' },
      ],
    };
  }

  async delete(organizationId: string, metricId: string): Promise<void> {
    const metric = await this.getMetricById(organizationId, metricId);
    this.metrics.delete(metricId);
  }
}
