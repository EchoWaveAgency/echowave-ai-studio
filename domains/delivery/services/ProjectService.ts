import {
  Project,
  ProjectPhase,
  ProjectStatus,
  Milestone,
  MilestoneStatus,
  Task,
  TaskStatus,
  ProjectTeamMember,
  ResourceRole,
  ProjectPhaseType,
  TaskPriority,
} from "../models/index";

export class ProjectService {
  private projects = new Map<string, Project>();
  private projectIdCounter = 1;

  // Create Project
  createProject(
    organizationId: string,
    data: {
      name: string;
      description: string;
      clientId: string;
      projectManagerId: string;
      contractId?: string;
      startDate: Date;
      endDate: Date;
      budget?: number;
    },
    userId: string
  ): Project {
    if (!data.name || !data.clientId || !data.projectManagerId) {
      throw new Error("name, clientId, and projectManagerId are required");
    }

    const project: Project = {
      id: `proj_${organizationId}_${this.projectIdCounter++}`,
      organization_id: organizationId,
      contract_id: data.contractId,
      name: data.name,
      description: data.description,
      status: ProjectStatus.PLANNING,
      phases: [],
      start_date: data.startDate,
      end_date: data.endDate,
      budget: data.budget,
      budget_used: 0,
      client_id: data.clientId,
      project_manager_id: data.projectManagerId,
      team_members: [],
      milestones: [],
      tasks: [],
      deliverables: [],
      risks: [],
      issues: [],
      timeline_variance: 0,
      budget_variance: 0,
      completion_percentage: 0,
      created_by: userId,
      updated_by: userId,
      created_at: new Date(),
      updated_at: new Date(),
    };

    this.projects.set(project.id, project);
    return project;
  }

  // Get Project by ID
  getProjectById(organizationId: string, projectId: string): Project {
    const project = this.projects.get(projectId);
    if (!project || project.organization_id !== organizationId) {
      throw new Error("Project not found");
    }
    return project;
  }

  // Get Organization Projects
  getOrganizationProjects(organizationId: string, filters?: { status?: ProjectStatus; limit?: number; offset?: number }): Project[] {
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    let projects = Array.from(this.projects.values()).filter(
      (p) => p.organization_id === organizationId
    );

    if (filters?.status) {
      projects = projects.filter((p) => p.status === filters.status);
    }

    return projects.slice(offset, offset + limit);
  }

  // Update Project Status
  updateProjectStatus(organizationId: string, projectId: string, status: ProjectStatus, userId: string): Project {
    const project = this.getProjectById(organizationId, projectId);
    project.status = status;
    project.updated_by = userId;
    project.updated_at = new Date();
    return project;
  }

  // Add Project Phase
  addPhase(organizationId: string, projectId: string, phaseData: {
    name: string;
    type: ProjectPhaseType;
    description: string;
    startDate: Date;
    endDate: Date;
    sequence: number;
  }): ProjectPhase {
    const project = this.getProjectById(organizationId, projectId);

    const phase: ProjectPhase = {
      id: `phase_${projectId}_${project.phases.length + 1}`,
      project_id: projectId,
      name: phaseData.name,
      type: phaseData.type,
      description: phaseData.description,
      start_date: phaseData.startDate,
      end_date: phaseData.endDate,
      status: ProjectStatus.PLANNING,
      sequence: phaseData.sequence,
      duration_days: Math.ceil(
        (phaseData.endDate.getTime() - phaseData.startDate.getTime()) / (1000 * 60 * 60 * 24)
      ),
      completion_percentage: 0,
      dependencies: [],
      deliverables: [],
    };

    project.phases.push(phase);
    project.updated_at = new Date();
    return phase;
  }

  // Add Milestone
  addMilestone(organizationId: string, projectId: string, milestoneData: {
    name: string;
    description: string;
    targetDate: Date;
    phaseId: string;
    assignedToId?: string;
  }): Milestone {
    const project = this.getProjectById(organizationId, projectId);

    const milestone: Milestone = {
      id: `milestone_${projectId}_${project.milestones.length + 1}`,
      project_id: projectId,
      name: milestoneData.name,
      description: milestoneData.description,
      target_date: milestoneData.targetDate,
      status: MilestoneStatus.NOT_STARTED,
      phase_id: milestoneData.phaseId,
      assigned_to_id: milestoneData.assignedToId,
      deliverables: [],
      criteria: [],
      variance_days: 0,
    };

    project.milestones.push(milestone);
    project.updated_at = new Date();
    return milestone;
  }

  // Add Task
  addTask(organizationId: string, projectId: string, taskData: {
    title: string;
    description: string;
    assignedToId: string;
    estimatedHours: number;
    startDate: Date;
    dueDate: Date;
    priority?: TaskPriority;
    milestoneId?: string;
    parentTaskId?: string;
  }, userId: string): Task {
    const project = this.getProjectById(organizationId, projectId);

    const task: Task = {
      id: `task_${projectId}_${project.tasks.length + 1}`,
      project_id: projectId,
      milestone_id: taskData.milestoneId,
      parent_task_id: taskData.parentTaskId,
      title: taskData.title,
      description: taskData.description,
      status: TaskStatus.TODO,
      priority: taskData.priority || TaskPriority.MEDIUM,
      assigned_to_id: taskData.assignedToId,
      estimated_hours: taskData.estimatedHours,
      start_date: taskData.startDate,
      due_date: taskData.dueDate,
      dependencies: [],
      subtasks: [],
      acceptance_criteria: [],
      completion_percentage: 0,
      tags: [],
      created_by: userId,
      updated_by: userId,
      created_at: new Date(),
      updated_at: new Date(),
    };

    project.tasks.push(task);
    if (taskData.parentTaskId) {
      const parentTask = project.tasks.find((t) => t.id === taskData.parentTaskId);
      if (parentTask) {
        parentTask.subtasks.push(task);
      }
    }
    project.updated_at = new Date();
    return task;
  }

