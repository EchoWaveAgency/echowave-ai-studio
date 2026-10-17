import {
  Deliverable,
  DeliverableVersion,
  ApprovalStatus,
  TaskStatus,
} from "../models/index";

export class DeliverableService {
  private deliverables = new Map<string, Deliverable>();
  private deliverableIdCounter = 1;

  // Create Deliverable
  createDeliverable(
    organizationId: string,
    projectId: string,
    data: {
      name: string;
      description: string;
      type: string;
      assignedToId: string;
      dueDate: Date;
      acceptanceCriteria?: string[];
      milestoneId?: string;
      phaseId?: string;
    },
    userId: string
  ): Deliverable {
    if (!data.name || !data.type || !data.assignedToId) {
      throw new Error("name, type, and assignedToId are required");
    }

    const deliverable: Deliverable = {
      id: `del_${projectId}_${this.deliverableIdCounter++}`,
      project_id: projectId,
      name: data.name,
      description: data.description,
      type: data.type,
      status: TaskStatus.TODO,
      milestone_id: data.milestoneId,
      phase_id: data.phaseId,
      assigned_to_id: data.assignedToId,
      due_date: data.dueDate,
      file_references: [],
      approval_status: ApprovalStatus.PENDING,
      version: 1,
      previous_versions: [],
      acceptance_criteria: data.acceptanceCriteria || [],
      completion_percentage: 0,
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date(),
    };

    this.deliverables.set(deliverable.id, deliverable);
    return deliverable;
  }

  // Get Deliverable
  getDeliverableById(organizationId: string, deliverableId: string): Deliverable {
    const deliverable = this.deliverables.get(deliverableId);
    if (!deliverable || !deliverable.project_id) {
      throw new Error("Deliverable not found");
    }
    return deliverable;
  }

  // Get Project Deliverables
  getProjectDeliverables(organizationId: string, projectId: string, filters?: {
    status?: TaskStatus;
    approvalStatus?: ApprovalStatus;
    limit?: number;
    offset?: number;
  }): Deliverable[] {
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    let deliverables = Array.from(this.deliverables.values()).filter(
      (d) => d.project_id === projectId
    );

    if (filters?.status) {
      deliverables = deliverables.filter((d) => d.status === filters.status);
    }

    if (filters?.approvalStatus) {
      deliverables = deliverables.filter((d) => d.approval_status === filters.approvalStatus);
    }

    return deliverables.slice(offset, offset + limit);
  }

  // Update Deliverable Status
  updateDeliverableStatus(
    organizationId: string,
    deliverableId: string,
    status: TaskStatus,
    userId: string
  ): Deliverable {
    const deliverable = this.getDeliverableById(organizationId, deliverableId);
    deliverable.status = status;
    if (status === TaskStatus.COMPLETED) {
      deliverable.completion_date = new Date();
      deliverable.completion_percentage = 100;
    }
    deliverable.updated_at = new Date();
    return deliverable;
  }

  // Add File Reference
  addFileReference(
    organizationId: string,
    deliverableId: string,
    fileId: string
  ): Deliverable {
    const deliverable = this.getDeliverableById(organizationId, deliverableId);
    if (!deliverable.file_references.includes(fileId)) {
      deliverable.file_references.push(fileId);
    }
    deliverable.updated_at = new Date();
    return deliverable;
  }

  // Submit for Approval
  submitForApproval(
    organizationId: string,
    deliverableId: string,
    userId: string
  ): Deliverable {
    const deliverable = this.getDeliverableById(organizationId, deliverableId);
    if (deliverable.status !== TaskStatus.IN_PROGRESS) {
      throw new Error("Deliverable must be in progress to submit for approval");
    }

    deliverable.approval_status = ApprovalStatus.IN_REVIEW;
    deliverable.status = TaskStatus.IN_REVIEW;
    deliverable.updated_at = new Date();
    return deliverable;
  }

