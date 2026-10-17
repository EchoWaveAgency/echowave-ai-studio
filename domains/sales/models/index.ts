// Sales domain models: Service Catalog, Proposals, Line Items, Approvals

export interface ServiceCatalogItem {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  category: 'web_design' | 'mobile_app' | 'branding' | 'digital_marketing' | 'consulting' | 'other';
  basePrice: number;
  currency: 'EGP' | 'USD' | 'EUR';
  deliveryDays: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Proposal {
  id: string;
  organizationId: string;
  clientId: string; // Could be lead or contact
  leadId?: string; // Link to lead if from CRM
  opportunityId?: string; // Link to opportunity
  title: string;
  description?: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  version: number;
  basePrice: number;
  discount?: number; // Percentage or flat amount
  finalPrice: number;
  currency: 'EGP' | 'USD' | 'EUR';
  validUntilDate: Date;
  sentAt?: Date;
  viewedAt?: Date;
  respondedAt?: Date;
  response?: 'accepted' | 'rejected';
  notes?: string;
  internalNotes?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string; // User ID
  approvedAt?: Date;
  isLocked: boolean; // Cannot edit after client views
  createdAt: Date;
  updatedAt: Date;
}

export interface ProposalLineItem {
  id: string;
  proposalId: string;
  organizationId: string;
  serviceCatalogItemId?: string; // Reference to catalog item if used
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number; // quantity * unitPrice
  lineOrder: number; // Display order
  createdAt: Date;
  updatedAt: Date;
}

export interface ProposalHistory {
  id: string;
  proposalId: string;
  organizationId: string;
  version: number;
  status: string;
  changes: Record<string, any>; // JSON of what changed
  changedBy: string; // User ID
  changedAt: Date;
  createdAt: Date;
}

export interface ApprovalGate {
  id: string;
  organizationId: string;
  resourceType: 'proposal' | 'invoice' | 'contract' | 'payment';
  resourceId: string;
  requiredApprovers: string[]; // User IDs with approval role
  currentApprovals: string[]; // User IDs who have approved
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProposalTemplate {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  content: string; // HTML template
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Input types for creating/updating

export interface ServiceCatalogItemCreateInput {
  name: string;
  description: string;
  category: string;
  basePrice: number;
  currency?: string;
  deliveryDays: number;
}

export interface ProposalCreateInput {
  clientId: string;
  leadId?: string;
  opportunityId?: string;
  title: string;
  description?: string;
  validUntilDate: Date;
  lineItems: ProposalLineItemCreateInput[];
  discount?: number;
  notes?: string;
  internalNotes?: string;
}

export interface ProposalLineItemCreateInput {
  serviceCatalogItemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface ProposalUpdateInput {
  title?: string;
  description?: string;
  validUntilDate?: Date;
  discount?: number;
  notes?: string;
  internalNotes?: string;
}

// Constants

export const PROPOSAL_STATUSES = {
  DRAFT: 'draft',
  SENT: 'sent',
  VIEWED: 'viewed',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
} as const;

export const APPROVAL_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const SERVICE_CATEGORIES = [
  'web_design',
  'mobile_app',
  'branding',
  'digital_marketing',
  'consulting',
  'other',
] as const;

export const CURRENCIES = ['EGP', 'USD', 'EUR'] as const;
