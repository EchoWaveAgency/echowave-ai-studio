import { AuthorizationError } from '../errors/errors';
import { logger } from '../logging/logger';

export enum Role {
  Owner = 'owner',
  Admin = 'admin',
  Finance = 'finance',
  Sales = 'sales',
  PM = 'pm',
  Creative = 'creative',
  Support = 'support',
  Client = 'client',
  Auditor = 'auditor',
}

export interface User {
  id: string;
  organizationId: string;
  email: string;
  roles: Role[];
  isActive: boolean;
}

export interface AuthContext {
  user: User;
  organizationId: string;
  requestId: string;
}

export const RoleHierarchy: Record<Role, Role[]> = {
  [Role.Owner]: [Role.Owner, Role.Admin, Role.Finance, Role.Sales, Role.PM, Role.Creative, Role.Support, Role.Client],
  [Role.Admin]: [Role.Admin, Role.Finance, Role.Sales, Role.PM, Role.Creative, Role.Support],
  [Role.Finance]: [Role.Finance],
  [Role.Sales]: [Role.Sales],
  [Role.PM]: [Role.PM],
  [Role.Creative]: [Role.Creative],
  [Role.Support]: [Role.Support],
  [Role.Client]: [Role.Client],
  [Role.Auditor]: [Role.Auditor],
};

export function requireRole(requiredRoles: Role[]): (context: AuthContext) => void {
  return (context: AuthContext) => {
    const userRoles = context.user.roles;
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      logger.audit('RBAC_CHECK_FAILED', `user:${context.user.id}`, {
        requiredRoles,
        userRoles,
        organizationId: context.organizationId,
      });
      throw new AuthorizationError(`Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`);
    }
  };
}

export function requireOrgMembership(context: AuthContext): void {
  if (context.user.organizationId !== context.organizationId) {
    logger.audit('ORG_ISOLATION_CHECK_FAILED', `user:${context.user.id}`, {
      userOrgId: context.user.organizationId,
      requestedOrgId: context.organizationId,
    });
    throw new AuthorizationError('Access denied: user not a member of this organization');
  }
}

export function requireActive(context: AuthContext): void {
  if (!context.user.isActive) {
    logger.audit('INACTIVE_USER_ACCESS_ATTEMPT', `user:${context.user.id}`, {
      organizationId: context.organizationId,
    });
    throw new AuthorizationError('User account is inactive');
  }
}

export function checkAbac(
  context: AuthContext,
  checks: Array<() => boolean>
): void {
  for (const check of checks) {
    if (!check()) {
      logger.audit('ABAC_CHECK_FAILED', `user:${context.user.id}`, {
        organizationId: context.organizationId,
      });
      throw new AuthorizationError('Access denied: attribute-based check failed');
    }
  }
}

export async function enforceOrgIsolation(
  context: AuthContext,
  resourceOrgId: string
): Promise<void> {
  if (context.organizationId !== resourceOrgId) {
    logger.audit('CROSS_ORG_ACCESS_ATTEMPT', `user:${context.user.id}`, {
      userOrgId: context.organizationId,
      resourceOrgId,
    });
    throw new AuthorizationError('Access denied: resource belongs to another organization');
  }
}
