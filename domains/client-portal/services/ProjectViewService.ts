import {
  ClientProjectView,
  ClientDeliverableView,
  ClientFileReference,
  ClientFeedback,
  ClientProjectTimeline,
  ClientTeamMemberView,
  ClientDocument,
  FeedbackRequest,
} from "../models/index";

export class ProjectViewService {
  private projectViews = new Map<string, ClientProjectView>();
  private feedbackRequests = new Map<string, FeedbackRequest>();
  private feedbackResponses = new Map<string, ClientFeedback>();
  private viewIdCounter = 1;
  private feedbackIdCounter = 1;

  // Get Client Project View
  getClientProjectView(organizationId: string, clientAccountId: string, projectId: string): ClientProjectView {
    const viewKey = `${clientAccountId}_${projectId}`;
    const view = this.projectViews.get(viewKey);

    if (!view) {
      throw new Error("Project view not found");
    }

    return view;
  }

  // Create Project View for Client
  createProjectViewForClient(
    organizationId: string,
    clientAccountId: string,
    projectData: {
      projectId: string;
      name: string;
      description: string;
      status: string;
      startDate: Date;
      endDate: Date;
      completionPercentage: number;
    }
  ): ClientProjectView {
    const view: ClientProjectView = {
      id: `proj_view_${this.viewIdCounter++}`,
      name: projectData.name,
      description: projectData.description,
      status: projectData.status,
      start_date: projectData.startDate,
      end_date: projectData.endDate,
      completion_percentage: projectData.completionPercentage,
      timeline_variance: 0,
      team_members: [],
      deliverables: [],
      documents: [],
      timeline: [],
    };

    const viewKey = `${clientAccountId}_${projectData.projectId}`;
    this.projectViews.set(viewKey, view);
    return view;
  }

  // Add Deliverable to Project View
  addDeliverableToView(
    organizationId: string,
    clientAccountId: string,
    projectId: string,
    deliverableData: {
      deliverableId: string;
      name: string;
      type: string;
      status: string;
      dueDate: Date;
      approvalRequired: boolean;
    }
  ): ClientDeliverableView {
    const viewKey = `${clientAccountId}_${projectId}`;
    const view = this.projectViews.get(viewKey);

    if (!view) {
      throw new Error("Project view not found");
    }

    const deliverable: ClientDeliverableView = {
      id: deliverableData.deliverableId,
      name: deliverableData.name,
      type: deliverableData.type,
      status: deliverableData.status,
      due_date: deliverableData.dueDate,
      approval_status: "pending",
      file_references: [],
      feedback: [],
      approval_required: deliverableData.approvalRequired,
      can_approve: false,
    };

    view.deliverables.push(deliverable);
    return deliverable;
  }

  // Add File to Deliverable
  addFileToDeliverable(
    organizationId: string,
    clientAccountId: string,
    projectId: string,
    deliverableId: string,
    fileData: {
      fileId: string;
      name: string;
      size: number;
      type: string;
      uploadedBy: string;
      expiresAt: Date;
    }
  ): ClientFileReference {
    const viewKey = `${clientAccountId}_${projectId}`;
    const view = this.projectViews.get(viewKey);

    if (!view) {
      throw new Error("Project view not found");
    }

    const deliverable = view.deliverables.find((d) => d.id === deliverableId);
    if (!deliverable) {
      throw new Error("Deliverable not found");
    }

    const fileRef: ClientFileReference = {
      id: `file_ref_${fileData.fileId}`,
      file_id: fileData.fileId,
      name: fileData.name,
      size: fileData.size,
      type: fileData.type,
      uploaded_at: new Date(),
      uploaded_by: fileData.uploadedBy,
      access_url: this.generateSignedUrl(fileData.fileId),
      expires_at: fileData.expiresAt,
    };

    deliverable.file_references.push(fileRef);
    return fileRef;
  }

  // Add Feedback to Deliverable
  addFeedbackToDeliverable(
    organizationId: string,
    clientAccountId: string,
    projectId: string,
    deliverableId: string,
    feedbackData: {
      portalUserId: string;
      comment: string;
      attachments?: string[];
    }
  ): ClientFeedback {
    const viewKey = `${clientAccountId}_${projectId}`;
    const view = this.projectViews.get(viewKey);

    if (!view) {
      throw new Error("Project view not found");
    }

    const deliverable = view.deliverables.find((d) => d.id === deliverableId);
    if (!deliverable) {
      throw new Error("Deliverable not found");
    }

    const feedback: ClientFeedback = {
      id: `feedback_${this.feedbackIdCounter++}`,
      deliverable_id: deliverableId,
      portal_user_id: feedbackData.portalUserId,
      comment: feedbackData.comment,
      status: "pending",
      created_at: new Date(),
      file_attachments: feedbackData.attachments,
    };

    deliverable.feedback.push(feedback);
    this.feedbackResponses.set(feedback.id, feedback);
    return feedback;
  }

