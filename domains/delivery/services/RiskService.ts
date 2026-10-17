import {
  ProjectRisk,
  ProjectIssue,
  RiskLevel,
  RiskStatus,
  TaskPriority,
} from "../models/index";

export class RiskService {
  private risks = new Map<string, ProjectRisk>();
  private issues = new Map<string, ProjectIssue>();
  private riskIdCounter = 1;
  private issueIdCounter = 1;

  // Create Risk
  createRisk(
    organizationId: string,
    projectId: string,
    data: {
      title: string;
      description: string;
      category: string;
      probability: number; // 0-1
      impact: RiskLevel;
      mitigationPlan: string;
      ownerId: string;
    }
  ): ProjectRisk {
    if (!data.title || data.probability < 0 || data.probability > 1) {
      throw new Error("title is required and probability must be 0-1");
    }

    // Derive overall level from probability and impact
    let overallLevel: RiskLevel = RiskLevel.LOW;
    const riskScore = data.probability * this.getImpactScore(data.impact);
    if (riskScore > 0.6) {
      overallLevel = RiskLevel.CRITICAL;
    } else if (riskScore > 0.4) {
      overallLevel = RiskLevel.HIGH;
    } else if (riskScore > 0.2) {
      overallLevel = RiskLevel.MEDIUM;
    }

    const risk: ProjectRisk = {
      id: `risk_${projectId}_${this.riskIdCounter++}`,
      project_id: projectId,
      title: data.title,
      description: data.description,
      category: data.category,
      probability: data.probability,
      impact: data.impact,
      overall_level: overallLevel,
      status: RiskStatus.IDENTIFIED,
      mitigation_plan: data.mitigationPlan,
      owner_id: data.ownerId,
      identified_date: new Date(),
      tags: [],
    };

    this.risks.set(risk.id, risk);
    return risk;
  }

  // Get Risk
  getRiskById(organizationId: string, riskId: string): ProjectRisk {
    const risk = this.risks.get(riskId);
    if (!risk) {
      throw new Error("Risk not found");
    }
    return risk;
  }

  // Get Project Risks
  getProjectRisks(organizationId: string, projectId: string, filters?: {
    status?: RiskStatus;
    level?: RiskLevel;
    limit?: number;
    offset?: number;
  }): ProjectRisk[] {
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    let risks = Array.from(this.risks.values()).filter(
      (r) => r.project_id === projectId
    );

    if (filters?.status) {
      risks = risks.filter((r) => r.status === filters.status);
    }

    if (filters?.level) {
      risks = risks.filter((r) => r.overall_level === filters.level);
    }

    return risks.slice(offset, offset + limit);
  }

  // Update Risk Status
  updateRiskStatus(organizationId: string, riskId: string, status: RiskStatus): ProjectRisk {
    const risk = this.getRiskById(organizationId, riskId);
    risk.status = status;

    if (status === RiskStatus.RESOLVED) {
      risk.resolved_date = new Date();
    } else if (status === RiskStatus.MITIGATED) {
      risk.target_resolution_date = new Date();
    }

    return risk;
  }

  // Update Risk Mitigation Plan
  updateMitigationPlan(organizationId: string, riskId: string, plan: string): ProjectRisk {
    const risk = this.getRiskById(organizationId, riskId);
    risk.mitigation_plan = plan;
    return risk;
  }

  // Create Issue
  createIssue(
    organizationId: string,
    projectId: string,
    data: {
      title: string;
      description: string;
      category: string;
      severity: TaskPriority;
      reportedById: string;
      assignedToId?: string;
    }
  ): ProjectIssue {
    if (!data.title || !data.reportedById) {
      throw new Error("title and reportedById are required");
    }

    const issue: ProjectIssue = {
      id: `issue_${projectId}_${this.issueIdCounter++}`,
      project_id: projectId,
      title: data.title,
      description: data.description,
      category: data.category,
      severity: data.severity,
      status: "todo",
      reported_by_id: data.reportedById,
      assigned_to_id: data.assignedToId,
      created_date: new Date(),
      resolution: "",
      related_tasks: [],
      related_risks: [],
      tags: [],
    };

    this.issues.set(issue.id, issue);
    return issue;
  }

