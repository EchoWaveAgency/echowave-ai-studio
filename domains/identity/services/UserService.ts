// User Service — Identity Domain
// Handles user creation, lookup, and lifecycle

import { query, transaction, getClient } from '../../../platform/database/connection';
import {
  User,
  UserCreateInput,
  Organization,
} from '../models';
import { NotFoundError, ValidationError, AuthorizationError } from '../../../platform/errors/errors';
import { defaultLogger } from '../../../platform/logging/logger';
import { validateEmail, validatePassword } from '../../../platform/utils/validation';

export class UserService {
  /**
   * Create a new user in an organization
   */
  async createUser(
    organizationId: string,
    input: Omit<UserCreateInput, 'organizationId'> & { password: string }
  ): Promise<User> {
    // Validate input
    if (!validateEmail(input.email)) {
      throw new ValidationError('Invalid email format', { email: ['Invalid email address'] });
    }

    const passwordValidation = validatePassword(input.password);
    if (!passwordValidation.valid) {
      throw new ValidationError('Password does not meet requirements', {
        password: passwordValidation.errors,
      });
    }

    // Check org exists
    const orgResult = await query('SELECT id FROM organizations WHERE id = $1', [organizationId]);
    if (orgResult.rows.length === 0) {
      throw new NotFoundError('Organization', organizationId);
    }

    // Check email not already used
    const existingResult = await query(
      'SELECT id FROM users WHERE organization_id = $1 AND email = $2',
      [organizationId, input.email]
    );
    if (existingResult.rows.length > 0) {
      throw new ValidationError('User with this email already exists', {
        email: ['Email already in use'],
      });
    }

    // Hash password (placeholder - use bcrypt in production)
    const passwordHash = input.password; // TODO: implement proper hashing

    // Create user in transaction
    const user = await transaction(async (client) => {
      const result = await client.query(
        `INSERT INTO users
         (organization_id, email, password_hash, first_name, last_name, is_active, is_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          organizationId,
          input.email,
          passwordHash,
          input.firstName,
          input.lastName,
          input.isActive ?? true,
          input.isVerified ?? false,
        ]
      );

      const user = result.rows[0];

      // Audit log
      await client.query(
        `INSERT INTO audit_events
         (organization_id, operation, resource_type, resource_id, changes, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          organizationId,
          'CREATE',
          'user',
          user.id,
          JSON.stringify({ email: input.email }),
          'success',
        ]
      );

      return user;
    });

    defaultLogger.info(`User created: ${user.id}`, {
      organizationId,
      email: input.email,
    });

    return user;
  }

  /**
   * Get user by ID with org isolation check
   */
  async getUserById(userId: string, organizationId: string): Promise<User> {
    const result = await query(
      'SELECT * FROM users WHERE id = $1 AND organization_id = $2',
      [userId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User', userId);
    }

    return result.rows[0];
  }

  /**
   * Get user by email with org isolation
   */
  async getUserByEmail(email: string, organizationId: string): Promise<User> {
    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND organization_id = $2',
      [email, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User', email);
    }

    return result.rows[0];
  }

  /**
   * Get all users in organization
   */
  async getOrganizationUsers(organizationId: string, limit = 100, offset = 0): Promise<User[]> {
    const result = await query(
      'SELECT * FROM users WHERE organization_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [organizationId, limit, offset]
    );

    return result.rows;
  }

  /**
   * Update user profile
   */
  async updateUser(
    userId: string,
    organizationId: string,
    updates: Partial<Pick<User, 'firstName' | 'lastName' | 'isActive'>>
  ): Promise<User> {
    // Get current user to log changes
    const current = await this.getUserById(userId, organizationId);

    const allowedFields = ['firstName', 'lastName', 'isActive'];
    const updateClauses = [];
    const params = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        const colName = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updateClauses.push(`${colName} = $${paramIndex++}`);
        params.push(value);
      }
    }

    if (updateClauses.length === 0) {
      return current;
    }

    params.push(userId);
    params.push(organizationId);

    const result = await query(
      `UPDATE users
       SET ${updateClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex++} AND organization_id = $${paramIndex++}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User', userId);
    }

    // Audit log
    await query(
      `INSERT INTO audit_events
       (organization_id, user_id, operation, resource_type, resource_id, changes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        organizationId,
        userId,
        'UPDATE',
        'user',
        userId,
        JSON.stringify({ before: current, after: result.rows[0] }),
        'success',
      ]
    );

    return result.rows[0];
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(userId: string, organizationId: string): Promise<void> {
    await this.updateUser(userId, organizationId, { isActive: false });

    defaultLogger.audit('USER_DEACTIVATED', `user:${userId}`, {
      organizationId,
    });
  }

  /**
   * Count users in organization
   */
  async countOrganizationUsers(organizationId: string): Promise<number> {
    const result = await query(
      'SELECT COUNT(*) as count FROM users WHERE organization_id = $1',
      [organizationId]
    );

    return parseInt(result.rows[0].count, 10);
  }
}

export const userService = new UserService();
