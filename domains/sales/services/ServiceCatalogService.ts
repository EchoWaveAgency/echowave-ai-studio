// ServiceCatalogService: Manage service offerings

import { query } from '../../../platform/database/connection';
import { ValidationError, NotFoundError } from '../../../platform/errors/errors';
import { defaultLogger } from '../../../platform/logging/logger';
import { ServiceCatalogItem, ServiceCatalogItemCreateInput, SERVICE_CATEGORIES } from '../models/index';

export class ServiceCatalogService {
  async createServiceItem(
    organizationId: string,
    input: ServiceCatalogItemCreateInput,
    userId: string
  ): Promise<ServiceCatalogItem> {
    // Validate input
    if (!input.name || input.name.trim() === '') {
      throw new ValidationError('Name is required', { name: 'required' });
    }

    if (!input.category || !SERVICE_CATEGORIES.includes(input.category as any)) {
      throw new ValidationError('Invalid category', { category: 'invalid' });
    }

    if (input.basePrice < 0) {
      throw new ValidationError('Base price cannot be negative', { basePrice: 'invalid' });
    }

    if (input.deliveryDays <= 0) {
      throw new ValidationError('Delivery days must be greater than 0', {
        deliveryDays: 'invalid',
      });
    }

    const result = await query(
      `INSERT INTO service_catalog_items (
        id, organization_id, name, description, category, base_price,
        currency, delivery_days, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        this.generateId(),
        organizationId,
        input.name,
        input.description || null,
        input.category,
        input.basePrice,
        input.currency || 'EGP',
        input.deliveryDays,
        true,
        new Date(),
        new Date(),
      ]
    );

    defaultLogger.info(`Service catalog item created: ${result.rows[0].id}`, {
      organizationId,
      category: input.category,
      basePrice: input.basePrice,
    });

    return result.rows[0];
  }

  async getServiceItemById(
    itemId: string,
    organizationId: string
  ): Promise<ServiceCatalogItem> {
    const result = await query(
      `SELECT * FROM service_catalog_items
       WHERE id = $1 AND organization_id = $2`,
      [itemId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Service catalog item not found');
    }

    return result.rows[0];
  }

  async getOrganizationServices(
    organizationId: string,
    filters?: { category?: string; isActive?: boolean },
    limit: number = 50,
    offset: number = 0
  ): Promise<{ items: ServiceCatalogItem[]; total: number }> {
    let whereClause = 'WHERE organization_id = $1';
    const params: any[] = [organizationId];

    if (filters?.category) {
      whereClause += ` AND category = $${params.length + 1}`;
      params.push(filters.category);
    }

    if (filters?.isActive !== undefined) {
      whereClause += ` AND is_active = $${params.length + 1}`;
      params.push(filters.isActive);
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as count FROM service_catalog_items ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    const itemsResult = await query(
      `SELECT * FROM service_catalog_items ${whereClause}
       ORDER BY category, name ASC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return {
      items: itemsResult.rows,
      total,
    };
  }

  async updateServiceItem(
    itemId: string,
    organizationId: string,
    input: Partial<ServiceCatalogItemCreateInput>,
    userId: string
  ): Promise<ServiceCatalogItem> {
    // Verify item exists
    await this.getServiceItemById(itemId, organizationId);

    const updates: string[] = [];
    const updateParams: any[] = [];
    let paramIndex = 1;

    if (input.name) {
      updates.push(`name = $${paramIndex}`);
      updateParams.push(input.name);
      paramIndex++;
    }

    if (input.description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      updateParams.push(input.description || null);
      paramIndex++;
    }

    if (input.category) {
      if (!SERVICE_CATEGORIES.includes(input.category as any)) {
        throw new ValidationError('Invalid category', { category: 'invalid' });
      }
      updates.push(`category = $${paramIndex}`);
      updateParams.push(input.category);
      paramIndex++;
    }

    if (input.basePrice !== undefined) {
      if (input.basePrice < 0) {
        throw new ValidationError('Base price cannot be negative', { basePrice: 'invalid' });
      }
      updates.push(`base_price = $${paramIndex}`);
      updateParams.push(input.basePrice);
      paramIndex++;
    }

    if (input.deliveryDays !== undefined) {
      if (input.deliveryDays <= 0) {
        throw new ValidationError('Delivery days must be greater than 0', {
          deliveryDays: 'invalid',
        });
      }
      updates.push(`delivery_days = $${paramIndex}`);
      updateParams.push(input.deliveryDays);
      paramIndex++;
    }

    updates.push(`updated_at = $${paramIndex}`);
    updateParams.push(new Date());

    updateParams.push(itemId);
    updateParams.push(organizationId);

    const result = await query(
      `UPDATE service_catalog_items
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex + 1} AND organization_id = $${paramIndex + 2}
       RETURNING *`,
      updateParams
    );

    defaultLogger.info(`Service catalog item updated: ${itemId}`, {
      organizationId,
      changes: input,
    });

    return result.rows[0];
  }

  async toggleActive(
    itemId: string,
    organizationId: string,
    isActive: boolean,
    userId: string
  ): Promise<ServiceCatalogItem> {
    const result = await query(
      `UPDATE service_catalog_items
       SET is_active = $1, updated_at = $2
       WHERE id = $3 AND organization_id = $4
       RETURNING *`,
      [isActive, new Date(), itemId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Service catalog item not found');
    }

    defaultLogger.info(`Service catalog item ${isActive ? 'activated' : 'deactivated'}: ${itemId}`, {
      organizationId,
    });

    return result.rows[0];
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const serviceCatalogService = new ServiceCatalogService();
