import { v4 as uuidv4 } from 'uuid';
import {
  ComplianceCheckpoint,
  ComplianceAuditLog,
  DocumentReport,
} from '../models';

export class ComplianceService {
  private checkpointStorage = new Map<string, ComplianceCheckpoint>();
  private auditLogStorage = new Map<string, ComplianceAuditLog>();
  private reportStorage = new Map<string, DocumentReport>();

  createComplianceCheckpoint(
    documentId: string,
    checkType: string,
    checkName: string,
    checkedBy: string,
    checkResult?: Record<string, any>
  ): ComplianceCheckpoint {
    const checkpoint: ComplianceCheckpoint = {
      id: uuidv4(),
      documentId,
      checkType,
      checkName,
      status: checkResult && Object.keys(checkResult).length > 0 ? 'passed' : 'pending',
      checkResult: checkResult || {},
      checkedAt: new Date(),
      checkedBy,
    };

    this.checkpointStorage.set(checkpoint.id, checkpoint);
    return checkpoint;
  }

  getDocumentCheckpoints(documentId: string, limit: number = 50, offset: number = 0): ComplianceCheckpoint[] {
    return Array.from(this.checkpointStorage.values())
      .filter((cp) => cp.documentId === documentId)
      .sort((a, b) => b.checkedAt.getTime() - a.checkedAt.getTime())
      .slice(offset, offset + limit);
  }

  updateCheckpointStatus(
    checkpointId: string,
    status: 'passed' | 'failed' | 'pending' | 'skipped',
    notes?: string
  ): ComplianceCheckpoint | null {
    const checkpoint = this.checkpointStorage.get(checkpointId);
    if (!checkpoint) {
      return null;
    }

    checkpoint.status = status;
    checkpoint.notes = notes;

    this.checkpointStorage.set(checkpointId, checkpoint);
    return checkpoint;
  }

  recordAuditLog(
    organizationId: string,
    documentId: string,
    action: string,
    actionType: string,
    performedBy: string,
    ipAddress: string,
    userAgent: string,
    changes?: Record<string, any>,
    metadata?: Record<string, any>
  ): ComplianceAuditLog {
    const log: ComplianceAuditLog = {
      id: uuidv4(),
      organizationId,
      documentId,
      action,
      actionType,
      performedBy,
      timestamp: new Date(),
      ipAddress,
      userAgent,
      changes: changes || {},
      metadata: metadata || {},
    };

    this.auditLogStorage.set(log.id, log);
    return log;
  }

  getDocumentAuditLogs(
    organizationId: string,
    documentId: string,
    limit: number = 100,
    offset: number = 0
  ): ComplianceAuditLog[] {
    return Array.from(this.auditLogStorage.values())
      .filter((log) => log.organizationId === organizationId && log.documentId === documentId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);
  }

  getAuditLogsByUser(
    organizationId: string,
    documentId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): ComplianceAuditLog[] {
    return Array.from(this.auditLogStorage.values())
      .filter(
        (log) =>
          log.organizationId === organizationId &&
          log.documentId === documentId &&
          log.performedBy === userId
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);
  }

