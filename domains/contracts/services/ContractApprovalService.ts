import { ContractApproval, APPROVAL_STATUSES } from '../models/index';
import { ValidationError } from '../../platform/errors/errors';

export class ContractApprovalService {
  async createApprovalRequest(organizationId: string, contractId: string, data: Partial<ContractApproval>, userId: string): Promise<ContractApproval> {
    if (!organizationId || !contractId) {
      throw new ValidationError('Organization ID and contract ID are required');
    }
    if (!data.approverId || data.approverId.trim().length === 0) {
      throw new ValidationError('Approver ID is required');
    }
    if (!data.approverName || data.approverName.trim().length === 0) {
      throw new ValidationError('Approver name is required');
    }
    if (!data.approverEmail || !this.isValidEmail(data.approverEmail)) {
      throw new ValidationError('Valid approver email is required');
    }
    if (data.level === undefined || data.level < 1) {
      throw new ValidationError('Valid approval level is required');
    }
    if (!data.requiredRole || data.requiredRole.trim().length === 0) {
      throw new ValidationError('Required role is required');
    }

    const approvalTokenId = this.generateApprovalToken();
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7);

    const approval: ContractApproval = {
      id: `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      contractId,
      approverId: data.approverId,
      approverName: data.approverName,
      approverEmail: data.approverEmail,
      level: data.level,
      requiredRole: data.requiredRole,
      status: 'pending',
      approvalTokenId,
      tokenExpiresAt,
      metadata: data.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock storage - in production would use database
    return approval;
  }

  async getApprovalById(organizationId: string, approvalId: string): Promise<ContractApproval | null> {
    if (!organizationId || !approvalId) {
      return null;
    }
    // Mock storage - in production would query database with org isolation
    return null;
  }

  async getContractApprovals(organizationId: string, contractId: string, limit: number = 50, offset: number = 0): Promise<{ items: ContractApproval[]; total: number }> {
    if (!organizationId || !contractId) {
      throw new ValidationError('Organization ID and contract ID are required');
    }
    // Mock storage - in production would query database with org isolation
    return { items: [], total: 0 };
  }

  async getApprovalsByStatus(organizationId: string, contractId: string, status: string, limit: number = 50, offset: number = 0): Promise<{ items: ContractApproval[]; total: number }> {
    if (!organizationId || !contractId) {
      throw new ValidationError('Organization ID and contract ID are required');
    }
    if (!APPROVAL_STATUSES.includes(status as any)) {
      throw new ValidationError('Invalid status');
    }
    // Mock storage - in production would query database
    return { items: [], total: 0 };
  }

  async approveContract(organizationId: string, approvalId: string, approvalToken: string, comments?: string): Promise<ContractApproval> {
    if (!organizationId || !approvalId) {
      throw new ValidationError('Organization ID and approval ID are required');
    }
    if (!approvalToken || approvalToken.trim().length === 0) {
      throw new ValidationError('Approval token is required');
    }

    const approval = await this.getApprovalById(organizationId, approvalId);
    if (!approval) {
      throw new ValidationError('Approval request not found');
    }

    if (approval.approvalTokenId !== approvalToken) {
      throw new ValidationError('Invalid approval token');
    }

    if (approval.tokenExpiresAt && new Date() > approval.tokenExpiresAt) {
      throw new ValidationError('Approval token has expired');
    }

    if (approval.status !== 'pending') {
      throw new ValidationError('Approval request has already been processed');
    }

    approval.status = 'approved';
    approval.approvedAt = new Date();
    approval.comments = comments;
    approval.approvalTokenId = undefined;
    approval.tokenExpiresAt = undefined;
    approval.updatedAt = new Date();

    // Mock storage - in production would update database
    return approval;
  }

  async rejectContract(organizationId: string, approvalId: string, approvalToken: string, reason: string): Promise<ContractApproval> {
    if (!organizationId || !approvalId) {
      throw new ValidationError('Organization ID and approval ID are required');
    }
    if (!approvalToken || approvalToken.trim().length === 0) {
      throw new ValidationError('Approval token is required');
    }
    if (!reason || reason.trim().length === 0) {
      throw new ValidationError('Rejection reason is required');
    }

    const approval = await this.getApprovalById(organizationId, approvalId);
    if (!approval) {
      throw new ValidationError('Approval request not found');
    }

    if (approval.approvalTokenId !== approvalToken) {
      throw new ValidationError('Invalid approval token');
    }

    if (approval.status !== 'pending') {
      throw new ValidationError('Approval request has already been processed');
    }

    approval.status = 'rejected';
    approval.rejectedAt = new Date();
    approval.comments = reason;
    approval.approvalTokenId = undefined;
    approval.tokenExpiresAt = undefined;
    approval.updatedAt = new Date();

    // Mock storage - in production would update database
    return approval;
  }

  async escalateApproval(organizationId: string, approvalId: string, escalationReason: string): Promise<ContractApproval> {
    if (!organizationId || !approvalId) {
      throw new ValidationError('Organization ID and approval ID are required');
    }
    if (!escalationReason || escalationReason.trim().length === 0) {
      throw new ValidationError('Escalation reason is required');
    }

    const approval = await this.getApprovalById(organizationId, approvalId);
    if (!approval) {
      throw new ValidationError('Approval request not found');
    }

    if (approval.status !== 'pending') {
      throw new ValidationError('Only pending approvals can be escalated');
    }

    approval.status = 'escalated';
    approval.comments = escalationReason;
    approval.metadata.escalatedAt = new Date();
    approval.updatedAt = new Date();

    // Mock storage - in production would update database
    return approval;
  }

  async getPendingApprovals(organizationId: string, contractId: string): Promise<ContractApproval[]> {
    if (!organizationId || !contractId) {
      throw new ValidationError('Organization ID and contract ID are required');
    }
    // Mock storage - in production would query database where status = 'pending'
    return [];
  }

  async getApprovalsByLevel(organizationId: string, contractId: string, level: number): Promise<ContractApproval[]> {
    if (!organizationId || !contractId) {
      throw new ValidationError('Organization ID and contract ID are required');
    }
    if (level < 1) {
      throw new ValidationError('Level must be 1 or greater');
    }
    // Mock storage - in production would query database where level = $1
    return [];
  }

  async getAllApprovalsComplete(organizationId: string, contractId: string): Promise<boolean> {
    if (!organizationId || !contractId) {
      throw new ValidationError('Organization ID and contract ID are required');
    }
    // Mock storage - in production would check if all approvals are approved or rejected
    return false;
  }

  async resendApprovalRequest(organizationId: string, approvalId: string): Promise<ContractApproval> {
    if (!organizationId || !approvalId) {
      throw new ValidationError('Organization ID and approval ID are required');
    }

    const approval = await this.getApprovalById(organizationId, approvalId);
    if (!approval) {
      throw new ValidationError('Approval request not found');
    }

    if (approval.status !== 'pending') {
      throw new ValidationError('Only pending approvals can be resent');
    }

    const approvalTokenId = this.generateApprovalToken();
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7);

    approval.approvalTokenId = approvalTokenId;
    approval.tokenExpiresAt = tokenExpiresAt;
    approval.updatedAt = new Date();
    approval.metadata.lastResendAt = new Date();

    // Mock storage - in production would update database
    return approval;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private generateApprovalToken(): string {
    return `apptoken_${Date.now()}_${Math.random().toString(36).substr(2, 32)}`;
  }
}

export const contractApprovalService = new ContractApprovalService();