  // Get Issue
  getIssueById(organizationId: string, issueId: string): ProjectIssue {
    const issue = this.issues.get(issueId);
    if (!issue) {
      throw new Error("Issue not found");
    }
    return issue;
  }

  // Get Project Issues
  getProjectIssues(organizationId: string, projectId: string, filters?: {
    status?: string;
    severity?: TaskPriority;
    limit?: number;
    offset?: number;
  }): ProjectIssue[] {
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    let issues = Array.from(this.issues.values()).filter(
      (i) => i.project_id === projectId
    );

    if (filters?.status) {
      issues = issues.filter((i) => i.status === filters.status);
    }

    if (filters?.severity) {
      issues = issues.filter((i) => i.severity === filters.severity);
    }

    return issues.slice(offset, offset + limit);
  }

  // Update Issue Status
  updateIssueStatus(organizationId: string, issueId: string, status: string): ProjectIssue {
    const issue = this.getIssueById(organizationId, issueId);
    issue.status = status;

    if (status === "completed") {
      issue.resolved_date = new Date();
    }

    return issue;
  }

  // Resolve Issue
  resolveIssue(organizationId: string, issueId: string, resolution: string): ProjectIssue {
    const issue = this.getIssueById(organizationId, issueId);
    issue.status = "completed";
    issue.resolution = resolution;
    issue.resolved_date = new Date();
    return issue;
  }

  // Link Issue to Risk
  linkIssueToRisk(organizationId: string, issueId: string, riskId: string): ProjectIssue {
    const issue = this.getIssueById(organizationId, issueId);
    if (!issue.related_risks.includes(riskId)) {
      issue.related_risks.push(riskId);
    }
    return issue;
  }

  // Link Issue to Task
  linkIssueToTask(organizationId: string, issueId: string, taskId: string): ProjectIssue {
    const issue = this.getIssueById(organizationId, issueId);
    if (!issue.related_tasks.includes(taskId)) {
      issue.related_tasks.push(taskId);
    }
    return issue;
  }

  // Get Project Risk Summary
  getProjectRiskSummary(organizationId: string, projectId: string): {
    totalRisks: number;
    byLevel: Record<RiskLevel, number>;
    byStatus: Record<RiskStatus, number>;
    criticalRisks: ProjectRisk[];
    openIssues: ProjectIssue[];
  } {
    const risks = this.getProjectRisks(organizationId, projectId);
    const issues = this.getProjectIssues(organizationId, projectId);

    const byLevel: Record<RiskLevel, number> = {
      [RiskLevel.LOW]: 0,
      [RiskLevel.MEDIUM]: 0,
      [RiskLevel.HIGH]: 0,
      [RiskLevel.CRITICAL]: 0,
    };

    const byStatus: Record<RiskStatus, number> = {
      [RiskStatus.IDENTIFIED]: 0,
      [RiskStatus.MONITORING]: 0,
      [RiskStatus.MITIGATED]: 0,
      [RiskStatus.RESOLVED]: 0,
    };

    risks.forEach((risk) => {
      byLevel[risk.overall_level]++;
      byStatus[risk.status]++;
    });

    const criticalRisks = risks.filter((r) => r.overall_level === RiskLevel.CRITICAL);
    const openIssues = issues.filter((i) => i.status !== "completed");

    return {
      totalRisks: risks.length,
      byLevel,
      byStatus,
      criticalRisks,
      openIssues,
    };
  }

  // Private helper
  private getImpactScore(impact: RiskLevel): number {
    switch (impact) {
      case RiskLevel.LOW:
        return 0.25;
      case RiskLevel.MEDIUM:
        return 0.5;
      case RiskLevel.HIGH:
        return 0.75;
      case RiskLevel.CRITICAL:
        return 1.0;
      default:
        return 0;
    }
  }
}
