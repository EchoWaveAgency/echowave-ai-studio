export enum DocumentType {
  CONTRACT = 'contract',
  PROPOSAL = 'proposal',
  INVOICE = 'invoice',
  AGREEMENT = 'agreement',
  NDA = 'nda',
  SERVICE_AGREEMENT = 'service_agreement',
  TERMS_OF_SERVICE = 'terms_of_service',
  PRIVACY_POLICY = 'privacy_policy',
  WORK_ORDER = 'work_order',
  STATEMENT_OF_WORK = 'statement_of_work',
}

export enum DocumentStatus {
  DRAFT = 'draft',
  READY_FOR_SIGNATURE = 'ready_for_signature',
  PENDING_SIGNATURES = 'pending_signatures',
  SIGNED = 'signed',
  EXECUTED = 'executed',
  ARCHIVED = 'archived',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

export enum SignatureStatus {
  PENDING = 'pending',
  SIGNED = 'signed',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum SignatureMethod {
  ELECTRONIC = 'electronic',
  DIGITAL_SIGNATURE = 'digital_signature',
  FAXED = 'faxed',
  WET_SIGNATURE = 'wet_signature',
  APPROVED = 'approved',
}

export interface DocumentVersion {
  id: string;
  versionNumber: number;
  createdAt: Date;
  createdBy: string;
  summary: string;
  fileUrl: string;
  fileHash: string;
  changeLog: string;
  isCurrentVersion: boolean;
}

export interface DocumentSignatory {
  id: string;
  name: string;
  email: string;
  role: string;
  signingOrder: number;
  status: SignatureStatus;
  signedAt?: Date;
  signatureImageUrl?: string;
  ipAddress?: string;
  userAgent?: string;
  rejectionReason?: string;
}

export interface DocumentSignature {
  id: string;
  documentId: string;
  signatoryId: string;
  method: SignatureMethod;
  timestamp: Date;
  signatureImageUrl: string;
  signatureData: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  validatedAt?: Date;
  certificateThumbprint?: string;
  status: SignatureStatus;
}

export interface Document {
  id: string;
  organizationId: string;
  documentName: string;
  documentType: DocumentType;
  status: DocumentStatus;
  description?: string;
  currentVersion: DocumentVersion;
  signatories: DocumentSignatory[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  expiresAt?: Date;
  templateId?: string;
  metadata?: Record<string, any>;
}

export interface DocumentTemplate {
  id: string;
  organizationId: string;
  templateName: string;
  documentType: DocumentType;
  content: string;
  variables: string[];
  defaultSignatories: Array<{
    role: string;
    signingOrder: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  version: number;
}

export interface ComplianceCheckpoint {
  id: string;
  documentId: string;
  checkType: string;
  checkName: string;
  status: 'passed' | 'failed' | 'pending' | 'skipped';
  checkResult?: Record<string, any>;
  checkedAt: Date;
  checkedBy: string;
  notes?: string;
}

export interface ComplianceAuditLog {
  id: string;
  organizationId: string;
  documentId: string;
  action: string;
  actionType: string;
  performedBy: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface DocumentAccessLog {
  id: string;
  documentId: string;
  accessedBy: string;
  accessType: 'view' | 'download' | 'sign' | 'export' | 'share';
  accessTime: Date;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
}

export interface SignatureWorkflow {
  id: string;
  organizationId: string;
  documentId: string;
  workflowName: string;
  signatories: DocumentSignatory[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
  escalatedAt?: Date;
  escalationReason?: string;
  metadata?: Record<string, any>;
}

export interface DocumentSharingLink {
  id: string;
  documentId: string;
  createdBy: string;
  createdAt: Date;
  expiresAt: Date;
  token: string;
  accessLevel: 'view' | 'sign' | 'comment';
  maxDownloads?: number;
  downloadCount: number;
  sharedWith?: string[];
  passwordProtected: boolean;
  passwordHash?: string;
  isActive: boolean;
}

export interface ReminderNotification {
  id: string;
  documentId: string;
  signatoryId: string;
  reminderType: 'initial' | 'follow_up' | 'escalation';
  sentAt: Date;
  status: 'sent' | 'bounced' | 'opened';
  openedAt?: Date;
  channel: 'email' | 'sms' | 'in_app';
  nextReminderAt?: Date;
}

export interface DocumentReport {
  id: string;
  organizationId: string;
  reportType: 'signature_status' | 'compliance' | 'expiration' | 'usage';
  generatedAt: Date;
  generatedBy: string;
  reportData: Record<string, any>;
  format: 'json' | 'csv' | 'pdf';
  fileUrl?: string;
  documentCount: number;
  metadata?: Record<string, any>;
}

export interface BulkDocumentOperation {
  id: string;
  organizationId: string;
  operationType: 'send_for_signature' | 'expire' | 'archive' | 'delete';
  documentIds: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  successCount: number;
  failureCount: number;
  errors?: Array<{ documentId: string; error: string }>;
}
