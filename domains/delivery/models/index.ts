// Project Management Domain Models

// Project
export interface Project {
  id: string;
  organizationId: string;
  clientId: string;
  contractId?: string;
  name: string;
  description: string;
  startDate: string;
  targetEndDate: string;
  actualEndDate?: string;
  budget?: number;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectCreateInput {
  clientId: string;
  contractId?: string;
  name: string;
  description: string;
  startDate: string;
  targetEndDate: string;
  budget?: number;
}

export interface ProjectUpdateInput {
  name?: string;
  description?: string;
  startDate?: string;
  targetEndDate?: string;
  budget?: number;
  status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  actualEndDate?: string;
}

// Project Phase
export interface ProjectPhase {
  id: string;
  projectId: string;
  name: string;
  sequenceOrder: number;
  startDate: string;
  targetEndDate: string;
  actualEndDate?: string;
  status: 'pending' | 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPhaseCreateInput {
  name: string;
  sequenceOrder: number;
  startDate: string;
  targetEndDate: string;
}

// Task
export interface Task {
  id: string;
  organizationId: string;
  projectId: string;
  phaseId?: string;
  title: string;
  description: string;
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
  dueDate?: string;
  estimatedHours?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCreateInput {
  projectId: string;
  phaseId?: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
  estimatedHours?: number;
  assignedTo?: string;
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
  dueDate?: string;
  estimatedHours?: number;
  assignedTo?: string;
  phaseId?: string;
}

// Task Dependency
export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  blocking: boolean;
  createdAt: string;
}

export interface TaskDependencyCreateInput {
  dependsOnTaskId: string;
  blocking: boolean;
}

// Deliverable
export interface Deliverable {
  id: string;
  projectId: string;
  name: string;
  description: string;
  expectedDate: string;
  actualDate?: string;
  status: 'pending' | 'delivered' | 'accepted' | 'rejected';
  fileUrls: string[];
  approvalNotes?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliverableCreateInput {
  projectId: string;
  name: string;
  description: string;
  expectedDate: string;
  fileUrls: string[];
}

export interface DeliverableUpdateInput {
  name?: string;
  description?: string;
  expectedDate?: string;
  fileUrls?: string[];
  approvalNotes?: string;
}

// File Version
export interface FileVersion {
  id: string;
  organizationId: string;
  deliverableId?: string;
  projectId?: string;
  filename: string;
  fileUrl: string;
  fileSize: number;
  fileHash: string;
  versionNumber: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface FileVersionCreateInput {
  deliverableId?: string;
  projectId?: string;
  filename: string;
  fileUrl: string;
  fileSize: number;
  fileHash: string;
}

// Constants
export const PROJECT_STATUSES = ['planning', 'active', 'on_hold', 'completed', 'cancelled'] as const;
export const PHASE_STATUSES = ['pending', 'active', 'completed'] as const;
export const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done', 'blocked'] as const;
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
export const DELIVERABLE_STATUSES = ['pending', 'delivered', 'accepted', 'rejected'] as const;
export const PHASE_NAMES = ['Discovery', 'Design', 'Development', 'QA', 'Delivery'] as const;
