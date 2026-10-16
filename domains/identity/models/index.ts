// Identity Domain Models

export interface Organization {
  id: string;
  name: string;
  slug: string;
  country: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  organizationId: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  organizationId: string;
  createdAt: Date;
}

export interface LegalEntity {
  id: string;
  organizationId: string;
  name: string;
  country: string;
  registrationNumber?: string;
  taxId?: string;
  status: 'pending' | 'in_progress' | 'active' | 'inactive';
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceTask {
  id: string;
  legalEntityId: string;
  task: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  dueDate?: Date;
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditEvent {
  id: string;
  organizationId: string;
  userId?: string;
  operation: string;
  resourceType: string;
  resourceId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  errorMessage?: string;
  createdAt: Date;
}

export type UserCreateInput = Omit<User, 'id' | 'passwordHash' | 'createdAt' | 'updatedAt'> & {
  password: string;
};

export type OrganizationCreateInput = Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>;

export const ROLES = {
  owner: 'owner',
  admin: 'admin',
  finance: 'finance',
  sales: 'sales',
  pm: 'pm',
  creative: 'creative',
  support: 'support',
  client: 'client',
  auditor: 'auditor',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];