  // Approve Deliverable
  approveDeliverable(
    organizationId: string,
    deliverableId: string,
    reviewerId: string
  ): Deliverable {
    const deliverable = this.getDeliverableById(organizationId, deliverableId);
    if (deliverable.approval_status !== ApprovalStatus.IN_REVIEW) {
      throw new Error("Deliverable must be in review to approve");
    }

    deliverable.approval_status = ApprovalStatus.APPROVED;
    deliverable.status = TaskStatus.COMPLETED;
    deliverable.reviewer_id = reviewerId;
    deliverable.reviewed_date = new Date();
    deliverable.completion_percentage = 100;
    deliverable.updated_at = new Date();
    return deliverable;
  }

  // Reject Deliverable
  rejectDeliverable(
    organizationId: string,
    deliverableId: string,
    reviewerId: string,
    reason: string
  ): Deliverable {
    const deliverable = this.getDeliverableById(organizationId, deliverableId);
    if (deliverable.approval_status !== ApprovalStatus.IN_REVIEW) {
      throw new Error("Deliverable must be in review to reject");
    }

    deliverable.approval_status = ApprovalStatus.REVISION_REQUESTED;
    deliverable.status = TaskStatus.IN_PROGRESS;
    deliverable.reviewer_id = reviewerId;
    deliverable.reviewed_date = new Date();
    deliverable.updated_at = new Date();
    return deliverable;
  }

  // Create New Version
  createNewVersion(
    organizationId: string,
    deliverableId: string,
    newFileId: string,
    changeSummary: string,
    userId: string
  ): Deliverable {
    const deliverable = this.getDeliverableById(organizationId, deliverableId);

    // Store current version as previous
    const previousVersion: DeliverableVersion = {
      version: deliverable.version,
      file_id: deliverable.file_references[0] || "",
      created_by: deliverable.created_by,
      created_at: deliverable.created_at,
      change_summary: "Initial version",
    };

    deliverable.previous_versions.push(previousVersion);
    deliverable.version += 1;
    deliverable.file_references = [newFileId];
    deliverable.approval_status = ApprovalStatus.PENDING;
    deliverable.status = TaskStatus.IN_PROGRESS;
    deliverable.completion_percentage = 0;
    deliverable.updated_at = new Date();

    return deliverable;
  }

  // Get Deliverable History
  getDeliverableHistory(organizationId: string, deliverableId: string): Array<{
    version: number;
    fileId: string;
    createdBy: string;
    createdAt: Date;
    changeSummary: string;
  }> {
    const deliverable = this.getDeliverableById(organizationId, deliverableId);

    const history = deliverable.previous_versions.map((v) => ({
      version: v.version,
      fileId: v.file_id,
      createdBy: v.created_by,
      createdAt: v.created_at,
      changeSummary: v.change_summary,
    }));

    // Add current version
    history.push({
      version: deliverable.version,
      fileId: deliverable.file_references[0] || "",
      createdBy: deliverable.created_by,
      createdAt: deliverable.created_at,
      changeSummary: "Current version",
    });

    return history;
  }

  // Check Acceptance Criteria
  checkAcceptanceCriteria(
    organizationId: string,
    deliverableId: string
  ): {
    totalCriteria: number;
    metCriteria: number;
    percentage: number;
    criteria: Array<{ name: string; met: boolean }>;
  } {
    const deliverable = this.getDeliverableById(organizationId, deliverableId);

    // Simulate acceptance criteria checking
    const criteria = deliverable.acceptance_criteria.map((ac) => ({
      name: ac,
      met: Math.random() > 0.3, // Simple simulation
    }));

    const metCount = criteria.filter((c) => c.met).length;
    const percentage = deliverable.acceptance_criteria.length > 0
      ? (metCount / deliverable.acceptance_criteria.length) * 100
      : 0;

    return {
      totalCriteria: deliverable.acceptance_criteria.length,
      metCriteria: metCount,
      percentage,
      criteria,
    };
  }

  // Get Pending Approvals
  getPendingApprovals(organizationId: string, limit = 50, offset = 0): Deliverable[] {
    return Array.from(this.deliverables.values())
      .filter(
        (d) => d.approval_status === ApprovalStatus.IN_REVIEW ||
                d.approval_status === ApprovalStatus.REVISION_REQUESTED
      )
      .slice(offset, offset + limit);
  }

  // Delete Deliverable
  deleteDeliverable(organizationId: string, deliverableId: string): void {
    const deliverable = this.getDeliverableById(organizationId, deliverableId);
    this.deliverables.delete(deliverableId);
  }
}
