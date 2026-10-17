// Phase 14: Delivery & Project Management Models

// Project Status and Phases
export enum ProjectStatus {
  PLANNING = "planning",
  KICKOFF = "kickoff",
  IN_PROGRESS = "in_progress",
  ON_HOLD = "on_hold",
  IN_REVIEW = "in_review",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum ProjectPhaseType {
  DISCOVERY = "discovery",
  DESIGN = "design",
  DEVELOPMENT = "development",
  QA_TESTING = "qa_testing",
  DEPLOYMENT = "deployment",
  MAINTENANCE = "maintenance",
  CUSTOM = "custom",
}

// Task and Milestone Models
export enum TaskStatus {
  TODO = "todo",
  IN_PROGRESS = "in_progress",
  IN_REVIEW = "in_review",
  BLOCKED = "blocked",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum MilestoneStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  AT_RISK = "at_risk",
  ON_TRACK = "on_track",
  COMPLETED = "completed",
  MISSED = "missed",
}

// Resource and Capacity Models
export enum ResourceRole {
  PROJECT_MANAGER = "project_manager",
  DESIGNER = "designer",
  DEVELOPER = "developer",
  QA_ENGINEER = "qa_engineer",
  CONTENT_SPECIALIST = "content_specialist",
  ACCOUNT_MANAGER = "account_manager",
  BUSINESS_ANALYST = "business_analyst",
  LEAD = "lead",
  CONTRIBUTOR = "contributor",
}

export enum RiskLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum RiskStatus {
  IDENTIFIED = "identified",
  MONITORING = "monitoring",
  MITIGATED = "mitigated",
  RESOLVED = "resolved",
}

// Core Interfaces
export interface Project {
  id: string;
  organization_id: string;
  contract_id?: string; // Link to Phase 9 contracts
  name: string;
  description: string;
  status: ProjectStatus;
  phases: ProjectPhase[];
  start_date: Date;
  end_date: Date;
  budget?: number;
  budget_used?: number;
  client_id: string;
  project_manager_id: string;
  team_members: ProjectTeamMember[];
  milestones: Milestone[];
  tasks: Task[];
  deliverables: Deliverable[];
  risks: ProjectRisk[];
  issues: ProjectIssue[];
  timeline_variance: number; // Days ahead/behind schedule
  budget_variance: number; // % over/under budget
  completion_percentage: number; // 0-100
  created_by: string;
  updated_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface ProjectPhase {
  id: string;
  project_id: string;
  name: string;
  type: ProjectPhaseType;
  description: string;
  start_date: Date;
  end_date: Date;
  status: ProjectStatus;
  sequence: number;
  duration_days: number;
  completion_percentage: number;
  dependencies: string[]; // Phase IDs
  deliverables: string[]; // Deliverable IDs
}

export interface Milestone {
  id: string;
  project_id: string;
  name: string;
  description: string;
  target_date: Date;
  status: MilestoneStatus;
  completion_date?: Date;
  phase_id: string;
  assigned_to_id?: string;
  deliverables: string[]; // Deliverable IDs
  criteria: MilestoneCriteria[];
  variance_days: number;
}

export interface MilestoneCriteria {
  name: string;
  description: string;
  completed: boolean;
  completed_date?: Date;
}

export interface Task {
  id: string;
  project_id: string;
  milestone_id?: string;
  parent_task_id?: string; // For sub-tasks
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to_id: string;
  estimated_hours: number;
  actual_hours?: number;
  start_date: Date;
  due_date: Date;
  completion_date?: Date;
  dependencies: string[]; // Task IDs
  subtasks: Task[];
  acceptance_criteria: string[];
  blocked_by?: string; // Task ID blocking this task
  block_reason?: string;
  completion_percentage: number;
  tags: string[];
  created_by: string;
  updated_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface ProjectTeamMember {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  role: ResourceRole;
  capacity_percentage: number; // 0-100 (allocated hours)
  allocated_hours: number;
  actual_hours?: number;
  start_date: Date;
  end_date?: Date;
  skills: string[];
  assignments: Task[]; // Assigned tasks
}

export interface Deliverable {
  id: string;
  project_id: string;
  name: string;
  description: string;
  type: string; // design, document, code, media, etc.
  status: TaskStatus;
  milestone_id?: string;
  phase_id?: string;
  assigned_to_id: string;
  due_date: Date;
  completion_date?: Date;
  file_references: string[]; // Storage file IDs
  approval_status: ApprovalStatus;
  reviewer_id?: string;
  reviewed_date?: Date;
  version: number;
  previous_versions: DeliverableVersion[];
  acceptance_criteria: string[];
  completion_percentage: number;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface DeliverableVersion {
  version: number;
  file_id: string;
  created_by: string;
  created_at: Date;
  change_summary: string;
}

export enum ApprovalStatus {
  PENDING = "pending",
  IN_REVIEW = "in_review",
  APPROVED = "approved",
  REJECTED = "rejected",
  REVISION_REQUESTED = "revision_requested",
}

export interface ProjectRisk {
  id: string;
  project_id: string;
  title: string;
  description: string;
  category: string; // technical, resource, schedule, budget, client, external
  probability: number; // 0-1
  impact: RiskLevel;
  overall_level: RiskLevel; // Derived from probability and impact
  status: RiskStatus;
  mitigation_plan: string;
  owner_id: string;
  identified_date: Date;
  target_resolution_date?: Date;
  resolved_date?: Date;
  tags: string[];
}

export interface ProjectIssue {
  id: string;
  project_id: string;
  title: string;
  description: string;
  category: string; // blocker, defect, enhancement, dependency
  severity: TaskPriority;
  status: TaskStatus;
  reported_by_id: string;
  assigned_to_id?: string;
  created_date: Date;
  resolved_date?: Date;
  resolution: string;
  related_tasks: string[];
  related_risks: string[];
  tags: string[];
}

export interface ResourceCapacity {
  id: string;
  organization_id: string;
  user_id: string;
  week_starting: Date;
  total_available_hours: number;
  allocated_hours: number;
  available_hours: number; // Calculated
  utilization_percentage: number; // Calculated
  allocations: ResourceAllocation[];
}

export interface ResourceAllocation {
  project_id: string;
  task_id?: string;
  hours_allocated: number;
  role: ResourceRole;
}

export interface ProjectTimeline {
  id: string;
  project_id: string;
  baseline_start: Date;
  baseline_end: Date;
  current_start: Date;
  current_end: Date;
  actual_start?: Date;
  actual_end?: Date;
  critical_path: string[]; // Task IDs
  variance_days: number;
  completion_percentage: number;
  health_status: "on_track" | "at_risk" | "off_track";
  last_updated: Date;
}

export interface ProjectBudget {
  id: string;
  project_id: string;
  total_budget: number;
  contingency_percentage: number;
  contingency_amount: number;
  available_budget: number;
  costs: BudgetCost[];
  invoices: BudgetInvoice[];
  spent: number;
  remaining: number;
  burn_rate: number; // $ per day
  projected_overrun: number;
  last_updated: Date;
}

export interface BudgetCost {
  id: string;
  budget_id: string;
  category: string; // labor, software, hardware, travel, subcontractor
  description: string;
  planned_cost: number;
  actual_cost: number;
  start_date: Date;
  invoice_id?: string;
}

export interface BudgetInvoice {
  invoice_id: string;
  amount: number;
  date: Date;
  status: string;
}

// Constants
export const PROJECT_STATUSES = [
  ProjectStatus.PLANNING,
  ProjectStatus.KICKOFF,
  ProjectStatus.IN_PROGRESS,
  ProjectStatus.ON_HOLD,
  ProjectStatus.IN_REVIEW,
  ProjectStatus.COMPLETED,
  ProjectStatus.CANCELLED,
];

export const TASK_STATUSES = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW,
  TaskStatus.BLOCKED,
  TaskStatus.COMPLETED,
  TaskStatus.CANCELLED,
];

export const MILESTONE_STATUSES = [
  MilestoneStatus.NOT_STARTED,
  MilestoneStatus.IN_PROGRESS,
  MilestoneStatus.AT_RISK,
  MilestoneStatus.ON_TRACK,
  MilestoneStatus.COMPLETED,
  MilestoneStatus.MISSED,
];

export const RESOURCE_ROLES = [
  ResourceRole.PROJECT_MANAGER,
  ResourceRole.DESIGNER,
  ResourceRole.DEVELOPER,
  ResourceRole.QA_ENGINEER,
  ResourceRole.CONTENT_SPECIALIST,
  ResourceRole.ACCOUNT_MANAGER,
  ResourceRole.BUSINESS_ANALYST,
  ResourceRole.LEAD,
  ResourceRole.CONTRIBUTOR,
];

export const RISK_LEVELS = [
  RiskLevel.LOW,
  RiskLevel.MEDIUM,
  RiskLevel.HIGH,
  RiskLevel.CRITICAL,
];

export const PHASE_TYPES = [
  ProjectPhaseType.DISCOVERY,
  ProjectPhaseType.DESIGN,
  ProjectPhaseType.DEVELOPMENT,
  ProjectPhaseType.QA_TESTING,
  ProjectPhaseType.DEPLOYMENT,
  ProjectPhaseType.MAINTENANCE,
  ProjectPhaseType.CUSTOM,
];
