import { ContractVersion } from '../models/index';
import { ValidationError } from '../../platform/errors/errors';

export class ContractVersionService {
  async createVersion(organizationId: string, contractId: string, data: Partial<ContractVersion>, userId: string): Promise<ContractVersion> {
    if (!organizationId || !contractId) {
      throw new ValidationError('Organization ID and contract ID are required');
    }
    if (!data.content || data.content.trim().length === 0) {
      throw new ValidationError('Version content is required');
    }

    const version: ContractVersion = {
      id: `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      contractId,
      version: data.version || 1,
      content: data.content,
      changes: data.changes || 'Initial version',
      createdBy: userId,
      createdAt: new Date(),
      metadata: data.metadata || {},
    };

    // Mock storage - in production would use database
    return version;
  }

  async getVersionById(organizationId: string, versionId: string): Promise<ContractVersion | null> {
    if (!organizationId || !versionId) {
      return null;
    }
    // Mock storage - in production would query database with org isolation
    return null;
  }

  async getContractVersions(organizationId: string, contractId: string, limit: number = 50, offset: number = 0): Promise<{ items: ContractVersion[]; total: number }> {
    if (!organizationId || !contractId) {
      throw new ValidationError('Organization ID and contract ID are required');
    }
    // Mock storage - in production would query database with org isolation
    return { items: [], total: 0 };
  }

  async getVersionByNumber(organizationId: string, contractId: string, version: number): Promise<ContractVersion | null> {
    if (!organizationId || !contractId || version < 1) {
      return null;
    }
    // Mock storage - in production would query database
    return null;
  }

  async getLatestVersion(organizationId: string, contractId: string): Promise<ContractVersion | null> {
    if (!organizationId || !contractId) {
      return null;
    }
    // Mock storage - in production would query database order by version DESC limit 1
    return null;
  }

  async compareVersions(organizationId: string, contractId: string, version1: number, version2: number): Promise<{ v1: ContractVersion; v2: ContractVersion; differences: string[] } | null> {
    if (!organizationId || !contractId || version1 < 1 || version2 < 1) {
      return null;
    }

    const v1 = await this.getVersionByNumber(organizationId, contractId, version1);
    const v2 = await this.getVersionByNumber(organizationId, contractId, version2);

    if (!v1 || !v2) {
      return null;
    }

    const differences = this.calculateDifferences(v1.content, v2.content);

    return { v1, v2, differences };
  }

  async restoreVersion(organizationId: string, contractId: string, versionNumber: number, userId: string): Promise<ContractVersion> {
    if (!organizationId || !contractId || versionNumber < 1) {
      throw new ValidationError('Organization ID, contract ID, and version number are required');
    }

    const version = await this.getVersionByNumber(organizationId, contractId, versionNumber);
    if (!version) {
      throw new ValidationError('Version not found');
    }

    const restoredVersion: ContractVersion = {
      id: `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      contractId,
      version: versionNumber + 1,
      content: version.content,
      changes: `Restored from version ${versionNumber}`,
      createdBy: userId,
      createdAt: new Date(),
      metadata: {
        ...version.metadata,
        restoredFrom: versionNumber,
        restoredAt: new Date(),
      },
    };

    // Mock storage - in production would use database
    return restoredVersion;
  }

  async deleteVersion(organizationId: string, versionId: string): Promise<void> {
    if (!organizationId || !versionId) {
      throw new ValidationError('Organization ID and version ID are required');
    }

    const version = await this.getVersionById(organizationId, versionId);
    if (!version) {
      throw new ValidationError('Version not found');
    }

    // Mock storage - in production would delete from database
  }

  async getVersionHistory(organizationId: string, contractId: string): Promise<ContractVersion[]> {
    if (!organizationId || !contractId) {
      throw new ValidationError('Organization ID and contract ID are required');
    }
    // Mock storage - in production would query database order by version DESC
    return [];
  }

  private calculateDifferences(content1: string, content2: string): string[] {
    const lines1 = content1.split('\n');
    const lines2 = content2.split('\n');
    const differences: string[] = [];

    const maxLines = Math.max(lines1.length, lines2.length);
    for (let i = 0; i < maxLines; i++) {
      if (lines1[i] !== lines2[i]) {
        differences.push(`Line ${i + 1}: "${lines1[i] || ''}".trim() !== "${lines2[i] || ''}".trim()`);
      }
    }

    return differences;
  }
}

export const contractVersionService = new ContractVersionService();
