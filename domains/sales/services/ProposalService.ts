// ProposalService: Business logic for proposal management

import { query, transaction } from '../../../platform/database/connection';
import { ValidationError, NotFoundError } from '../../../platform/errors/errors';
import { defaultLogger } from '../../../platform/logging/logger';
import {
  Proposal,
  ProposalLineItem,
  ProposalCreateInput,
  ProposalUpdateInput,
  PROPOSAL_STATUSES,
} from '../models/index';

export class ProposalService {
  async createProposal(
    organizationId: string,
    input: ProposalCreateInput,
    userId: string
  ): Promise<Proposal> {
    // Validate input
    if (!input.clientId || input.clientId.trim() === '') {
      throw new ValidationError('Client ID is required', { clientId: 'required' });
    }

    if (!input.title || input.title.trim() === '') {
      throw new ValidationError('Title is required', { title: 'required' });
    }

    if (!input.lineItems || input.lineItems.length === 0) {
      throw new ValidationError('At least one line item is required', {
        lineItems: 'required',
      });
    }

    if (!input.validUntilDate) {
      throw new ValidationError('Valid until date is required', {
        validUntilDate: 'required',
      });
    }

    const validUntilDate = new Date(input.validUntilDate);
    if (validUntilDate <= new Date()) {
      throw new ValidationError('Valid until date must be in the future', {
        validUntilDate: 'must_be_future',
      });
    }

    // Calculate totals
    let basePrice = 0;
    for (const item of input.lineItems) {
      if (item.quantity <= 0) {
        throw new ValidationError('Quantity must be greater than 0', {
          lineItems: 'invalid_quantity',
        });
      }
      if (item.unitPrice < 0) {
        throw new ValidationError('Unit price cannot be negative', {
          lineItems: 'invalid_price',
        });
      }
      basePrice += item.quantity * item.unitPrice;
    }

    const discount = input.discount || 0;
    const finalPrice = Math.max(0, basePrice - discount);

    return transaction(async () => {
      // Create proposal
      const proposalResult = await query(
        `INSERT INTO proposals (
          id, organization_id, client_id, lead_id, opportunity_id,
          title, description, status, version, base_price, discount,
          final_price, currency, valid_until_date, approval_status,
          is_locked, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        ) RETURNING *`,
        [
          this.generateId(),
          organizationId,
          input.clientId,
          input.leadId || null,
          input.opportunityId || null,
          input.title,
          input.description || null,
          PROPOSAL_STATUSES.DRAFT,
          1,
          basePrice,
          discount || null,
          finalPrice,
          'EGP',
          validUntilDate,
          'pending',
          false,
          new Date(),
          new Date(),
        ]
      );

      const proposal = proposalResult.rows[0];

      // Create line items
      for (let i = 0; i < input.lineItems.length; i++) {
        const item = input.lineItems[i];
        const subtotal = item.quantity * item.unitPrice;

        await query(
          `INSERT INTO proposal_line_items (
            id, proposal_id, organization_id, service_catalog_item_id,
            description, quantity, unit_price, subtotal, line_order,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            this.generateId(),
            proposal.id,
            organizationId,
            item.serviceCatalogItemId || null,
            item.description,
            item.quantity,
            item.unitPrice,
            subtotal,
            i + 1,
            new Date(),
            new Date(),
          ]
        );
      }

      // Log audit trail
      await query(
        `INSERT INTO audit_events (
          id, organization_id, user_id, resource_type, resource_id,
          operation, changes, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          this.generateId(),
          organizationId,
          userId,
          'proposal',
          proposal.id,
          'CREATE',
          JSON.stringify({
            title: input.title,
            basePrice,
            finalPrice,
            status: PROPOSAL_STATUSES.DRAFT,
          }),
          new Date(),
        ]
      );

      return {
        ...proposal,
        discount: discount || null,
      };
    });
  }

  async getProposalById(proposalId: string, organizationId: string): Promise<Proposal> {
    const result = await query(
      `SELECT * FROM proposals
       WHERE id = $1 AND organization_id = $2`,
      [proposalId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Proposal not found');
    }

    return result.rows[0];
  }

  async getOrganizationProposals(
    organizationId: string,
    filters?: { status?: string; clientId?: string },
    limit: number = 50,
    offset: number = 0
  ): Promise<{ proposals: Proposal[]; total: number }> {
    let whereClause = 'WHERE organization_id = $1';
    const params: any[] = [organizationId];

    if (filters?.status) {
      whereClause += ` AND status = $${params.length + 1}`;
      params.push(filters.status);
    }

    if (filters?.clientId) {
      whereClause += ` AND client_id = $${params.length + 1}`;
      params.push(filters.clientId);
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as count FROM proposals ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    const proposalsResult = await query(
      `SELECT * FROM proposals ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return {
      proposals: proposalsResult.rows,
      total,
    };
  }

  async updateProposal(
    proposalId: string,
    organizationId: string,
    input: ProposalUpdateInput,
    userId: string
  ): Promise<Proposal> {
    const proposal = await this.getProposalById(proposalId, organizationId);

    // Check if proposal is locked (client has viewed)
    if (proposal.isLocked) {
      throw new ValidationError('Cannot edit a locked proposal', {
        proposalId: 'is_locked',
      });
    }

    // If not draft, cannot edit
    if (proposal.status !== PROPOSAL_STATUSES.DRAFT) {
      throw new ValidationError('Can only edit draft proposals', {
        status: 'not_draft',
      });
    }

    const updates: string[] = [];
    const updateParams: any[] = [];
    let paramIndex = 1;

    if (input.title) {
      updates.push(`title = $${paramIndex}`);
      updateParams.push(input.title);
      paramIndex++;
    }

    if (input.description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      updateParams.push(input.description || null);
      paramIndex++;
    }

    if (input.validUntilDate) {
      updates.push(`valid_until_date = $${paramIndex}`);
      updateParams.push(new Date(input.validUntilDate));
      paramIndex++;
    }

    if (input.discount !== undefined) {
      updates.push(`discount = $${paramIndex}`);
      updateParams.push(input.discount || null);
      paramIndex++;

      // Recalculate final price
      const newFinalPrice = Math.max(0, proposal.basePrice - (input.discount || 0));
      updates.push(`final_price = $${paramIndex}`);
      updateParams.push(newFinalPrice);
      paramIndex++;
    }

    if (input.notes !== undefined) {
      updates.push(`notes = $${paramIndex}`);
      updateParams.push(input.notes || null);
      paramIndex++;
    }

    if (input.internalNotes !== undefined) {
      updates.push(`internal_notes = $${paramIndex}`);
      updateParams.push(input.internalNotes || null);
      paramIndex++;
    }

    updates.push(`updated_at = $${paramIndex}`);
    updateParams.push(new Date());

    updateParams.push(proposalId);
    updateParams.push(organizationId);

    const result = await query(
      `UPDATE proposals
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex + 1} AND organization_id = $${paramIndex + 2}
       RETURNING *`,
      updateParams
    );

    const updatedProposal = result.rows[0];

    // Audit log
    await query(
      `INSERT INTO audit_events (
        id, organization_id, user_id, resource_type, resource_id,
        operation, changes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        this.generateId(),
        organizationId,
        userId,
        'proposal',
        proposalId,
        'UPDATE',
        JSON.stringify(input),
        new Date(),
      ]
    );

    return updatedProposal;
  }

  async sendProposal(
    proposalId: string,
    organizationId: string,
    userId: string
  ): Promise<Proposal> {
    const proposal = await this.getProposalById(proposalId, organizationId);

    // Only draft proposals can be sent
    if (proposal.status !== PROPOSAL_STATUSES.DRAFT) {
      throw new ValidationError('Can only send draft proposals', {
        status: 'not_draft',
      });
    }

    const result = await query(
      `UPDATE proposals
       SET status = $1, sent_at = $2, updated_at = $3
       WHERE id = $4 AND organization_id = $5
       RETURNING *`,
      [PROPOSAL_STATUSES.SENT, new Date(), new Date(), proposalId, organizationId]
    );

    // Audit log
    await query(
      `INSERT INTO audit_events (
        id, organization_id, user_id, resource_type, resource_id,
        operation, changes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        this.generateId(),
        organizationId,
        userId,
        'proposal',
        proposalId,
        'UPDATE',
        JSON.stringify({ status: PROPOSAL_STATUSES.SENT }),
        new Date(),
      ]
    );

    return result.rows[0];
  }

  async approveProposal(
    proposalId: string,
    organizationId: string,
    userId: string
  ): Promise<Proposal> {
    const proposal = await this.getProposalById(proposalId, organizationId);

    if (proposal.approvalStatus === 'approved') {
      throw new ValidationError('Proposal is already approved', {
        approvalStatus: 'already_approved',
      });
    }

    const result = await query(
      `UPDATE proposals
       SET approval_status = $1, approved_by = $2, approved_at = $3, updated_at = $4
       WHERE id = $5 AND organization_id = $6
       RETURNING *`,
      ['approved', userId, new Date(), new Date(), proposalId, organizationId]
    );

    // Audit log
    await query(
      `INSERT INTO audit_events (
        id, organization_id, user_id, resource_type, resource_id,
        operation, changes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        this.generateId(),
        organizationId,
        userId,
        'proposal',
        proposalId,
        'UPDATE',
        JSON.stringify({ approvalStatus: 'approved' }),
        new Date(),
      ]
    );

    return result.rows[0];
  }

  async getProposalLineItems(proposalId: string, organizationId: string): Promise<ProposalLineItem[]> {
    const result = await query(
      `SELECT * FROM proposal_line_items
       WHERE proposal_id = $1 AND organization_id = $2
       ORDER BY line_order ASC`,
      [proposalId, organizationId]
    );

    return result.rows;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const proposalService = new ProposalService();
