import { ContractTemplate, CONTRACT_CATEGORIES } from '../models/index';
import { ValidationError } from '../../platform/errors/errors';

export class ContractTemplateService {
  async createTemplate(organizationId: string, data: Partial<ContractTemplate>, userId: string): Promise<ContractTemplate> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Template name is required');
    }
    if (!data.category || !CONTRACT_CATEGORIES.includes(data.category)) {
      throw new ValidationError('Valid category is required');
    }
    if (!data.content || data.content.trim().length === 0) {
      throw new ValidationError('Template content is required');
    }

    const variables = this.extractVariables(data.content);

    const template: ContractTemplate = {
      id: `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      name: data.name,
      category: data.category,
      description: data.description || '',
      content: data.content,
      variables,
      createdBy: userId,
      status: 'draft',
      version: 1,
      tags: data.tags || [],
      metadata: data.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock storage - in production would use database
    return template;
  }

  async getTemplateById(organizationId: string, templateId: string): Promise<ContractTemplate | null> {
    if (!organizationId || !templateId) {
      return null;
    }
    // Mock storage - in production would query database with org isolation
    return null;
  }

  async getOrganizationTemplates(organizationId: string, limit: number = 50, offset: number = 0): Promise<{ items: ContractTemplate[]; total: number }> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    // Mock storage - in production would query database with org isolation
    return { items: [], total: 0 };
  }

  async getTemplatesByCategory(organizationId: string, category: string, limit: number = 50, offset: number = 0): Promise<{ items: ContractTemplate[]; total: number }> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    if (!CONTRACT_CATEGORIES.includes(category as any)) {
      throw new ValidationError('Invalid category');
    }
    // Mock storage - in production would query database
    return { items: [], total: 0 };
  }

  async updateTemplate(organizationId: string, templateId: string, data: Partial<ContractTemplate>): Promise<ContractTemplate> {
    if (!organizationId || !templateId) {
      throw new ValidationError('Organization ID and template ID are required');
    }

    const template = await this.getTemplateById(organizationId, templateId);
    if (!template) {
      throw new ValidationError('Template not found');
    }

    if (data.name !== undefined) {
      if (data.name.trim().length === 0) {
        throw new ValidationError('Template name cannot be empty');
      }
      template.name = data.name;
    }

    if (data.description !== undefined) {
      template.description = data.description;
    }

    if (data.content !== undefined) {
      if (data.content.trim().length === 0) {
        throw new ValidationError('Template content cannot be empty');
      }
      template.content = data.content;
      template.variables = this.extractVariables(data.content);
    }

    if (data.tags !== undefined) {
      template.tags = data.tags;
    }

    if (data.metadata !== undefined) {
      template.metadata = { ...template.metadata, ...data.metadata };
    }

    template.updatedAt = new Date();
    template.version += 1;

    // Mock storage - in production would update database
    return template;
  }

  async activateTemplate(organizationId: string, templateId: string): Promise<ContractTemplate> {
    if (!organizationId || !templateId) {
      throw new ValidationError('Organization ID and template ID are required');
    }

    const template = await this.getTemplateById(organizationId, templateId);
    if (!template) {
      throw new ValidationError('Template not found');
    }

    if (template.status === 'active') {
      throw new ValidationError('Template is already active');
    }

    template.status = 'active';
    template.updatedAt = new Date();

    // Mock storage - in production would update database
    return template;
  }

  async archiveTemplate(organizationId: string, templateId: string): Promise<ContractTemplate> {
    if (!organizationId || !templateId) {
      throw new ValidationError('Organization ID and template ID are required');
    }

    const template = await this.getTemplateById(organizationId, templateId);
    if (!template) {
      throw new ValidationError('Template not found');
    }

    if (template.status === 'archived') {
      throw new ValidationError('Template is already archived');
    }

    template.status = 'archived';
    template.updatedAt = new Date();

    // Mock storage - in production would update database
    return template;
  }

  async deleteTemplate(organizationId: string, templateId: string): Promise<void> {
    if (!organizationId || !templateId) {
      throw new ValidationError('Organization ID and template ID are required');
    }

    const template = await this.getTemplateById(organizationId, templateId);
    if (!template) {
      throw new ValidationError('Template not found');
    }

    // Mock storage - in production would delete from database
  }

  async getActiveTemplates(organizationId: string, limit: number = 50, offset: number = 0): Promise<{ items: ContractTemplate[]; total: number }> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    // Mock storage - in production would query database where status = 'active'
    return { items: [], total: 0 };
  }

  private extractVariables(content: string): string[] {
    const regex = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = regex.exec(content)) !== null) {
      variables.add(match[1]);
    }

    return Array.from(variables);
  }
}

export const contractTemplateService = new ContractTemplateService();