  // Update Task Status
  updateTaskStatus(organizationId: string, projectId: string, taskId: string, status: TaskStatus, userId: string): Task {
    const project = this.getProjectById(organizationId, projectId);
    const task = project.tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    task.status = status;
    if (status === TaskStatus.COMPLETED) {
      task.completion_date = new Date();
      task.completion_percentage = 100;
    } else if (status === TaskStatus.IN_PROGRESS) {
      task.completion_percentage = Math.min(50, task.completion_percentage || 25);
    }
    task.updated_by = userId;
    task.updated_at = new Date();
    return task;
  }

  // Log Task Hours
  logTaskHours(organizationId: string, projectId: string, taskId: string, hours: number, userId: string): Task {
    const project = this.getProjectById(organizationId, projectId);
    const task = project.tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    task.actual_hours = (task.actual_hours || 0) + hours;
    task.completion_percentage = Math.min(100, (task.actual_hours / task.estimated_hours) * 100);
    task.updated_by = userId;
    task.updated_at = new Date();
    return task;
  }

  // Add Team Member
  addTeamMember(organizationId: string, projectId: string, memberData: {
    userId: string;
    name: string;
    role: ResourceRole;
    capacityPercentage: number;
    skills: string[];
    startDate: Date;
    endDate?: Date;
  }): ProjectTeamMember {
    const project = this.getProjectById(organizationId, projectId);

    const allocatedHours = (memberData.capacityPercentage / 100) * 40 * 4; // Assuming 40hr/week, 4 weeks
    const member: ProjectTeamMember = {
      id: `member_${projectId}_${project.team_members.length + 1}`,
      project_id: projectId,
      user_id: memberData.userId,
      name: memberData.name,
      role: memberData.role,
      capacity_percentage: memberData.capacityPercentage,
      allocated_hours: allocatedHours,
      start_date: memberData.startDate,
      end_date: memberData.endDate,
      skills: memberData.skills,
      assignments: [],
    };

    project.team_members.push(member);
    project.updated_at = new Date();
    return member;
  }

  // Update Milestone Status
  updateMilestoneStatus(organizationId: string, projectId: string, milestoneId: string, status: MilestoneStatus): Milestone {
    const project = this.getProjectById(organizationId, projectId);
    const milestone = project.milestones.find((m) => m.id === milestoneId);
    if (!milestone) {
      throw new Error("Milestone not found");
    }

    milestone.status = status;
    if (status === MilestoneStatus.COMPLETED) {
      milestone.completion_date = new Date();
    }

    // Calculate variance
    const today = new Date();
    milestone.variance_days = Math.ceil(
      (today.getTime() - milestone.target_date.getTime()) / (1000 * 60 * 60 * 24)
    );

    project.updated_at = new Date();
    return milestone;
  }

  // Calculate Project Health
  getProjectHealth(organizationId: string, projectId: string): {
    status: "on_track" | "at_risk" | "off_track";
    completionPercentage: number;
    timelineVariance: number;
    budgetVariance: number;
  } {
    const project = this.getProjectById(organizationId, projectId);

    // Calculate completion from tasks
    const completedTasks = project.tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    const completionPercentage = project.tasks.length > 0 ? (completedTasks / project.tasks.length) * 100 : 0;

    // Calculate timeline variance
    const milestonesAtRisk = project.milestones.filter((m) => m.variance_days > 0).length;
    const timelineVariance = milestonesAtRisk > 0 ? -1 : 0; // Simple variance

    // Determine health status
    let status: "on_track" | "at_risk" | "off_track" = "on_track";
    if (timelineVariance < 0 && completionPercentage < 50) {
      status = "off_track";
    } else if (timelineVariance < 0 || completionPercentage < 70) {
      status = "at_risk";
    }

    return {
      status,
      completionPercentage,
      timelineVariance,
      budgetVariance: project.budget_variance,
    };
  }

  // Get Project Tasks by Status
  getProjectTasksByStatus(organizationId: string, projectId: string, status: TaskStatus): Task[] {
    const project = this.getProjectById(organizationId, projectId);
    return project.tasks.filter((t) => t.status === status);
  }

  // Delete Project
  deleteProject(organizationId: string, projectId: string): void {
    const project = this.getProjectById(organizationId, projectId);
    this.projects.delete(projectId);
  }

  // Get Critical Path
  getCriticalPath(organizationId: string, projectId: string): Task[] {
    const project = this.getProjectById(organizationId, projectId);
    // Simplified: return tasks with dependencies or highest priority
    return project.tasks
      .filter((t) => t.dependencies.length > 0 || t.priority === TaskPriority.CRITICAL)
      .sort((a, b) => b.due_date.getTime() - a.due_date.getTime());
  }
}