  // Acknowledge Feedback
  acknowledgeFeedback(
    organizationId: string,
    clientAccountId: string,
    feedbackId: string
  ): ClientFeedback {
    const feedback = this.feedbackResponses.get(feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    feedback.status = "acknowledged";
    return feedback;
  }

  // Create Feedback Request
  createFeedbackRequest(
    organizationId: string,
    clientAccountId: string,
    projectId: string,
    deliverableId: string,
    requestedBy: string,
    dueDate: Date,
    requiredParticipants?: string[]
  ): FeedbackRequest {
    const request: FeedbackRequest = {
      id: `feedback_req_${this.feedbackIdCounter++}`,
      client_account_id: clientAccountId,
      deliverable_id: deliverableId,
      requested_by: requestedBy,
      request_date: new Date(),
      due_date: dueDate,
      status: "pending",
      reminder_sent: false,
      required_participants: requiredParticipants,
      completed_by: [],
    };

    this.feedbackRequests.set(request.id, request);
    return request;
  }

  // Get Feedback Requests
  getFeedbackRequests(organizationId: string, clientAccountId: string): FeedbackRequest[] {
    return Array.from(this.feedbackRequests.values()).filter(
      (r) => r.client_account_id === clientAccountId
    );
  }

  // Mark Feedback Request as Completed
  completeFeedbackRequest(
    organizationId: string,
    clientAccountId: string,
    requestId: string,
    completedBy: string
  ): FeedbackRequest {
    const request = this.feedbackRequests.get(requestId);
    if (!request) {
      throw new Error("Feedback request not found");
    }

    if (!request.completed_by) {
      request.completed_by = [];
    }
    request.completed_by.push(completedBy);

    // Check if all required participants have completed
    if (request.required_participants) {
      const allCompleted = request.required_participants.every((p) =>
        request.completed_by?.includes(p)
      );
      if (allCompleted) {
        request.status = "completed";
      }
    }

    return request;
  }

  // Add Timeline Event
  addTimelineEvent(
    organizationId: string,
    clientAccountId: string,
    projectId: string,
    eventData: {
      date: Date;
      type: string;
      title: string;
      description: string;
      isCompleted: boolean;
    }
  ): ClientProjectTimeline {
    const viewKey = `${clientAccountId}_${projectId}`;
    const view = this.projectViews.get(viewKey);

    if (!view) {
      throw new Error("Project view not found");
    }

    const event: ClientProjectTimeline = {
      id: `timeline_event_${view.timeline.length + 1}`,
      date: eventData.date,
      type: eventData.type,
      title: eventData.title,
      description: eventData.description,
      is_completed: eventData.isCompleted,
    };

    view.timeline.push(event);
    // Sort by date
    view.timeline.sort((a, b) => a.date.getTime() - b.date.getTime());

    return event;
  }

  // Add Document to Project
  addDocumentToProject(
    organizationId: string,
    clientAccountId: string,
    projectId: string,
    docData: {
      title: string;
      description: string;
      category: string;
      fileId: string;
      fileName: string;
      fileSize: number;
      uploadedBy: string;
    }
  ): ClientDocument {
    const viewKey = `${clientAccountId}_${projectId}`;
    const view = this.projectViews.get(viewKey);

    if (!view) {
      throw new Error("Project view not found");
    }

    const doc: ClientDocument = {
      id: `doc_${this.feedbackIdCounter++}`,
      client_account_id: clientAccountId,
      title: docData.title,
      description: docData.description,
      category: docData.category as any,
      file_id: docData.fileId,
      file_name: docData.fileName,
      file_size: docData.fileSize,
      file_type: this.getFileType(docData.fileName),
      uploaded_at: new Date(),
      uploaded_by: docData.uploadedBy,
      is_signed: false,
      access_level: "viewer",
      tags: [],
      version: 1,
    };

    view.documents.push(doc);
    return doc;
  }

  // Add Team Member to Project View
  addTeamMemberToView(
    organizationId: string,
    clientAccountId: string,
    projectId: string,
    memberData: {
      memberId: string;
      name: string;
      role: string;
      avatarUrl?: string;
      isContact: boolean;
    }
  ): ClientTeamMemberView {
    const viewKey = `${clientAccountId}_${projectId}`;
    const view = this.projectViews.get(viewKey);

    if (!view) {
      throw new Error("Project view not found");
    }

    const member: ClientTeamMemberView = {
      id: memberData.memberId,
      name: memberData.name,
      role: memberData.role,
      avatar_url: memberData.avatarUrl,
      is_contact: memberData.isContact,
    };

    view.team_members.push(member);
    return member;
  }

  // Get Project Timeline
  getProjectTimeline(organizationId: string, clientAccountId: string, projectId: string): ClientProjectTimeline[] {
    const viewKey = `${clientAccountId}_${projectId}`;
    const view = this.projectViews.get(viewKey);

    if (!view) {
      throw new Error("Project view not found");
    }

    return view.timeline;
  }

  // Get Project Documents
  getProjectDocuments(organizationId: string, clientAccountId: string, projectId: string): ClientDocument[] {
    const viewKey = `${clientAccountId}_${projectId}`;
    const view = this.projectViews.get(viewKey);

    if (!view) {
      throw new Error("Project view not found");
    }

    return view.documents;
  }

  // Update Deliverable Status in View
  updateDeliverableStatus(
    organizationId: string,
    clientAccountId: string,
    projectId: string,
    deliverableId: string,
    status: string
  ): ClientDeliverableView {
    const viewKey = `${clientAccountId}_${projectId}`;
    const view = this.projectViews.get(viewKey);

    if (!view) {
      throw new Error("Project view not found");
    }

    const deliverable = view.deliverables.find((d) => d.id === deliverableId);
    if (!deliverable) {
      throw new Error("Deliverable not found");
    }

    deliverable.status = status;
    if (status === "completed") {
      deliverable.completion_date = new Date();
    }

    return deliverable;
  }

  // Private helpers
  private generateSignedUrl(fileId: string): string {
    const expiresIn = 3600; // 1 hour
    return `https://storage.echowave.io/files/${fileId}?expires=${Date.now() + expiresIn * 1000}`;
  }

  private getFileType(fileName: string): string {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      jpg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      zip: "application/zip",
    };
    return mimeTypes[ext || ""] || "application/octet-stream";
  }
}
