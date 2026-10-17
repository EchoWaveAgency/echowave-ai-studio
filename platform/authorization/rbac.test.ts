import { describe, it, expect } from 'vitest';
import {
  requireRole,
  requireOrgMembership,
  Role,
  AuthContext,
  enforceOrgIsolation,
} from './rbac';
import { AuthorizationError } from '../errors/errors';

describe('RBAC', () => {
  const testContext: AuthContext = {
    user: {
      id: 'user-123',
      organizationId: 'org-456',
      email: 'test@example.com',
      roles: [Role.Admin],
      isActive: true,
    },
    organizationId: 'org-456',
    requestId: 'req-789',
  };

  describe('requireRole', () => {
    it('should allow user with required role', () => {
      const check = requireRole([Role.Admin]);
      expect(() => check(testContext)).not.toThrow();
    });

    it('should deny user without required role', () => {
      const contextWithoutRole = {
        ...testContext,
        user: { ...testContext.user, roles: [Role.Client] },
      };
      const check = requireRole([Role.Admin, Role.Owner]);
      expect(() => check(contextWithoutRole)).toThrow(AuthorizationError);
    });
  });

  describe('requireOrgMembership', () => {
    it('should allow user in same organization', () => {
      expect(() => requireOrgMembership(testContext)).not.toThrow();
    });

    it('should deny user from different organization', () => {
      const contextDifferentOrg = {
        ...testContext,
        organizationId: 'org-999',
      };
      expect(() => requireOrgMembership(contextDifferentOrg)).toThrow(AuthorizationError);
    });
  });

  describe('enforceOrgIsolation', () => {
    it('should allow access to resource in same org', async () => {
      await expect(enforceOrgIsolation(testContext, 'org-456')).resolves.not.toThrow();
    });

    it('should deny access to resource in different org', async () => {
      await expect(enforceOrgIsolation(testContext, 'org-999')).rejects.toThrow(
        AuthorizationError
      );
    });
  });
});
