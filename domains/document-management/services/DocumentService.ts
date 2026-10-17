import { v4 as uuidv4 } from 'uuid';
import {
  Document,
  DocumentVersion,
  DocumentType,
  DocumentStatus,
  DocumentTemplate,
  DocumentAccessLog,
} from '../models';

export class DocumentService {
  private documentStorage = new Map<string, Document>();
  private versionStorage = new Map<string, DocumentVersion[]>();
  private templateStorage = new Map<string, DocumentTemplate>();
  private accessLogStorage = new Map<string, DocumentAccessLog>();

  createDocument(
    organizationId: string,
    documentName: string,
    documentType: DocumentType,
    fileUrl: string,
    fileHash: string,
    createdBy: string,
    description?: string,
    templateId?: string,
    metadata?: Record<string, any>
  ): Document {
    if (!documentName || documentName.trim().length === 0) {
      throw new Error('Document name is required');
    }

    const documentId = uuidv4();
    const version: DocumentVersion = {
      id: uuidv4(),
      versionNumber: 1,
      createdAt: new Date(),
      createdBy,
      summary: 'Initial version',
      fileUrl,
      fileHash,
      changeLog: 'Document created',
      isCurrentVersion: true,
    };

    const document: Document = {
      id: documentId,
      organizationId,
      documentName,
      documentType,
      status: DocumentStatus.DRAFT,
      description: description || '',
      currentVersion: version,
      signatories: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
      templateId,
      metadata: metadata || {},
    };

    this.documentStorage.set(documentId, document);
    this.versionStorage.set(documentId, [version]);

    return document;
  }

  getDocumentById(organizationId: string, documentId: string): Document | null {
    const document = this.documentStorage.get(documentId);
    if (!document || document.organizationId !== organizationId) {
      return null;
    }
    return document;
  }

