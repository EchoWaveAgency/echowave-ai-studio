export interface ContractTemplate {
  id: string;
  organizationId: string;
  name: string;
  category: 'service' | 'nda' | 'employment' | 'vendor' | 'license' | 'partnership' | 'custom';
  description: string;
  content: string;
  variables: string[];
  createdBy: string;
  status: 'draft' | 'active' | 'archived';
  version: number;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contract {
  id: string;
  organizationId: string;
  templateId: string;
  contractNumber: string;
  title: string;
  content: string;
  parties: string[];
  variables: Record<string, string>;
  status: 'draft' | 'pending_review' | 'pending_signature' | 'signed' | 'expired' | 'terminated' | 'archived';
  category: 'service' | 'nda' | 'employment' | 'vendor' | 'license' | 'partnership' | 'custom';
  startDate?: Date;
  endDate?: Date;
  renewalDate?: Date;
  autoRenew: boolean;
  relatedToSubscriptionId?: string;
  relatedToProposalId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

export interface ContractSigner {
  id: string;
  organizationId: string;
  contractId: string;
  name: string;
  email: string;
  role: 'owner' | 'witness' | 'approver' | 'recipient';
  signatureType: 'digital' | 'esignature' | 'manual';
  signedAt?: Date;
  signatureData?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: 'pending' | 'signed' | 'declined' | 'expired';
  signatureTokenId?: string;
  tokenExpiresAt?: Date;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContractApproval {
  id: string;
  organizationId: string;
  contractId: string;
  approverId: string;
  approverName: string;
  approverEmail: string;
  level: number;
  requiredRole: string;
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  comments?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  approvalTokenId?: string;
  tokenExpiresAt?: Date;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContractVersion {
  id: string;
  organizationId: string;
  contractId: string;
  version: number;
  content: string;
  changes: string;
  createdBy: string;
  createdAt: Date;
  metadata: Record<string, any>;
}

export interface ContractAuditLog {
  id: string;
  organizationId: string;
  contractId: string;
  event: 'created' | 'updated' | 'sent_for_review' | 'sent_for_signature' | 'signed' | 'approved' | 'rejected' | 'expired' | 'terminated' | 'renewed' | 'archived';
  userId: string;
  userName: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export const CONTRACT_CATEGORIES = [
  'service',
  'nda',
  'employment',
  'vendor',
  'license',
  'partnership',
  'custom',
] as const;

export const CONTRACT_STATUSES = [
  'draft',
  'pending_review',
  'pending_signature',
  'signed',
  'expired',
  'terminated',
  'archived',
] as const;

export const SIGNER_ROLES = ['owner', 'witness', 'approver', 'recipient'] as const;

export const SIGNER_STATUSES = ['pending', 'signed', 'declined', 'expired'] as const;

export const APPROVAL_STATUSES = ['pending', 'approved', 'rejected', 'escalated'] as const;

export const AUDIT_EVENTS = [
  'created',
  'updated',
  'sent_for_review',
  'sent_for_signature',
  'signed',
  'approved',
  'rejected',
  'expired',
  'terminated',
  'renewed',
  'archived',
] as const;

export const SIGNATURE_TYPES = ['digital', 'esignature', 'manual'] as const;
