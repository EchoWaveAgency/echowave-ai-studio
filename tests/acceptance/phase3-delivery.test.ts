import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { projectService } from '../../domains/delivery/services/ProjectService';
import { taskService } from '../../domains/delivery/services/TaskService';
import { deliverableService } from '../../domains/delivery/services/DeliverableService';

const testOrgId = 'org-test-123';
const testClientId = 'client-test-456';
const testUserId = 'user-test-789';

describe('Phase 3: Project Management', () => {
  let projectId: string;
  let taskId: string;
  let deliverableId: string;

  describe('Project Setup', () => {
    it('should create a new project', async () => {
      const project = await projectService.createProject(
        testOrgId,
        {
          clientId: testClientId,
          name: 'Web Redesign Project',
          description: 'Complete website redesign for client',
          startDate: '2026-10-20',
          targetEndDate: '2026-12-20',
          budget: 50000,
        },
        testUserId
      );

      expect(project.id).toBeDefined();
      expect(project.name).toBe('Web Redesign Project');
      expect(project.status).toBe('planning');
      expect(project.organizationId).toBe(testOrgId);
      projectId = project.id;
    });

    it('should validate required project fields', async () => {
      try {
        await projectService.createProject(testOrgId, {
          clientId: testClientId,
          name: '',
          description: 'Test',
          startDate: '2026-10-20',
          targetEndDate: '2026-12-20',
        }, testUserId);
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('name');
      }
    });

    it('should reject invalid date range', async () => {
      try {
        await projectService.createProject(testOrgId, {
          clientId: testClientId,
          name: 'Test Project',
          description: 'Test',
          startDate: '2026-12-20',
          targetEndDate: '2026-10-20',
        }, testUserId);
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('Start date');
      }
    });

    it('should retrieve project by ID with org isolation', async () => {
      const retrieved = await projectService.getProjectById(projectId, testOrgId);
      expect(retrieved.id).toBe(projectId);
      expect(retrieved.organizationId).toBe(testOrgId);
    });

    it('should list organization projects with pagination', async () => {
      const result = await projectService.getOrganizationProjects(testOrgId, {}, 50, 0);
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThanOrEqual(1);
    });

    it('should filter projects by status', async () => {
      const result = await projectService.getOrganizationProjects(testOrgId, {
        status: 'planning',
      }, 50, 0);
      expect(result.items.every(p => p.status === 'planning')).toBe(true);
    });

    it('should update project status to active', async () => {
      const updated = await projectService.updateProject(projectId, testOrgId, {
        status: 'active',
      }, testUserId);
      expect(updated.status).toBe('active');
    });

    it('should create project phases', async () => {
      const phase = await projectService.createPhase(projectId, testOrgId, {
        name: 'Discovery',
        sequenceOrder: 1,
        startDate: '2026-10-20',
        targetEndDate: '2026-11-03',
      });
      expect(phase.name).toBe('Discovery');
      expect(phase.status).toBe('pending');
    });

    it('should retrieve all project phases', async () => {
      const phases = await projectService.getProjectPhases(projectId, testOrgId);
      expect(phases.length).toBeGreaterThan(0);
      expect(phases[0].sequenceOrder).toBeDefined();
    });
  });

  describe('Task Management', () => {
    it('should create a task in project', async () => {
      const task = await taskService.createTask(
        testOrgId,
        {
          projectId,
          title: 'Design Homepage',
          description: 'Create responsive homepage design',
          priority: 'high',
          dueDate: '2026-11-03',
          estimatedHours: 16,
          assignedTo: 'designer-001',
        },
        testUserId
      );

      expect(task.id).toBeDefined();
      expect(task.title).toBe('Design Homepage');
      expect(task.status).toBe('todo');
      expect(task.priority).toBe('high');
      taskId = task.id;
    });

    it('should validate task priority values', async () => {
      try {
        await taskService.createTask(testOrgId, {
          projectId,
          title: 'Test Task',
          description: 'Test',
          priority: 'invalid-priority' as any,
        }, testUserId);
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('priority');
      }
    });

    it('should retrieve task by ID', async () => {
      const retrieved = await taskService.getTaskById(taskId, testOrgId);
      expect(retrieved.id).toBe(taskId);
      expect(retrieved.organizationId).toBe(testOrgId);
    });

    it('should list project tasks with pagination', async () => {
      const result = await taskService.getProjectTasks(projectId, testOrgId, {}, 50, 0);
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThanOrEqual(1);
    });

    it('should filter tasks by status', async () => {
      const result = await taskService.getProjectTasks(projectId, testOrgId, {
        status: 'todo',
      }, 50, 0);
      expect(result.items.every(t => t.status === 'todo')).toBe(true);
    });

    it('should filter tasks by priority', async () => {
      const result = await taskService.getProjectTasks(projectId, testOrgId, {
        priority: 'high',
      }, 50, 0);
      expect(result.items.every(t => t.priority === 'high')).toBe(true);
    });

    it('should update task status', async () => {
      const updated = await taskService.updateTask(taskId, testOrgId, {
        status: 'in_progress',
      }, testUserId);
      expect(updated.status).toBe('in_progress');
    });

    it('should update task assignment', async () => {
      const updated = await taskService.updateTask(taskId, testOrgId, {
        assignedTo: 'designer-002',
      }, testUserId);
      expect(updated.assignedTo).toBe('designer-002');
    });

    it('should add task dependency', async () => {
      const task2 = await taskService.createTask(testOrgId, {
        projectId,
        title: 'Development',
        description: 'Implement design',
        priority: 'high',
      }, testUserId);

      const dependency = await taskService.addDependency(task2.id, testOrgId, {
        dependsOnTaskId: taskId,
        blocking: true,
      });

      expect(dependency.taskId).toBe(task2.id);
      expect(dependency.dependsOnTaskId).toBe(taskId);
      expect(dependency.blocking).toBe(true);
    });

    it('should retrieve task dependencies', async () => {
      const task2 = await taskService.createTask(testOrgId, {
        projectId,
        title: 'Testing',
        description: 'Test implementation',
        priority: 'medium',
      }, testUserId);

      await taskService.addDependency(task2.id, testOrgId, {
        dependsOnTaskId: taskId,
        blocking: false,
      });

      const deps = await taskService.getTaskDependencies(task2.id);
      expect(deps.length).toBeGreaterThan(0);
    });
  });

  describe('Deliverable Management', () => {
    it('should create a deliverable', async () => {
      const deliverable = await deliverableService.createDeliverable(
        testOrgId,
        {
          projectId,
          name: 'Homepage Design Mockup',
          description: 'Figma mockups for responsive homepage',
          expectedDate: '2026-11-10',
          fileUrls: ['https://storage.example.com/mockup-v1.fig'],
        },
        testUserId
      );

      expect(deliverable.id).toBeDefined();
      expect(deliverable.name).toBe('Homepage Design Mockup');
      expect(deliverable.status).toBe('pending');
      deliverableId = deliverable.id;
    });

    it('should validate deliverable fields', async () => {
      try {
        await deliverableService.createDeliverable(testOrgId, {
          projectId,
          name: '',
          description: 'Test',
          expectedDate: '2026-11-10',
          fileUrls: [],
        }, testUserId);
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('name');
      }
    });

    it('should retrieve deliverable by ID', async () => {
      const retrieved = await deliverableService.getDeliverableById(
        deliverableId,
        testOrgId
      );
      expect(retrieved.id).toBe(deliverableId);
    });

    it('should list project deliverables', async () => {
      const result = await deliverableService.getProjectDeliverables(projectId, testOrgId, {}, 50, 0);
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThanOrEqual(1);
    });

    it('should filter deliverables by status', async () => {
      const result = await deliverableService.getProjectDeliverables(projectId, testOrgId, {
        status: 'pending',
      }, 50, 0);
      expect(result.items.every(d => d.status === 'pending')).toBe(true);
    });

    it('should update deliverable details', async () => {
      const updated = await deliverableService.updateDeliverable(
        deliverableId,
        testOrgId,
        {
          description: 'Updated mockups with revisions',
        },
        testUserId
      );
      expect(updated.description).toContain('revisions');
    });

    it('should approve deliverable', async () => {
      const approved = await deliverableService.approveDeliverable(
        deliverableId,
        testOrgId,
        'Design approved for development',
        testUserId
      );
      expect(approved.status).toBe('accepted');
      expect(approved.approvalNotes).toContain('approved');
    });

    it('should reject and re-deliver', async () => {
      const deliverable2 = await deliverableService.createDeliverable(
        testOrgId,
        {
          projectId,
          name: 'Sitemap Document',
          description: 'Information architecture',
          expectedDate: '2026-11-05',
          fileUrls: ['https://storage.example.com/sitemap.pdf'],
        },
        testUserId
      );

      const rejected = await deliverableService.rejectDeliverable(
        deliverable2.id,
        testOrgId,
        'Color palette needs revision',
        testUserId
      );
      expect(rejected.status).toBe('rejected');
    });

    it('should create file version for deliverable', async () => {
      const fileVersion = await deliverableService.createFileVersion(
        testOrgId,
        {
          deliverableId,
          filename: 'homepage-design-v2.fig',
          fileUrl: 'https://storage.example.com/homepage-v2.fig',
          fileSize: 5242880,
          fileHash: 'abc123def456',
        },
        testUserId
      );

      expect(fileVersion.versionNumber).toBe(1);
      expect(fileVersion.filename).toContain('v2');
    });

    it('should retrieve file versions for deliverable', async () => {
      await deliverableService.createFileVersion(testOrgId, {
        deliverableId,
        filename: 'homepage-design-v3.fig',
        fileUrl: 'https://storage.example.com/homepage-v3.fig',
        fileSize: 6291456,
        fileHash: 'xyz789uvw123',
      }, testUserId);

      const versions = await deliverableService.getFileVersions(deliverableId, testOrgId);
      expect(versions.length).toBeGreaterThan(0);
    });
  });

  describe('Project Timeline & Tracking', () => {
    it('should track project progress through phases', async () => {
      const phases = await projectService.getProjectPhases(projectId, testOrgId);
      expect(phases[0].status).toBe('pending');

      const tasks = await taskService.getProjectTasks(projectId, testOrgId, {});
      expect(tasks.items.length).toBeGreaterThan(0);
    });

    it('should handle task status workflow', async () => {
      const task = await taskService.createTask(testOrgId, {
        projectId,
        title: 'Code Review',
        description: 'Peer review pull requests',
        priority: 'medium',
      }, testUserId);

      let current = task;
      current = await taskService.updateTask(task.id, testOrgId, {
        status: 'in_progress',
      }, testUserId);
      expect(current.status).toBe('in_progress');

      current = await taskService.updateTask(task.id, testOrgId, {
        status: 'review',
      }, testUserId);
      expect(current.status).toBe('review');

      current = await taskService.updateTask(task.id, testOrgId, {
        status: 'done',
      }, testUserId);
      expect(current.status).toBe('done');
    });

    it('should enforce organization isolation on retrieval', async () => {
      try {
        await projectService.getProjectById(projectId, 'wrong-org-id');
        expect.fail('Should have thrown not found error');
      } catch (error: any) {
        expect(error.message).toContain('not found');
      }
    });

    it('should enforce organization isolation on task list', async () => {
      const result = await taskService.getProjectTasks(projectId, 'wrong-org-id', {});
      expect(result.items.length).toBe(0);
    });
  });

  describe('Deliverable Approval Workflow', () => {
    it('should track deliverable lifecycle', async () => {
      const deliverable = await deliverableService.createDeliverable(testOrgId, {
        projectId,
        name: 'API Documentation',
        description: 'REST API endpoint documentation',
        expectedDate: '2026-11-15',
        fileUrls: ['https://storage.example.com/api-docs.pdf'],
      }, testUserId);

      expect(deliverable.status).toBe('pending');

      const updated = await deliverableService.updateDeliverable(
        deliverable.id,
        testOrgId,
        { description: 'Complete API documentation with examples' },
        testUserId
      );
      expect(updated.description).toContain('examples');

      const approved = await deliverableService.approveDeliverable(
        deliverable.id,
        testOrgId,
        'Documentation is complete and clear',
        testUserId
      );
      expect(approved.status).toBe('accepted');
    });

    it('should handle multiple file versions', async () => {
      const deliverable = await deliverableService.createDeliverable(testOrgId, {
        projectId,
        name: 'Design System',
        description: 'UI component library',
        expectedDate: '2026-11-20',
        fileUrls: ['https://storage.example.com/design-v1.sketch'],
      }, testUserId);

      for (let i = 1; i <= 3; i++) {
        const version = await deliverableService.createFileVersion(testOrgId, {
          deliverableId: deliverable.id,
          filename: `design-system-v${i}.sketch`,
          fileUrl: `https://storage.example.com/design-v${i}.sketch`,
          fileSize: 1024 * 1024 * i,
          fileHash: `hash-v${i}`,
        }, testUserId);
        expect(version.versionNumber).toBe(i);
      }

      const versions = await deliverableService.getFileVersions(deliverable.id, testOrgId);
      expect(versions.length).toBe(3);
    });
  });

  describe('Task Assignment & Tracking', () => {
    it('should filter tasks by assignee', async () => {
      await taskService.createTask(testOrgId, {
        projectId,
        title: 'Backend Development',
        description: 'API implementation',
        priority: 'high',
        assignedTo: 'dev-001',
      }, testUserId);

      const result = await taskService.getProjectTasks(projectId, testOrgId, {
        assignedTo: 'dev-001',
      });
      expect(result.items.every(t => t.assignedTo === 'dev-001')).toBe(true);
    });

    it('should handle unassigned tasks', async () => {
      const task = await taskService.createTask(testOrgId, {
        projectId,
        title: 'Unassigned Task',
        description: 'Waiting for assignment',
        priority: 'low',
      }, testUserId);

      expect(task.assignedTo).toBeUndefined();

      const assigned = await taskService.updateTask(task.id, testOrgId, {
        assignedTo: 'dev-002',
      }, testUserId);
      expect(assigned.assignedTo).toBe('dev-002');
    });
  });
});