  getOrganizationDocuments(
    organizationId: string,
    documentType?: DocumentType,
    status?: DocumentStatus,
    limit: number = 20,
    offset: number = 0
  ): Document[] {
    let documents = Array.from(this.documentStorage.values()).filter(
      (doc) => doc.organizationId === organizationId
    );

    if (documentType) {
      documents = documents.filter((doc) => doc.documentType === documentType);
    }

    if (status) {
      documents = documents.filter((doc) => doc.status === status);
    }

    return documents
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  updateDocumentStatus(
    organizationId: string,
    documentId: string,
    newStatus: DocumentStatus
  ): Document | null {
    const document = this.documentStorage.get(documentId);
    if (!document || document.organizationId !== organizationId) {
      return null;
    }

    document.status = newStatus;
    document.updatedAt = new Date();
    this.documentStorage.set(documentId, document);

    return document;
  }

  createDocumentVersion(
    organizationId: string,
    documentId: string,
    fileUrl: string,
    fileHash: string,
    createdBy: string,
    changeLog: string,
    summary: string
  ): DocumentVersion | null {
    const document = this.documentStorage.get(documentId);
    if (!document || document.organizationId !== organizationId) {
      return null;
    }

    const versions = this.versionStorage.get(documentId) || [];
    const maxVersion = Math.max(...versions.map((v) => v.versionNumber), 0);

    const newVersion: DocumentVersion = {
      id: uuidv4(),
      versionNumber: maxVersion + 1,
      createdAt: new Date(),
      createdBy,
      summary,
      fileUrl,
      fileHash,
      changeLog,
      isCurrentVersion: true,
    };

    versions.forEach((v) => (v.isCurrentVersion = false));
    versions.push(newVersion);

    this.versionStorage.set(documentId, versions);
    document.currentVersion = newVersion;
    document.updatedAt = new Date();
    this.documentStorage.set(documentId, document);

    return newVersion;
  }

  getDocumentVersions(
    organizationId: string,
    documentId: string
  ): DocumentVersion[] {
    const document = this.documentStorage.get(documentId);
    if (!document || document.organizationId !== organizationId) {
      return [];
    }

    return this.versionStorage.get(documentId) || [];
  }

  revertToVersion(
    organizationId: string,
    documentId: string,
    versionNumber: number,
    revertedBy: string
  ): DocumentVersion | null {
    const document = this.documentStorage.get(documentId);
    if (!document || document.organizationId !== organizationId) {
      return null;
    }

    const versions = this.versionStorage.get(documentId) || [];
    const targetVersion = versions.find((v) => v.versionNumber === versionNumber);

    if (!targetVersion) {
      return null;
    }

    const revertedVersion: DocumentVersion = {
      ...targetVersion,
      id: uuidv4(),
      versionNumber: Math.max(...versions.map((v) => v.versionNumber)) + 1,
      createdAt: new Date(),
      createdBy: revertedBy,
      changeLog: `Reverted to version ${versionNumber}`,
      isCurrentVersion: true,
    };

    versions.forEach((v) => (v.isCurrentVersion = false));
    versions.push(revertedVersion);

    this.versionStorage.set(documentId, versions);
    document.currentVersion = revertedVersion;
    document.updatedAt = new Date();
    this.documentStorage.set(documentId, document);

    return revertedVersion;
  }

  createTemplate(
    organizationId: string,
    templateName: string,
    documentType: DocumentType,
    content: string,
    variables: string[],
    defaultSignatories: Array<{ role: string; signingOrder: number }>
  ): DocumentTemplate {
    const templateId = uuidv4();
    const template: DocumentTemplate = {
      id: templateId,
      organizationId,
      templateName,
      documentType,
      content,
      variables,
      defaultSignatories,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      version: 1,
    };

    this.templateStorage.set(templateId, template);
    return template;
  }

  getTemplateById(organizationId: string, templateId: string): DocumentTemplate | null {
    const template = this.templateStorage.get(templateId);
    if (!template || template.organizationId !== organizationId) {
      return null;
    }
    return template;
  }

  getOrganizationTemplates(
    organizationId: string,
    documentType?: DocumentType,
    limit: number = 20,
    offset: number = 0
  ): DocumentTemplate[] {
    let templates = Array.from(this.templateStorage.values())
      .filter((t) => t.organizationId === organizationId && t.isActive);

    if (documentType) {
      templates = templates.filter((t) => t.documentType === documentType);
    }

    return templates
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(offset, offset + limit);
  }

  createDocumentFromTemplate(
    organizationId: string,
    templateId: string,
    documentName: string,
    variables: Record<string, string>,
    createdBy: string
  ): Document | null {
    const template = this.templateStorage.get(templateId);
    if (!template || template.organizationId !== organizationId) {
      return null;
    }

    let content = template.content;
    Object.entries(variables).forEach(([key, value]) => {
      content = content.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
    });

    const document = this.createDocument(
      organizationId,
      documentName,
      template.documentType,
      `template-${templateId}-${uuidv4()}`,
      this.hashContent(content),
      createdBy,
      `Created from template: ${template.templateName}`,
      templateId
    );

    return document;
  }

  recordAccessLog(
    documentId: string,
    accessedBy: string,
    accessType: 'view' | 'download' | 'sign' | 'export' | 'share',
    ipAddress: string,
    userAgent: string,
    metadata?: Record<string, any>
  ): DocumentAccessLog {
    const log: DocumentAccessLog = {
      id: uuidv4(),
      documentId,
      accessedBy,
      accessType,
      accessTime: new Date(),
      ipAddress,
      userAgent,
      metadata: metadata || {},
    };

    this.accessLogStorage.set(log.id, log);
    return log;
  }

  getDocumentAccessLogs(
    organizationId: string,
    documentId: string,
    limit: number = 50,
    offset: number = 0
  ): DocumentAccessLog[] {
    const document = this.documentStorage.get(documentId);
    if (!document || document.organizationId !== organizationId) {
      return [];
    }

    return Array.from(this.accessLogStorage.values())
      .filter((log) => log.documentId === documentId)
      .sort((a, b) => b.accessTime.getTime() - a.accessTime.getTime())
      .slice(offset, offset + limit);
  }

  getAccessLogsByUser(
    organizationId: string,
    documentId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): DocumentAccessLog[] {
    const document = this.documentStorage.get(documentId);
    if (!document || document.organizationId !== organizationId) {
      return [];
    }

    return Array.from(this.accessLogStorage.values())
      .filter((log) => log.documentId === documentId && log.accessedBy === userId)
      .sort((a, b) => b.accessTime.getTime() - a.accessTime.getTime())
      .slice(offset, offset + limit);
  }

  deleteDocument(organizationId: string, documentId: string): boolean {
    const document = this.documentStorage.get(documentId);
    if (!document || document.organizationId !== organizationId) {
      return false;
    }

    this.documentStorage.delete(documentId);
    this.versionStorage.delete(documentId);

    return true;
  }

  archiveDocument(organizationId: string, documentId: string): Document | null {
    const document = this.documentStorage.get(documentId);
    if (!document || document.organizationId !== organizationId) {
      return null;
    }

    document.status = DocumentStatus.ARCHIVED;
    document.updatedAt = new Date();
    this.documentStorage.set(documentId, document);

    return document;
  }

  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}
