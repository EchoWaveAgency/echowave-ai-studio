import { Contract, CONTRACT_CATEGORIES, CONTRACT_STATUSES } from '../models/index';
import { ValidationError } from '../../platform/errors/errors';

export class ContractService {
  async createContract(organizationId: string, data: Partial<Contract>, userId: string): Promise<Contract> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    if (!data.templateId) {
      throw new ValidationError('Template ID is required');
    }
    if (!data.title || data.title.trim().length === 0) {
      throw new ValidationError('Contract title is required');
    }
    if (!data.category || !CONTRACT_CATEGORIES.includes(data.category)) {
      throw new ValidationError('Valid category is required');
    }
    if (!data.parties || data.parties.length === 0) {
      throw new ValidationError('At least one party is required');
    }
    if (!data.content || data.content.trim().length === 0) {
      throw new ValidationError('Contract content is required');
    }

    const contractNumber = await this.generateContractNumber(organizationId);

    const contract: Contract = {
      id: `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      templateId: data.templateId,
      contractNumber,
      title: data.title,
      content: data.content,
      parties: data.parties,
      variables: data.variables || {},
      status: 'draft',
      category: data.category,
      startDate: data.startDate,
      endDate: data.endDate,
      renewalDate: data.renewalDate,
      autoRenew: data.autoRenew || false,
      relatedToSubscriptionId: data.relatedToSubscriptionId,
      relatedToProposalId: data.relatedToProposalId,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: data.metadata || {},
    };

    // Mock storage - in production would use database
    return contract;
  }

  async getContractById(organizationId: string, contractId: string): Promise<Contract | null> {
    if (!organizationId || !contractId) {
      return null;
    }
    // Mock storage - in production would query database with org isolation
    return null;
  }

  async getContractByNumber(organizationId: string, contractNumber: string): Promise<Contract | null> {
    if (!organizationId || !contractNumber) {
      return null;
    }
    // Mock storage - in production would query database with org isolation
    return null;
  }

  async getOrganizationContracts(organizationId: string, limit: number = 50, offset: number = 0): Promise<{ items: Contract[]; total: number }> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    // Mock storage - in production would query database with org isolation
    return { items: [], total: 0 };
  }

  async getContractsByStatus(organizationId: string, status: string, limit: number = 50, offset: number = 0): Promise<{ items: Contract[]; total: number }> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    if (!CONTRACT_STATUSES.includes(status as any)) {
      throw new ValidationError('Invalid status');
    }
    // Mock storage - in production would query database
    return { items: [], total: 0 };
  }

  async getContractsByCategory(organizationId: string, category: string, limit: number = 50, offset: number = 0): Promise<{ items: Contract[]; total: number }> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    if (!CONTRACT_CATEGORIES.includes(category as any)) {
      throw new ValidationError('Invalid category');
    }
    // Mock storage - in production would query database
    return { items: [], total: 0 };
  }

  async updateContract(organizationId: string, contractId: string, data: Partial<Contract>): Promise<Contract> {
    if (!organizationId || !contractId) {
      throw new ValidationError('Organization ID and contract ID are required');
    }

    const contract = await this.getContractById(organizationId, contractId);
    if (!contract) {
      throw new ValidationError('Contract not found');
    }

    if (contract.status !== 'draft') {
      throw new ValidationError('Only draft contracts can be updated');
    }

    if (data.title !== undefined) {
      if (data.title.trim().length === 0) {
        throw new ValidationError('Contract title cannot be empty');
      }
      contract.title = data.title;
    }

    if (data.content !== undefined) {
      if (data.content.trim().length === 0) {
        throw new ValidationError('Contract content cannot be empty');
      }
      contract.content = data.content;
    }

    if (data.parties !== undefined) {
      if (data.parties.length === 0) {
        throw new ValidationError('At least one party is required');
      }
      contract.parties = data.parties;
    }

    if (data.variables !== undefined) {
      contract.variables = data.variables;
    }

    if (data.startDate !== undefined) {
      contract.startDate = data.startDate;
    }

    if (data.endDate !== undefined) {
      contract.endDate = data.endDate;
    }

    if (data.metadata !== undefined) {
      contract.metadata = { ...contract.metadata, ...data.metadata };
    }

    contract.updatedAt = new Date();

    // Mock storage - in production would update database
    return contract;
  }

  async sendForReview(organizationId: string, contractId: string): Promise<Contract> {
    if (!organizationId || !contractId) {
      throw new ValidationError('Organization ID and contract ID are required');
    }

    const contract = await this.getContractById(organizationId, contractId);
    if (!contract) {
      throw new ValidationError('Contract not found');
    }

    if (contract.status !== 'draft') {
      throw new ValidationError('Only draft contracts can be sent for review');
    }

    contract.status = 'pending_review';
    contract.updatedAt = new Date();

    // Mock storage - in production would update database
    return contract;
  }

  async sendForSignature(organizationId: string, contractId: string): Promise<Contract> {
    if (!organizationId || !contractId) {
      throw new ValidationError('Organization ID and contract ID are required');
    }

    const contract = await this.getContractById(organizationId, contractId);
    if (!contract) {
      throw new ValidationError('Contract not found');
    }

    if (!['draft', 'pending_review'].includes(contract.status)) {
      throw new ValidationError('Only draft or pending review contracts can be sent for signature');
    }

    contract.status = 'pending_signature';
    contract.updatedAt = new Date();

    // Mock storage - in production would update database
    return contract;
  }

  async markAsSigned(organizationId: string, contractId: string): Promise<Contract> {
    if (!organizationId || !contractId) {
      throw new ValidationError('Organization ID and contract ID are required');
    }

    const contract = await this.getContractById(organizationId, contractId);
    if (!contract) {
      throw new ValidationError('Contract not found');
    }

    if (contract.status !== 'pending_signature') {
      throw new ValidationError('Only contracts pending signature can be marked as signed');
    }

    contract.status = 'signed';
    contract.updatedAt = new Date();

    // Mock storage - in production would update database
    return contract;
  }

  async terminateContract(organizationId: string, contractId: string, reason: string): Promise<Contract> {
    if (!organizationId || !contractId) {
      throw new ValidationError('Organization ID and contract ID are required');
    }
    if (!reason || reason.trim().length === 0) {
      throw new ValidationError('Termination reason is required');
    }

    const contract = await this.getContractById(organizationId, contractId);
    if (!contract) {
      throw new ValidationError('Contract not found');
    }

    if (contract.status === 'terminated') {
      throw new ValidationError('Contract is already terminated');
    }

    contract.status = 'terminated';
    contract.metadata.terminationReason = reason;
    contract.metadata.terminatedAt = new Date();
    contract.updatedAt = new Date();

    // Mock storage - in production would update database
    return contract;
  }

  async archiveContract(organizationId: string, contractId: string): Promise<Contract> {
    if (!organizationId || !contractId) {
      throw new ValidationError('Organization ID and contract ID are required');
    }

    const contract = await this.getContractById(organizationId, contractId);
    if (!contract) {
      throw new ValidationError('Contract not found');
    }

    contract.status = 'archived';
    contract.updatedAt = new Date();

    // Mock storage - in production would update database
    return contract;
  }

  async getExpiredContracts(organizationId: string, limit: number = 50, offset: number = 0): Promise<{ items: Contract[]; total: number }> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    // Mock storage - in production would query database where endDate < now()
    return { items: [], total: 0 };
  }

  async getRenewableContracts(organizationId: string, limit: number = 50, offset: number = 0): Promise<{ items: Contract[]; total: number }> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    // Mock storage - in production would query database where autoRenew = true and renewalDate <= now()
    return { items: [], total: 0 };
  }

  private async generateContractNumber(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const orgCode = organizationId.substring(0, 4).toUpperCase();
    const sequence = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `CNT-${year}-${orgCode}-${sequence}`;
  }
}

export const contractService = new ContractService();
