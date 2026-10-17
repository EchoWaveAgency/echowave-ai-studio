import { describe, it, expect, beforeEach } from "vitest";
import { ProjectService } from "../../domains/delivery/services/ProjectService";
import { ResourceService } from "../../domains/delivery/services/ResourceService";
import { DeliverableService } from "../../domains/delivery/services/DeliverableService";
import { RiskService } from "../../domains/delivery/services/RiskService";
import {
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  MilestoneStatus,
  ResourceRole,
  ApprovalStatus,
  RiskLevel,
  RiskStatus,
  ProjectPhaseType,
} from "../../domains/delivery/models/index";

describe("Phase 14: Delivery & Project Management", () => {
  const organizationId = "org_test_14";
  const userId = "user_test_14";
  let projectService: ProjectService;
  let resourceService: ResourceService;
  let deliverableService: DeliverableService;
  let riskService: RiskService;

  beforeEach(() => {
    projectService = new ProjectService();
    resourceService = new ResourceService();
    deliverableService = new DeliverableService();
    riskService = new RiskService();
  });

  describe("ProjectService - Project Management", () => {
    it("should create a project with required fields", () => {
      const project = projectService.createProject(
        organizationId,
        {
          name: "Website Redesign",
          description: "Complete website redesign project",
          clientId: "client_123",
          projectManagerId: "pm_456",
          startDate: new Date("2026-10-17"),
          endDate: new Date("2026-12-17"),
          budget: 50000,
        },
        userId
      );

      expect(project).toBeDefined();
      expect(project.id).toMatch(/^proj_/);
      expect(project.name).toBe("Website Redesign");
      expect(project.status).toBe(ProjectStatus.PLANNING);
      expect(project.completion_percentage).toBe(0);
    });

    it("should require name, clientId, and projectManagerId", () => {
      expect(() => {
        projectService.createProject(
          organizationId,
          {
            name: "",
            description: "Test",
            clientId: "client_123",
            projectManagerId: "pm_456",
            startDate: new Date(),
            endDate: new Date(),
          },
          userId
        );
      }).toThrow("name, clientId, and projectManagerId are required");
    });

    it("should retrieve project by ID with organization isolation", () => {
      const project = projectService.createProject(
        organizationId,
        {
          name: "Test Project",
          description: "",
          clientId: "client_123",
          projectManagerId: "pm_456",
          startDate: new Date(),
          endDate: new Date(),
        },
        userId
      );

      const retrieved = projectService.getProjectById(organizationId, project.id);
      expect(retrieved).toEqual(project);
    });

    it("should throw error for wrong organization ID", () => {
      const project = projectService.createProject(
        organizationId,
        {
          name: "Test Project",
          description: "",
          clientId: "client_123",
          projectManagerId: "pm_456",
          startDate: new Date(),
          endDate: new Date(),
        },
        userId
      );

      expect(() => {
        projectService.getProjectById("wrong_org_id", project.id);
      }).toThrow("Project not found");
    });

    it("should get organization projects with filters", () => {
      projectService.createProject(
        organizationId,
        {
          name: "Project 1",
          description: "",
          clientId: "client_123",
          projectManagerId: "pm_456",
          startDate: new Date(),
          endDate: new Date(),
        },
        userId
      );

      projectService.createProject(
        organizationId,
        {
          name: "Project 2",
          description: "",
          clientId: "client_123",
          projectManagerId: "pm_456",
          startDate: new Date(),
          endDate: new Date(),
        },
        userId
      );

      const projects = projectService.getOrganizationProjects(organizationId);
      expect(projects.length).toBe(2);
    });

    it("should update project status", () => {
      const project = projectService.createProject(
        organizationId,
        {
          name: "Test Project",
          description: "",
          clientId: "client_123",
          projectManagerId: "pm_456",
          startDate: new Date(),
          endDate: new Date(),
        },
        userId
      );

      const updated = projectService.updateProjectStatus(
        organizationId,
        project.id,
        ProjectStatus.IN_PROGRESS,
        userId
      );

      expect(updated.status).toBe(ProjectStatus.IN_PROGRESS);
      expect(updated.updated_at).toBeDefined();
    });

    it("should add a project phase", () => {
      const project = projectService.createProject(
        organizationId,
        {
          name: "Test Project",
          description: "",
          clientId: "client_123",
          projectManagerId: "pm_456",
          startDate: new Date("2026-10-17"),
          endDate: new Date("2026-12-17"),
        },
        userId
      );

      const phase = projectService.addPhase(
        organizationId,
        project.id,
        {
          name: "Discovery",
          type: ProjectPhaseType.DISCOVERY,
          description: "Requirements and discovery phase",
          startDate: new Date("2026-10-17"),
          endDate: new Date("2026-10-31"),
          sequence: 1,
        }
      );

      expect(phase).toBeDefined();
      expect(phase.name).toBe("Discovery");
      expect(phase.type).toBe(ProjectPhaseType.DISCOVERY);
      expect(phase.duration_days).toBe(14);
    });

    it("should add a milestone to project", () => {
      const project = projectService.createProject(
        organizationId,
        {
          name: "Test Project",
          description: "",
          clientId: "client_123",
          projectManagerId: "pm_456",
          startDate: new Date(),
          endDate: new Date(),
        },
        userId
      );

      const phase = projectService.addPhase(
        organizationId,
        project.id,
        {
          name: "Phase 1",
          type: ProjectPhaseType.DISCOVERY,
          description: "",
          startDate: new Date(),
          endDate: new Date(),
          sequence: 1,
        }
      );

      const milestone = projectService.addMilestone(
        organizationId,
        project.id,
        {
          name: "Requirements Review",
          description: "Complete requirements review",
          targetDate: new Date("2026-10-25"),
          phaseId: phase.id,
          assignedToId: "user_123",
        }
      );

      expect(milestone).toBeDefined();
      expect(milestone.status).toBe(MilestoneStatus.NOT_STARTED);
      expect(milestone.name).toBe("Requirements Review");
    });

    it("should add a task to project", () => {
      const project = projectService.createProject(
        organizationId,
        {
          name: "Test Project",
          description: "",
          clientId: "client_123",
          projectManagerId: "pm_456",
          startDate: new Date(),
          endDate: new Date(),
        },
        userId
      );

      const task = projectService.addTask(
        organizationId,
        project.id,
        {
          title: "Design mockups",
          description: "Create initial mockups",
          assignedToId: "designer_123",
          estimatedHours: 16,
          startDate: new Date("2026-10-20"),
          dueDate: new Date("2026-10-22"),
          priority: TaskPriority.HIGH,
        },
        userId
      );

      expect(task).toBeDefined();
      expect(task.status).toBe(TaskStatus.TODO);
      expect(task.priority).toBe(TaskPriority.HIGH);
      expect(task.estimated_hours).toBe(16);
    });

    it("should update task status", () => {
      const project = projectService.createProject(
        organizationId,
        {
          name: "Test Project",
          description: "",
          clientId: "client_123",
          projectManagerId: "pm_456",
          startDate: new Date(),
          endDate: new Date(),
        },
        userId
      );

      const task = projectService.addTask(
        organizationId,
        project.id,
        {
          title: "Test Task",
          description: "",
          assignedToId: "user_123",
          estimatedHours: 8,
          startDate: new Date(),
          dueDate: new Date(),
        },
        userId
      );

      const updated = projectService.updateTaskStatus(
        organizationId,
        project.id,
        task.id,
        TaskStatus.IN_PROGRESS,
        userId
      );

      expect(updated.status).toBe(TaskStatus.IN_PROGRESS);
      expect(updated.completion_percentage).toBeGreaterThan(0);
    });

    it("should log task hours and update completion", () => {
      const project = projectService.createProject(
        organizationId,
        {
          name: "Test Project",
          description: "",
          clientId: "client_123",
          projectManagerId: "pm_456",
          startDate: new Date(),
          endDate: new Date(),
        },
        userId
      );

      const task = projectService.addTask(
        organizationId,
        project.id,
        {
          title: "Test Task",
          description: "",
          assignedToId: "user_123",
          estimatedHours: 8,
          startDate: new Date(),
          dueDate: new Date(),
        },
        userId
      );

      const updated = projectService.logTaskHours(
        organizationId,
        project.id,
        task.id,
        4,
        userId
      );

      expect(updated.actual_hours).toBe(4);
      expect(updated.completion_percentage).toBe(50);
    });

    it("should add team member to project", () => {
      const project = projectService.createProject(
        organizationId,
        {
          name: "Test Project",
          description: "",
          clientId: "client_123",
          projectManagerId: "pm_456",
          startDate: new Date(),
          endDate: new Date(),
        },
        userId
      );

      const member = projectService.addTeamMember(
        organizationId,
        project.id,
        {
          userId: "user_123",
          name: "John Designer",
          role: ResourceRole.DESIGNER,
          capacityPercentage: 100,
          skills: ["UI Design", "Figma"],
          startDate: new Date(),
        }
      );

      expect(member).toBeDefined();
      expect(member.role).toBe(ResourceRole.DESIGNER);
      expect(member.capacity_percentage).toBe(100);
    });

    it("should update milestone status", () => {
      const project = projectService.createProject(
        organizationId,
        {
          name: "Test Project",
          description: "",
          clientId: "client_123",
          projectManagerId: "pm_456",
          startDate: new Date(),
          endDate: new Date(),
        },
        userId
      );

      const phase = projectService.addPhase(
        organizationId,
        project.id,
        {
          name: "Phase 1",
          type: ProjectPhaseType.DISCOVERY,
          description: "",
          startDate: new Date(),
          endDate: new Date(),
          sequence: 1,
        }
      );

      const milestone = projectService.addMilestone(
        organizationId,
        project.id,
        {
          name: "Review",
          description: "",
          targetDate: new Date(),
          phaseId: phase.id,
        }
      );

      const updated = projectService.updateMilestoneStatus(
        organizationId,
        project.id,
        milestone.id,
        MilestoneStatus.COMPLETED
      );

      expect(updated.status).toBe(MilestoneStatus.COMPLETED);
      expect(updated.completion_date).toBeDefined();
    });

    it("should calculate project health status", () => {
      const project = projectService.createProject(
        organizationId,
        {
          name: "Test Project",
          description: "",
          clientId: "client_123",
          projectManagerId: "pm_456",
          startDate: new Date(),
          endDate: new Date(),
        },
        userId
      );

      projectService.addTask(
        organizationId,
        project.id,
        {
          title: "Task 1",
          description: "",
          assignedToId: "user_123",
          estimatedHours: 8,
          startDate: new Date(),
          dueDate: new Date(),
        },
        userId
      );

      const health = projectService.getProjectHealth(organizationId, project.id);
      expect(health.status).toBeDefined();
      expect(health.completionPercentage).toBeDefined();
      expect(health.timelineVariance).toBeDefined();
    });

    it("should get project tasks by status", () => {
      const project = projectService.createProject(
        organizationId,
        {
          name: "Test Project",
          description: "",
          clientId: "client_123",
          projectManagerId: "pm_456",
          startDate: new Date(),
          endDate: new Date(),
        },
        userId
      );

      projectService.addTask(
        organizationId,
        project.id,
        {
          title: "Task 1",
          description: "",
          assignedToId: "user_123",
          estimatedHours: 8,
          startDate: new Date(),
          dueDate: new Date(),
        },
        userId
      );

      const todoTasks = projectService.getProjectTasksByStatus(
        organizationId,
        project.id,
        TaskStatus.TODO
      );

      expect(todoTasks.length).toBe(1);
    });

    it("should get critical path tasks", () => {
      const project = projectService.createProject(
        organizationId,
        {
          name: "Test Project",
          description: "",
          clientId: "client_123",
          projectManagerId: "pm_456",
          startDate: new Date(),
          endDate: new Date(),
        },
        userId
      );

      projectService.addTask(
        organizationId,
        project.id,
        {
          title: "Critical Task",
          description: "",
          assignedToId: "user_123",
          estimatedHours: 8,
          startDate: new Date(),
          dueDate: new Date(),
          priority: TaskPriority.CRITICAL,
        },
        userId
      );

      const criticalPath = projectService.getCriticalPath(organizationId, project.id);
      expect(criticalPath.length).toBeGreaterThan(0);
      expect(criticalPath[0].priority).toBe(TaskPriority.CRITICAL);
    });

    it("should delete a project", () => {
      const project = projectService.createProject(
        organizationId,
        {
          name: "Test Project",
          description: "",
          clientId: "client_123",
          projectManagerId: "pm_456",
          startDate: new Date(),
          endDate: new Date(),
        },
        userId
      );

      projectService.deleteProject(organizationId, project.id);

      expect(() => {
        projectService.getProjectById(organizationId, project.id);
      }).toThrow("Project not found");
    });
  });

  describe("ResourceService - Team Capacity Management", () => {
    it("should create resource capacity", () => {
      const weekStarting = new Date("2026-10-17");
      const capacity = resourceService.createCapacity(
        organizationId,
        "user_123",
        weekStarting,
        40
      );

      expect(capacity).toBeDefined();
      expect(capacity.total_available_hours).toBe(40);
      expect(capacity.allocated_hours).toBe(0);
      expect(capacity.utilization_percentage).toBe(0);
    });

    it("should allocate hours to project", () => {
      const capacity = resourceService.createCapacity(
        organizationId,
        "user_123",
        new Date("2026-10-17"),
        40
      );

      const updated = resourceService.allocateHours(
        organizationId,
        capacity.id,
        "proj_123",
        "task_123",
        16,
        ResourceRole.DEVELOPER
      );

      expect(updated.allocated_hours).toBe(16);
      expect(updated.available_hours).toBe(24);
      expect(updated.utilization_percentage).toBe(40);
    });

    it("should prevent over-allocation", () => {
      const capacity = resourceService.createCapacity(
        organizationId,
        "user_123",
        new Date("2026-10-17"),
        40
      );

      expect(() => {
        resourceService.allocateHours(
          organizationId,
          capacity.id,
          "proj_123",
          "task_123",
          50,
          ResourceRole.DEVELOPER
        );
      }).toThrow("Cannot allocate");
    });

    it("should remove allocation", () => {
      const capacity = resourceService.createCapacity(
        organizationId,
        "user_123",
        new Date("2026-10-17"),
        40
      );

      resourceService.allocateHours(
        organizationId,
        capacity.id,
        "proj_123",
        "task_123",
        16,
        ResourceRole.DEVELOPER
      );

      const updated = resourceService.removeAllocation(
        organizationId,
        capacity.id,
        "proj_123",
        "task_123"
      );

      expect(updated.allocated_hours).toBe(0);
      expect(updated.available_hours).toBe(40);
    });

    it("should get organization utilization", () => {
      const weekStarting = new Date("2026-10-17");
      const capacity1 = resourceService.createCapacity(organizationId, "user_1", weekStarting, 40);
      const capacity2 = resourceService.createCapacity(organizationId, "user_2", weekStarting, 40);

      resourceService.allocateHours(
        organizationId,
        capacity1.id,
        "proj_123",
        "task_123",
        20,
        ResourceRole.DEVELOPER
      );

      const utilization = resourceService.getOrganizationUtilization(organizationId);
      expect(utilization.totalAvailableHours).toBe(80);
      expect(utilization.totalAllocatedHours).toBe(20);
      expect(utilization.averageUtilization).toBe(25);
    });

    it("should get available resources for period", () => {
      const startDate = new Date("2026-10-17");
      const endDate = new Date("2026-10-24");
      resourceService.createCapacity(organizationId, "user_123", startDate, 40);

      const available = resourceService.getAvailableResources(
        organizationId,
        startDate,
        endDate,
        0
      );

      expect(available.length).toBeGreaterThan(0);
      expect(available[0].userId).toBe("user_123");
    });

    it("should get team capacity summary", () => {
      const weekStarting = new Date("2026-10-17");
      const capacity1 = resourceService.createCapacity(organizationId, "user_1", weekStarting, 40);
      const capacity2 = resourceService.createCapacity(organizationId, "user_2", weekStarting, 40);

      resourceService.allocateHours(
        organizationId,
        capacity1.id,
        "proj_123",
        "task_123",
        20,
        ResourceRole.DEVELOPER
      );

      const summary = resourceService.getTeamCapacitySummary(
        organizationId,
        ["user_1", "user_2"],
        weekStarting
      );

      expect(summary.teamAvailableHours).toBe(80);
      expect(summary.teamAllocatedHours).toBe(20);
      expect(summary.members.length).toBe(2);
    });
  });

  describe("DeliverableService - Deliverable Management", () => {
    it("should create deliverable", () => {
      const deliverable = deliverableService.createDeliverable(
        organizationId,
        "proj_123",
        {
          name: "Design Mockups",
          description: "High-fidelity mockups",
          type: "design",
          assignedToId: "designer_123",
          dueDate: new Date("2026-10-25"),
          acceptanceCriteria: ["All screens designed", "Color palette approved"],
        },
        userId
      );

      expect(deliverable).toBeDefined();
      expect(deliverable.name).toBe("Design Mockups");
      expect(deliverable.status).toBe(TaskStatus.TODO);
      expect(deliverable.approval_status).toBe(ApprovalStatus.PENDING);
    });

    it("should require name, type, and assignedToId", () => {
      expect(() => {
        deliverableService.createDeliverable(
          organizationId,
          "proj_123",
          {
            name: "",
            description: "",
            type: "design",
            assignedToId: "user_123",
            dueDate: new Date(),
          },
          userId
        );
      }).toThrow("name, type, and assignedToId are required");
    });

    it("should get deliverable by ID", () => {
      const deliverable = deliverableService.createDeliverable(
        organizationId,
        "proj_123",
        {
          name: "Mockups",
          description: "",
          type: "design",
          assignedToId: "designer_123",
          dueDate: new Date(),
        },
        userId
      );

      const retrieved = deliverableService.getDeliverableById(organizationId, deliverable.id);
      expect(retrieved).toEqual(deliverable);
    });

    it("should get project deliverables", () => {
      deliverableService.createDeliverable(
        organizationId,
        "proj_123",
        {
          name: "Deliverable 1",
          description: "",
          type: "design",
          assignedToId: "user_123",
          dueDate: new Date(),
        },
        userId
      );

      deliverableService.createDeliverable(
        organizationId,
        "proj_123",
        {
          name: "Deliverable 2",
          description: "",
          type: "document",
          assignedToId: "user_123",
          dueDate: new Date(),
        },
        userId
      );

      const deliverables = deliverableService.getProjectDeliverables(organizationId, "proj_123");
      expect(deliverables.length).toBe(2);
    });

    it("should update deliverable status", () => {
      const deliverable = deliverableService.createDeliverable(
        organizationId,
        "proj_123",
        {
          name: "Mockups",
          description: "",
          type: "design",
          assignedToId: "designer_123",
          dueDate: new Date(),
        },
        userId
      );

      const updated = deliverableService.updateDeliverableStatus(
        organizationId,
        deliverable.id,
        TaskStatus.IN_PROGRESS,
        userId
      );

      expect(updated.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it("should submit deliverable for approval", () => {
      const deliverable = deliverableService.createDeliverable(
        organizationId,
        "proj_123",
        {
          name: "Mockups",
          description: "",
          type: "design",
          assignedToId: "designer_123",
          dueDate: new Date(),
        },
        userId
      );

      deliverableService.updateDeliverableStatus(
        organizationId,
        deliverable.id,
        TaskStatus.IN_PROGRESS,
        userId
      );

      const submitted = deliverableService.submitForApproval(
        organizationId,
        deliverable.id,
        userId
      );

      expect(submitted.approval_status).toBe(ApprovalStatus.IN_REVIEW);
      expect(submitted.status).toBe(TaskStatus.IN_REVIEW);
    });

    it("should approve deliverable", () => {
      const deliverable = deliverableService.createDeliverable(
        organizationId,
        "proj_123",
        {
          name: "Mockups",
          description: "",
          type: "design",
          assignedToId: "designer_123",
          dueDate: new Date(),
        },
        userId
      );

      deliverableService.updateDeliverableStatus(
        organizationId,
        deliverable.id,
        TaskStatus.IN_PROGRESS,
        userId
      );

      deliverableService.submitForApproval(organizationId, deliverable.id, userId);

      const approved = deliverableService.approveDeliverable(
        organizationId,
        deliverable.id,
        "reviewer_123"
      );

      expect(approved.approval_status).toBe(ApprovalStatus.APPROVED);
      expect(approved.status).toBe(TaskStatus.COMPLETED);
      expect(approved.reviewer_id).toBe("reviewer_123");
    });

    it("should reject deliverable and request revision", () => {
      const deliverable = deliverableService.createDeliverable(
        organizationId,
        "proj_123",
        {
          name: "Mockups",
          description: "",
          type: "design",
          assignedToId: "designer_123",
          dueDate: new Date(),
        },
        userId
      );

      deliverableService.updateDeliverableStatus(
        organizationId,
        deliverable.id,
        TaskStatus.IN_PROGRESS,
        userId
      );

      deliverableService.submitForApproval(organizationId, deliverable.id, userId);

      const rejected = deliverableService.rejectDeliverable(
        organizationId,
        deliverable.id,
        "reviewer_123",
        "Colors need revision"
      );

      expect(rejected.approval_status).toBe(ApprovalStatus.REVISION_REQUESTED);
      expect(rejected.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it("should create new version of deliverable", () => {
      const deliverable = deliverableService.createDeliverable(
        organizationId,
        "proj_123",
        {
          name: "Mockups",
          description: "",
          type: "design",
          assignedToId: "designer_123",
          dueDate: new Date(),
        },
        userId
      );

      const versioned = deliverableService.createNewVersion(
        organizationId,
        deliverable.id,
        "file_v2_id",
        "Updated colors and layout",
        userId
      );

      expect(versioned.version).toBe(2);
      expect(versioned.previous_versions.length).toBe(1);
      expect(versioned.approval_status).toBe(ApprovalStatus.PENDING);
    });

    it("should get deliverable history", () => {
      const deliverable = deliverableService.createDeliverable(
        organizationId,
        "proj_123",
        {
          name: "Mockups",
          description: "",
          type: "design",
          assignedToId: "designer_123",
          dueDate: new Date(),
        },
        userId
      );

      deliverableService.createNewVersion(
        organizationId,
        deliverable.id,
        "file_v2_id",
        "Version 2 changes",
        userId
      );

      const history = deliverableService.getDeliverableHistory(organizationId, deliverable.id);
      expect(history.length).toBe(2);
      expect(history[1].version).toBe(2);
    });

    it("should check acceptance criteria", () => {
      const deliverable = deliverableService.createDeliverable(
        organizationId,
        "proj_123",
        {
          name: "Mockups",
          description: "",
          type: "design",
          assignedToId: "designer_123",
          dueDate: new Date(),
          acceptanceCriteria: ["Criterion 1", "Criterion 2"],
        },
        userId
      );

      const criteria = deliverableService.checkAcceptanceCriteria(
        organizationId,
        deliverable.id
      );

      expect(criteria.totalCriteria).toBe(2);
      expect(criteria.percentage).toBeLessThanOrEqual(100);
    });

    it("should add file reference", () => {
      const deliverable = deliverableService.createDeliverable(
        organizationId,
        "proj_123",
        {
          name: "Mockups",
          description: "",
          type: "design",
          assignedToId: "designer_123",
          dueDate: new Date(),
        },
        userId
      );

      const updated = deliverableService.addFileReference(
        organizationId,
        deliverable.id,
        "file_123"
      );

      expect(updated.file_references).toContain("file_123");
    });

    it("should get pending approvals", () => {
      const deliverable = deliverableService.createDeliverable(
        organizationId,
        "proj_123",
        {
          name: "Mockups",
          description: "",
          type: "design",
          assignedToId: "designer_123",
          dueDate: new Date(),
        },
        userId
      );

      deliverableService.updateDeliverableStatus(
        organizationId,
        deliverable.id,
        TaskStatus.IN_PROGRESS,
        userId
      );

      deliverableService.submitForApproval(organizationId, deliverable.id, userId);

      const pending = deliverableService.getPendingApprovals(organizationId);
      expect(pending.length).toBeGreaterThan(0);
    });

    it("should delete deliverable", () => {
      const deliverable = deliverableService.createDeliverable(
        organizationId,
        "proj_123",
        {
          name: "Mockups",
          description: "",
          type: "design",
          assignedToId: "designer_123",
          dueDate: new Date(),
        },
        userId
      );

      deliverableService.deleteDeliverable(organizationId, deliverable.id);

      expect(() => {
        deliverableService.getDeliverableById(organizationId, deliverable.id);
      }).toThrow("Deliverable not found");
    });
  });

  describe("RiskService - Risk and Issue Management", () => {
    it("should create project risk", () => {
      const risk = riskService.createRisk(
        organizationId,
        "proj_123",
        {
          title: "Resource shortage",
          description: "Insufficient designer availability",
          category: "resource",
          probability: 0.6,
          impact: RiskLevel.HIGH,
          mitigationPlan: "Hire additional contractors",
          ownerId: "pm_123",
        }
      );

      expect(risk).toBeDefined();
      expect(risk.title).toBe("Resource shortage");
      expect(risk.overall_level).toBeDefined();
      expect(risk.status).toBe(RiskStatus.IDENTIFIED);
    });

    it("should validate probability range", () => {
      expect(() => {
        riskService.createRisk(
          organizationId,
          "proj_123",
          {
            title: "Test Risk",
            description: "",
            category: "",
            probability: 1.5,
            impact: RiskLevel.HIGH,
            mitigationPlan: "",
            ownerId: "pm_123",
          }
        );
      }).toThrow("probability must be 0-1");
    });

    it("should get risk by ID", () => {
      const risk = riskService.createRisk(
        organizationId,
        "proj_123",
        {
          title: "Test Risk",
          description: "",
          category: "",
          probability: 0.5,
          impact: RiskLevel.MEDIUM,
          mitigationPlan: "",
          ownerId: "pm_123",
        }
      );

      const retrieved = riskService.getRiskById(organizationId, risk.id);
      expect(retrieved).toEqual(risk);
    });

    it("should get project risks with filters", () => {
      riskService.createRisk(
        organizationId,
        "proj_123",
        {
          title: "Risk 1",
          description: "",
          category: "technical",
          probability: 0.3,
          impact: RiskLevel.LOW,
          mitigationPlan: "",
          ownerId: "pm_123",
        }
      );

      riskService.createRisk(
        organizationId,
        "proj_123",
        {
          title: "Risk 2",
          description: "",
          category: "schedule",
          probability: 0.7,
          impact: RiskLevel.HIGH,
          mitigationPlan: "",
          ownerId: "pm_123",
        }
      );

      const risks = riskService.getProjectRisks(organizationId, "proj_123");
      expect(risks.length).toBe(2);
    });

    it("should update risk status", () => {
      const risk = riskService.createRisk(
        organizationId,
        "proj_123",
        {
          title: "Test Risk",
          description: "",
          category: "",
          probability: 0.5,
          impact: RiskLevel.MEDIUM,
          mitigationPlan: "",
          ownerId: "pm_123",
        }
      );

      const updated = riskService.updateRiskStatus(
        organizationId,
        risk.id,
        RiskStatus.MITIGATED
      );

      expect(updated.status).toBe(RiskStatus.MITIGATED);
    });

    it("should update risk mitigation plan", () => {
      const risk = riskService.createRisk(
        organizationId,
        "proj_123",
        {
          title: "Test Risk",
          description: "",
          category: "",
          probability: 0.5,
          impact: RiskLevel.MEDIUM,
          mitigationPlan: "Initial plan",
          ownerId: "pm_123",
        }
      );

      const updated = riskService.updateMitigationPlan(
        organizationId,
        risk.id,
        "Updated mitigation plan"
      );

      expect(updated.mitigation_plan).toBe("Updated mitigation plan");
    });

    it("should create project issue", () => {
      const issue = riskService.createIssue(
        organizationId,
        "proj_123",
        {
          title: "Design approval delayed",
          description: "Client feedback not received",
          category: "blocker",
          severity: TaskPriority.HIGH,
          reportedById: "user_123",
          assignedToId: "pm_123",
        }
      );

      expect(issue).toBeDefined();
      expect(issue.title).toBe("Design approval delayed");
      expect(issue.status).toBe("todo");
    });

    it("should require title and reportedById for issue", () => {
      expect(() => {
        riskService.createIssue(
          organizationId,
          "proj_123",
          {
            title: "",
            description: "",
            category: "",
            severity: TaskPriority.MEDIUM,
            reportedById: "",
          }
        );
      }).toThrow("title and reportedById are required");
    });

    it("should get issue by ID", () => {
      const issue = riskService.createIssue(
        organizationId,
        "proj_123",
        {
          title: "Test Issue",
          description: "",
          category: "",
          severity: TaskPriority.MEDIUM,
          reportedById: "user_123",
        }
      );

      const retrieved = riskService.getIssueById(organizationId, issue.id);
      expect(retrieved).toEqual(issue);
    });

    it("should update issue status", () => {
      const issue = riskService.createIssue(
        organizationId,
        "proj_123",
        {
          title: "Test Issue",
          description: "",
          category: "",
          severity: TaskPriority.MEDIUM,
          reportedById: "user_123",
        }
      );

      const updated = riskService.updateIssueStatus(organizationId, issue.id, "in_progress");
      expect(updated.status).toBe("in_progress");
    });

    it("should resolve issue", () => {
      const issue = riskService.createIssue(
        organizationId,
        "proj_123",
        {
          title: "Test Issue",
          description: "",
          category: "",
          severity: TaskPriority.MEDIUM,
          reportedById: "user_123",
        }
      );

      const resolved = riskService.resolveIssue(
        organizationId,
        issue.id,
        "Issue fixed by updating design"
      );

      expect(resolved.status).toBe("completed");
      expect(resolved.resolution).toBe("Issue fixed by updating design");
      expect(resolved.resolved_date).toBeDefined();
    });

    it("should link issue to risk", () => {
      const risk = riskService.createRisk(
        organizationId,
        "proj_123",
        {
          title: "Test Risk",
          description: "",
          category: "",
          probability: 0.5,
          impact: RiskLevel.MEDIUM,
          mitigationPlan: "",
          ownerId: "pm_123",
        }
      );

      const issue = riskService.createIssue(
        organizationId,
        "proj_123",
        {
          title: "Test Issue",
          description: "",
          category: "",
          severity: TaskPriority.MEDIUM,
          reportedById: "user_123",
        }
      );

      const linked = riskService.linkIssueToRisk(organizationId, issue.id, risk.id);
      expect(linked.related_risks).toContain(risk.id);
    });

    it("should link issue to task", () => {
      const issue = riskService.createIssue(
        organizationId,
        "proj_123",
        {
          title: "Test Issue",
          description: "",
          category: "",
          severity: TaskPriority.MEDIUM,
          reportedById: "user_123",
        }
      );

      const linked = riskService.linkIssueToTask(organizationId, issue.id, "task_123");
      expect(linked.related_tasks).toContain("task_123");
    });

    it("should get project risk summary", () => {
      riskService.createRisk(
        organizationId,
        "proj_123",
        {
          title: "Critical Risk",
          description: "",
          category: "",
          probability: 0.9,
          impact: RiskLevel.CRITICAL,
          mitigationPlan: "",
          ownerId: "pm_123",
        }
      );

      riskService.createIssue(
        organizationId,
        "proj_123",
        {
          title: "Open Issue",
          description: "",
          category: "",
          severity: TaskPriority.HIGH,
          reportedById: "user_123",
        }
      );

      const summary = riskService.getProjectRiskSummary(organizationId, "proj_123");
      expect(summary.totalRisks).toBeGreaterThan(0);
      expect(summary.criticalRisks.length).toBeGreaterThan(0);
      expect(summary.openIssues.length).toBeGreaterThan(0);
    });
  });

  describe("Organization Isolation Tests", () => {
    it("should not leak projects between organizations", () => {
      const org1Id = "org_1";
      const org2Id = "org_2";

      const project1 = projectService.createProject(
        org1Id,
        {
          name: "Org1 Project",
          description: "",
          clientId: "client_123",
          projectManagerId: "pm_456",
          startDate: new Date(),
          endDate: new Date(),
        },
        userId
      );

      projectService.createProject(
        org2Id,
        {
          name: "Org2 Project",
          description: "",
          clientId: "client_123",
          projectManagerId: "pm_456",
          startDate: new Date(),
          endDate: new Date(),
        },
        userId
      );

      const org1Projects = projectService.getOrganizationProjects(org1Id);
      expect(org1Projects).toHaveLength(1);
      expect(org1Projects[0].name).toBe("Org1 Project");
    });

    it("should not leak deliverables between organizations", () => {
      const del1 = deliverableService.createDeliverable(
        "org_1",
        "proj_123",
        {
          name: "Org1 Deliverable",
          description: "",
          type: "design",
          assignedToId: "user_123",
          dueDate: new Date(),
        },
        userId
      );

      const del2 = deliverableService.createDeliverable(
        "org_2",
        "proj_123",
        {
          name: "Org2 Deliverable",
          description: "",
          type: "design",
          assignedToId: "user_123",
          dueDate: new Date(),
        },
        userId
      );

      const org1Deliverables = deliverableService.getProjectDeliverables("org_1", "proj_123");
      expect(org1Deliverables.length).toBe(1);
      expect(org1Deliverables[0].name).toBe("Org1 Deliverable");
    });
  });

  describe("Integration Scenarios", () => {
    it("should handle complete project workflow", () => {
      // Create project
      const project = projectService.createProject(
        organizationId,
        {
          name: "Full Workflow Project",
          description: "Testing complete workflow",
          clientId: "client_123",
          projectManagerId: "pm_456",
          startDate: new Date("2026-10-17"),
          endDate: new Date("2026-12-17"),
          budget: 100000,
        },
        userId
      );

      // Add phases
      const phase1 = projectService.addPhase(
        organizationId,
        project.id,
        {
          name: "Discovery",
          type: ProjectPhaseType.DISCOVERY,
          description: "Requirements gathering",
          startDate: new Date("2026-10-17"),
          endDate: new Date("2026-10-31"),
          sequence: 1,
        }
      );

      // Add milestone
      const milestone = projectService.addMilestone(
        organizationId,
        project.id,
        {
          name: "Requirements Complete",
          description: "All requirements reviewed",
          targetDate: new Date("2026-10-29"),
          phaseId: phase1.id,
          assignedToId: "ba_123",
        }
      );

      // Add team member
      projectService.addTeamMember(
        organizationId,
        project.id,
        {
          userId: "designer_123",
          name: "Jane Designer",
          role: ResourceRole.DESIGNER,
          capacityPercentage: 80,
          skills: ["UI/UX", "Figma"],
          startDate: new Date("2026-10-17"),
        }
      );

      // Add tasks
      const task = projectService.addTask(
        organizationId,
        project.id,
        {
          title: "Create wireframes",
          description: "Initial wireframes for all pages",
          assignedToId: "designer_123",
          estimatedHours: 32,
          startDate: new Date("2026-10-24"),
          dueDate: new Date("2026-10-29"),
          priority: TaskPriority.HIGH,
          milestoneId: milestone.id,
        },
        userId
      );

      // Add deliverable
      const deliverable = deliverableService.createDeliverable(
        organizationId,
        project.id,
        {
          name: "Wireframe Deliverable",
          description: "Clickable wireframes",
          type: "design",
          assignedToId: "designer_123",
          dueDate: new Date("2026-10-29"),
          milestoneId: milestone.id,
          acceptanceCriteria: ["All wireframes complete", "Review meeting passed"],
        },
        userId
      );

      // Update task status
      projectService.updateTaskStatus(
        organizationId,
        project.id,
        task.id,
        TaskStatus.IN_PROGRESS,
        userId
      );

      // Update deliverable status
      deliverableService.updateDeliverableStatus(
        organizationId,
        deliverable.id,
        TaskStatus.IN_PROGRESS,
        userId
      );

      // Check health
      const health = projectService.getProjectHealth(organizationId, project.id);
      expect(health.completionPercentage).toBeGreaterThan(0);

      // Verify structure
      expect(project.phases.length).toBe(1);
      expect(project.milestones.length).toBe(1);
      expect(project.team_members.length).toBe(1);
      expect(project.tasks.length).toBe(1);
      expect(project.deliverables.length).toBe(1);
    });

    it("should handle resource allocation workflow", () => {
      const weekStart = new Date("2026-10-17");

      // Create capacities
      const capacity1 = resourceService.createCapacity(organizationId, "dev_1", weekStart, 40);
      const capacity2 = resourceService.createCapacity(organizationId, "dev_2", weekStart, 40);

      // Allocate to projects
      resourceService.allocateHours(
        organizationId,
        capacity1.id,
        "proj_frontend",
        "task_api",
        20,
        ResourceRole.DEVELOPER
      );

      resourceService.allocateHours(
        organizationId,
        capacity1.id,
        "proj_backend",
        "task_db",
        16,
        ResourceRole.DEVELOPER
      );

      resourceService.allocateHours(
        organizationId,
        capacity2.id,
        "proj_qa",
        undefined,
        32,
        ResourceRole.QA_ENGINEER
      );

      // Check utilization
      const utilization = resourceService.getOrganizationUtilization(organizationId);
      expect(utilization.totalAllocatedHours).toBe(68);
      expect(utilization.averageUtilization).toBe(85);
    });

    it("should handle risk management workflow", () => {
      const projectId = "proj_risk_test";

      // Create risks
      const technicalRisk = riskService.createRisk(
        organizationId,
        projectId,
        {
          title: "API integration complexity",
          description: "Third-party API may be difficult to integrate",
          category: "technical",
          probability: 0.4,
          impact: RiskLevel.MEDIUM,
          mitigationPlan: "POC with API provider before full integration",
          ownerId: "tech_lead_123",
        }
      );

      const scheduleRisk = riskService.createRisk(
        organizationId,
        projectId,
        {
          title: "Timeline pressure",
          description: "Aggressive timeline with dependencies",
          category: "schedule",
          probability: 0.6,
          impact: RiskLevel.HIGH,
          mitigationPlan: "Add buffer time, prioritize critical path",
          ownerId: "pm_123",
        }
      );

      // Create issues
      const issue1 = riskService.createIssue(
        organizationId,
        projectId,
        {
          title: "Database performance",
          description: "Queries running slow on large datasets",
          category: "defect",
          severity: TaskPriority.HIGH,
          reportedById: "qa_123",
          assignedToId: "dev_lead_123",
        }
      );

      // Link issue to risk
      riskService.linkIssueToRisk(organizationId, issue1.id, technicalRisk.id);

      // Link issue to task
      riskService.linkIssueToTask(organizationId, issue1.id, "task_db_optimization");

      // Update risk status
      riskService.updateRiskStatus(organizationId, technicalRisk.id, RiskStatus.MONITORING);

      // Resolve issue
      riskService.resolveIssue(
        organizationId,
        issue1.id,
        "Optimized queries and added indexes"
      );

      // Get summary
      const summary = riskService.getProjectRiskSummary(organizationId, projectId);
      expect(summary.totalRisks).toBe(2);
      expect(summary.openIssues.length).toBe(0); // Issue resolved
    });
  });
});
