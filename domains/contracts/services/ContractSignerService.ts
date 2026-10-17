import { ContractSigner, SIGNER_ROLES, SIGNER_STATUSES } from '../models/index';
import { ValidationError } from '../../platform/errors/errors';

export class ContractSignerService {
  async addSigner(organizationId: string, contractId: string, data: Partial<ContractSigner>, userId: string): Promise<ContractSigner> {
    if (!organizationId || !contractId) {
      throw new ValidationError('Organization ID and contract ID are required');
    }
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Signer name is required');
    }
    if (!data.email || !this.isValidEmail(data.email)) {
      throw new ValidationError('Valid email is required');
    }
    if (!data.role || !SIGNER_ROLES.includes(data.role)) {
      throw new ValidationError('Valid role is required');
    }

    const signatureTokenId = this.generateSignatureToken();
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 30);

    const signer: ContractSigner = {
      id: `signer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      contractId,
      name: data.name,
      email: data.email,
      role: data.role,
      signatureType: data.signatureType || 'esignature',
      status: 'pending',
      signatureTokenId,
      tokenExpiresAt,
      metadata: data.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock storage - in production would use database
    return signer;
  }

  async getSignerById(organizationId: string, signerId: string): Promise<ContractSigner | null> {
    if (!organizationId || !signerId) {
      return null;
    }
    // Mock storage - in production would query database with org isolation
    return null;
  }

  async getContractSigners(organizationId: string, contractId: string, limit: number = 50, offset: number = 0): Promise<{ items: ContractSigner[]; total: number }> {
    if (!organizationId || !contractId) {
      throw new ValidationError('Organization ID and contract ID are required');
    }
    // Mock storage - in production would query database with org isolation
    return { items: [], total: 0 };
  }

  async getSignersByStatus(organizationId: string, contractId: string, status: string, limit: number = 50, offset: number = 0): Promise<{ items: ContractSigner[]; total: number }> {
    if (!organizationId || !contractId) {
      throw new ValidationError('Organization ID and contract ID are required');
    }
    if (!SIGNER_STATUSES.includes(status as any)) {
      throw new ValidationError('Invalid status');
    }
    // Mock storage - in production would query database
    return { items: [], total: 0 };
  }

  async signContract(organizationId: string, signerId: string, signatureToken: string, signatureData: Record<string, any>): Promise<ContractSigner> {
    if (!organizationId || !signerId) {
      throw new ValidationError('Organization ID and signer ID are required');
    }
    if (!signatureToken || signatureToken.trim().length === 0) {
      throw new ValidationError('Signature token is required');
    }

    const signer = await this.getSignerById(organizationId, signerId);
    if (!signer) {
      throw new ValidationError('Signer not found');
    }

    if (signer.signatureTokenId !== signatureToken) {
      throw new ValidationError('Invalid signature token');
    }

    if (signer.tokenExpiresAt && new Date() > signer.tokenExpiresAt) {
      throw new ValidationError('Signature token has expired');
    }

    if (signer.status !== 'pending') {
      throw new ValidationError('Signer has already signed or declined');
    }

    signer.status = 'signed';
    signer.signedAt = new Date();
    signer.signatureData = signatureData;
    signer.signatureTokenId = undefined;
    signer.tokenExpiresAt = undefined;
    signer.updatedAt = new Date();

    // Mock storage - in production would update database
    return signer;
  }

  async declineSignature(organizationId: string, signerId: string, signatureToken: string, reason: string): Promise<ContractSigner> {
    if (!organizationId || !signerId) {
      throw new ValidationError('Organization ID and signer ID are required');
    }
    if (!signatureToken || signatureToken.trim().length === 0) {
      throw new ValidationError('Signature token is required');
    }
    if (!reason || reason.trim().length === 0) {
      throw new ValidationError('Decline reason is required');
    }

    const signer = await this.getSignerById(organizationId, signerId);
    if (!signer) {
      throw new ValidationError('Signer not found');
    }

    if (signer.signatureTokenId !== signatureToken) {
      throw new ValidationError('Invalid signature token');
    }

    if (signer.status !== 'pending') {
      throw new ValidationError('Signer cannot decline - not pending');
    }

    signer.status = 'declined';
    signer.metadata.declineReason = reason;
    signer.metadata.declinedAt = new Date();
    signer.signatureTokenId = undefined;
    signer.tokenExpiresAt = undefined;
    signer.updatedAt = new Date();

    // Mock storage - in production would update database
    return signer;
  }

  async updateSigner(organizationId: string, signerId: string, data: Partial<ContractSigner>): Promise<ContractSigner> {
    if (!organizationId || !signerId) {
      throw new ValidationError('Organization ID and signer ID are required');
    }

    const signer = await this.getSignerById(organizationId, signerId);
    if (!signer) {
      throw new ValidationError('Signer not found');
    }

    if (signer.status !== 'pending') {
      throw new ValidationError('Only pending signers can be updated');
    }

    if (data.email !== undefined) {
      if (!this.isValidEmail(data.email)) {
        throw new ValidationError('Valid email is required');
      }
      signer.email = data.email;
    }

    if (data.name !== undefined) {
      if (data.name.trim().length === 0) {
        throw new ValidationError('Signer name cannot be empty');
      }
      signer.name = data.name;
    }

    if (data.role !== undefined) {
      if (!SIGNER_ROLES.includes(data.role)) {
        throw new ValidationError('Invalid role');
      }
      signer.role = data.role;
    }

    if (data.metadata !== undefined) {
      signer.metadata = { ...signer.metadata, ...data.metadata };
    }

    signer.updatedAt = new Date();

    // Mock storage - in production would update database
    return signer;
  }

  async deleteSigner(organizationId: string, signerId: string): Promise<void> {
    if (!organizationId || !signerId) {
      throw new ValidationError('Organization ID and signer ID are required');
    }

    const signer = await this.getSignerById(organizationId, signerId);
    if (!signer) {
      throw new ValidationError('Signer not found');
    }

    if (signer.status !== 'pending') {
      throw new ValidationError('Only pending signers can be deleted');
    }

    // Mock storage - in production would delete from database
  }

  async resendSignatureRequest(organizationId: string, signerId: string): Promise<ContractSigner> {
    if (!organizationId || !signerId) {
      throw new ValidationError('Organization ID and signer ID are required');
    }

    const signer = await this.getSignerById(organizationId, signerId);
    if (!signer) {
      throw new ValidationError('Signer not found');
    }

    if (signer.status !== 'pending') {
      throw new ValidationError('Only pending signers can receive resend');
    }

    const signatureTokenId = this.generateSignatureToken();
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 30);

    signer.signatureTokenId = signatureTokenId;
    signer.tokenExpiresAt = tokenExpiresAt;
    signer.updatedAt = new Date();
    signer.metadata.lastResendAt = new Date();

    // Mock storage - in production would update database
    return signer;
  }

  async getPendingSigners(organizationId: string, contractId: string): Promise<ContractSigner[]> {
    if (!organizationId || !contractId) {
      throw new ValidationError('Organization ID and contract ID are required');
    }
    // Mock storage - in production would query database where status = 'pending'
    return [];
  }

  async getExpiredSignatureTokens(organizationId: string, contractId: string): Promise<ContractSigner[]> {
    if (!organizationId || !contractId) {
      throw new ValidationError('Organization ID and contract ID are required');
    }
    // Mock storage - in production would query database where tokenExpiresAt < now()
    return [];
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private generateSignatureToken(): string {
    return `sigtoken_${Date.now()}_${Math.random().toString(36).substr(2, 32)}`;
  }
}

export const contractSignerService = new ContractSignerService();