  getAuditLogsByAction(
    organizationId: string,
    actionType: string,
    limit: number = 50,
    offset: number = 0
  ): ComplianceAuditLog[] {
    return Array.from(this.auditLogStorage.values())
      .filter((log) => log.organizationId === organizationId && log.actionType === actionType)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);
  }

  generateComplianceReport(
    organizationId: string,
    reportType: 'signature_status' | 'compliance' | 'expiration' | 'usage',
    generatedBy: string,
    documentData: any[],
    format: 'json' | 'csv' | 'pdf' = 'json'
  ): DocumentReport {
    const reportData = this.generateReportData(reportType, documentData);

    const report: DocumentReport = {
      id: uuidv4(),
      organizationId,
      reportType,
      generatedAt: new Date(),
      generatedBy,
      reportData,
      format,
      documentCount: documentData.length,
      fileUrl: format !== 'json' ? `https://reports.example.com/report-${uuidv4()}.${format}` : undefined,
    };

    this.reportStorage.set(report.id, report);
    return report;
  }

  getReportById(organizationId: string, reportId: string): DocumentReport | null {
    const report = this.reportStorage.get(reportId);
    if (!report || report.organizationId !== organizationId) {
      return null;
    }
    return report;
  }

  getOrganizationReports(
    organizationId: string,
    reportType?: 'signature_status' | 'compliance' | 'expiration' | 'usage',
    limit: number = 20,
    offset: number = 0
  ): DocumentReport[] {
    let reports = Array.from(this.reportStorage.values()).filter(
      (r) => r.organizationId === organizationId
    );

    if (reportType) {
      reports = reports.filter((r) => r.reportType === reportType);
    }

    return reports
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())
      .slice(offset, offset + limit);
  }

  verifyDocumentIntegrity(
    documentId: string,
    currentHash: string,
    originalHash: string
  ): boolean {
    return currentHash === originalHash;
  }

  createComplianceCertificate(
    organizationId: string,
    documentId: string,
    certificationType: 'tamper_proof' | 'notarized' | 'certified',
    issuedBy: string,
    expiresAt?: Date
  ): {
    certificateId: string;
    certificationType: string;
    issuedAt: Date;
    expiresAt?: Date;
    certificateUrl: string;
  } {
    const certificateId = uuidv4();
    const certificate = {
      certificateId,
      certificationType,
      issuedAt: new Date(),
      expiresAt: expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      certificateUrl: `https://certificates.example.com/cert-${certificateId}.pdf`,
    };

    this.recordAuditLog(
      organizationId,
      documentId,
      'compliance_certificate_issued',
      'compliance',
      issuedBy,
      '0.0.0.0',
      'system',
      { certificationType },
      { certificateId }
    );

    return certificate;
  }

  checkComplianceStatus(
    organizationId: string,
    documentId: string
  ): {
    isCompliant: boolean;
    checkpointsPassed: number;
    checkpointsFailed: number;
    compliancePercentage: number;
    risks: string[];
  } {
    const checkpoints = this.getDocumentCheckpoints(documentId);
    const passed = checkpoints.filter((cp) => cp.status === 'passed').length;
    const failed = checkpoints.filter((cp) => cp.status === 'failed').length;
    const total = checkpoints.length;

    const compliancePercentage = total > 0 ? Math.round((passed / total) * 100) : 0;
    const isCompliant = failed === 0 && passed > 0;

    const risks: string[] = [];
    if (failed > 0) {
      risks.push(`${failed} compliance checkpoint(s) failed`);
    }
    if (total === 0) {
      risks.push('No compliance checkpoints found');
    }

    return {
      isCompliant,
      checkpointsPassed: passed,
      checkpointsFailed: failed,
      compliancePercentage,
      risks,
    };
  }

  generateAuditTrail(
    organizationId: string,
    documentId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 500
  ): ComplianceAuditLog[] {
    let logs = this.getDocumentAuditLogs(organizationId, documentId, limit, 0);

    if (startDate) {
      logs = logs.filter((log) => log.timestamp >= startDate);
    }

    if (endDate) {
      logs = logs.filter((log) => log.timestamp <= endDate);
    }

    return logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  exportComplianceData(
    organizationId: string,
    documentId: string,
    format: 'json' | 'csv' = 'json'
  ): string {
    const auditLogs = this.getDocumentAuditLogs(organizationId, documentId, 1000, 0);
    const checkpoints = this.getDocumentCheckpoints(documentId, 1000, 0);
    const complianceStatus = this.checkComplianceStatus(organizationId, documentId);

    if (format === 'csv') {
      const headers = 'ID,Action,User,Timestamp,Type,Status\n';
      const rows = auditLogs
        .map(
          (log) =>
            `${log.id},"${log.action}","${log.performedBy}",${log.timestamp.toISOString()},"${log.actionType}",success`
        )
        .join('\n');

      return headers + rows;
    }

    return JSON.stringify(
      {
        documentId,
        exportedAt: new Date().toISOString(),
        auditLogs,
        checkpoints,
        complianceStatus,
      },
      null,
      2
    );
  }

  private generateReportData(
    reportType: string,
    documentData: any[]
  ): Record<string, any> {
    switch (reportType) {
      case 'signature_status':
        return {
          totalDocuments: documentData.length,
          fullySignedDocuments: documentData.filter((d) => d.allSignaturesSigned).length,
          partiallySignedDocuments: documentData.filter((d) => d.hasSignatures && !d.allSignaturesSigned).length,
          unsignedDocuments: documentData.filter((d) => !d.hasSignatures).length,
          generatedAt: new Date().toISOString(),
        };

      case 'compliance':
        const compliantDocs = documentData.filter((d) => d.isCompliant).length;
        return {
          totalDocuments: documentData.length,
          compliantDocuments: compliantDocs,
          nonCompliantDocuments: documentData.length - compliantDocs,
          compliancePercentage: Math.round((compliantDocs / documentData.length) * 100),
          generatedAt: new Date().toISOString(),
        };

      case 'expiration':
        const now = new Date();
        const expiredDocs = documentData.filter((d) => d.expiresAt && new Date(d.expiresAt) < now).length;
        const expiringDocs = documentData.filter(
          (d) =>
            d.expiresAt &&
            new Date(d.expiresAt) > now &&
            new Date(d.expiresAt) <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        ).length;
        return {
          totalDocuments: documentData.length,
          expiredDocuments: expiredDocs,
          expiringWithinDays: expiringDocs,
          generatedAt: new Date().toISOString(),
        };

      case 'usage':
      default:
        return {
          totalDocuments: documentData.length,
          averageAccessCount: documentData.reduce((sum, d) => sum + (d.accessCount || 0), 0) / documentData.length,
          mostAccessedDocument: documentData.sort((a, b) => (b.accessCount || 0) - (a.accessCount || 0))[0],
          generatedAt: new Date().toISOString(),
        };
    }
  }
}
