// Organization Service — Identity Domain
// Manages organization creation and tenant isolation

import { query, transaction } from '../../../platform/database/connection';
import {
  Organization,
  OrganizationCreateInput,
} from '../models';
import { NotFoundError, ConflictError } from '../../../platform/errors/errors';
import { defaultLogger } from '../../../platform/logging/logger';
import { validateSlug } from '../../../platform/utils/validation';

export class OrganizationService {
  /**
   * Create a new organization
   */
  async createOrganization(input: OrganizationCreateInput): Promise<Organization> {
    // Validate slug
    if (!validateSlug(input.slug)) {
      throw new Error('Invalid organization slug format');
    }

    // Check slug uniqueness
    const existingResult = await query('SELECT id FROM organizations WHERE slug = $1', [input.slug]);
    if (existingResult.rows.length > 0) {
      throw new ConflictError('Organization with this slug already exists', { slug: input.slug });
    }

    const org = await transaction(async (client) => {
      const result = await client.query(
        `INSERT INTO organizations (name, slug, country, currency)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [input.name, input.slug, input.country || 'EG', input.currency || 'EGP']
      );

      return result.rows[0];
    });

    defaultLogger.info(`Organization created: ${org.id}`, {
      name: org.name,
      slug: org.slug,
    });

    return org;
  }

  /**
   * Get organization by ID
   */
  async getOrgById(orgId: string): Promise<Organization> {
    const result = await query('SELECT * FROM organizations WHERE id = $1', [orgId]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Organization', orgId);
    }

    return result.rows[0];
  }

  /**
   * Get organization by slug
   */
  async getOrgBySlug(slug: string): Promise<Organization> {
    const result = await query('SELECT * FROM organizations WHERE slug = $1', [slug]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Organization', slug);
    }

    return result.rows[0];
  }

  /**
   * Update organization
   */
  async updateOrganization(
    orgId: string,
    updates: Partial<Pick<Organization, 'name' | 'currency'>>
  ): Promise<Organization> {
    const updateClauses = [];
    const params = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (['name', 'currency'].includes(key) && value !== undefined) {
        const colName = key;
        updateClauses.push(`${colName} = $${paramIndex++}`);
        params.push(value);
      }
    }

    if (updateClauses.length === 0) {
      return this.getOrgById(orgId);
    }

    params.push(orgId);

    const result = await query(
      `UPDATE organizations
       SET ${updateClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex++}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Organization', orgId);
    }

    return result.rows[0];
  }

  /**
   * Get organization settings/metadata
   */
  async getOrgMetadata(orgId: string): Promise<{
    userCount: number;
    roleCount: number;
  }> {
    const userCount = await query(
      'SELECT COUNT(*) as count FROM users WHERE organization_id = $1',
      [orgId]
    );

    const roleCount = await query(
      'SELECT COUNT(*) as count FROM user_roles WHERE organization_id = $1',
      [orgId]
    );

    return {
      userCount: parseInt(userCount.rows[0].count, 10),
      roleCount: parseInt(roleCount.rows[0].count, 10),
    };
  }

  /**
   * Verify organization exists (for internal checks)
   */
  async orgExists(orgId: string): Promise<boolean> {
    const result = await query('SELECT 1 FROM organizations WHERE id = $1', [orgId]);
    return result.rows.length > 0;
  }
}

export const organizationService = new OrganizationService();
