import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentService } from '../../domains/document-management/services/DocumentService';
import { SignatureService } from '../../domains/document-management/services/SignatureService';
import { ComplianceService } from '../../domains/document-management/services/ComplianceService';
import { SharingService } from '../../domains/document-management/services/SharingService';
import { DocumentType, SignatureMethod } from '../../domains/document-management/models';

describe('Phase 16: Document Management & Digital Signatures', () => {
  const orgId = 'org-001';
  const orgId2 = 'org-002';
  const documentService = new DocumentService();
  const signatureService = new SignatureService();
  const complianceService = new ComplianceService();
  const sharingService = new SharingService();

  describe('DocumentService', () => {
    it('should create a document', () => {
      const doc = documentService.createDocument(
        orgId,
        'Contract.pdf',
        DocumentType.CONTRACT,
        'https://example.com/contract.pdf',
        'abc123hash',
        'user-001',
        'Service Agreement'
      );

      expect(doc).toBeDefined();
      expect(doc.organizationId).toBe(orgId);
      expect(doc.documentName).toBe('Contract.pdf');
      expect(doc.documentType).toBe(DocumentType.CONTRACT);
      expect(doc.status).toBe('draft');
    });

    it('should retrieve document by ID', () => {
      const created = documentService.createDocument(
        orgId,
        'Agreement.pdf',
        DocumentType.AGREEMENT,
        'https://example.com/agreement.pdf',
        'hash123',
        'user-001'
      );

      const retrieved = documentService.getDocumentById(orgId, created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.documentName).toBe('Agreement.pdf');
    });

    it('should update document status', () => {
      const doc = documentService.createDocument(
        orgId,
        'Test.pdf',
        DocumentType.PROPOSAL,
        'url',
        'hash',
        'user-001'
      );

      const updated = documentService.updateDocumentStatus(orgId, doc.id, 'ready_for_signature');
      expect(updated).toBeDefined();
      expect(updated!.status).toBe('ready_for_signature');
    });

    it('should create document version', () => {
      const doc = documentService.createDocument(
        orgId,
        'Test.pdf',
        DocumentType.CONTRACT,
        'url',
        'hash1',
        'user-001'
      );

      const version = documentService.createDocumentVersion(
        orgId,
        doc.id,
        'new_url',
        'hash2',
        'user-002',
        'Updated content',
        'Version 2'
      );

      expect(version).toBeDefined();
      expect(version!.versionNumber).toBe(2);
      expect(version!.summary).toBe('Version 2');
    });

    it('should get document versions', () => {
      const doc = documentService.createDocument(
        orgId,
        'Test.pdf',
        DocumentType.CONTRACT,
        'url',
        'hash1',
        'user-001'
      );

      documentService.createDocumentVersion(orgId, doc.id, 'url2', 'hash2', 'user-001', 'Updated', 'v2');

      const versions = documentService.getDocumentVersions(orgId, doc.id);
      expect(versions.length).toBeGreaterThanOrEqual(2);
    });

    it('should revert to previous version', () => {
      const doc = documentService.createDocument(
        orgId,
        'Test.pdf',
        DocumentType.CONTRACT,
        'url1',
        'hash1',
        'user-001'
      );

      const v2 = documentService.createDocumentVersion(
        orgId,
        doc.id,
        'url2',
        'hash2',
        'user-002',
        'Update',
        'v2'
      );

      const reverted = documentService.revertToVersion(orgId, doc.id, v2!.versionNumber - 1, 'user-003');
      expect(reverted).toBeDefined();
      expect(reverted!.versionNumber).toBeGreaterThan(v2!.versionNumber);
    });

    it('should create template', () => {
      const template = documentService.createTemplate(
        orgId,
        'Service Agreement Template',
        DocumentType.SERVICE_AGREEMENT,
        'This is a ${service_type} agreement...',
        ['service_type', 'client_name'],
        [{ role: 'Client', signingOrder: 1 }, { role: 'Vendor', signingOrder: 2 }]
      );

      expect(template).toBeDefined();
      expect(template.templateName).toBe('Service Agreement Template');
      expect(template.variables.length).toBe(2);
    });

    it('should create document from template', () => {
      const template = documentService.createTemplate(
        orgId,
        'Template',
        DocumentType.CONTRACT,
        'Agreement for ${client}',
        ['client'],
        []
      );

      const doc = documentService.createDocumentFromTemplate(
        orgId,
        template.id,
        'ACME Contract',
        { client: 'ACME Corp' },
        'user-001'
      );

      expect(doc).toBeDefined();
      expect(doc!.documentName).toBe('ACME Contract');
      expect(doc!.templateId).toBe(template.id);
    });

    it('should record access log', () => {
      const doc = documentService.createDocument(
        orgId,
        'Test.pdf',
        DocumentType.CONTRACT,
        'url',
        'hash',
        'user-001'
      );

      const log = documentService.recordAccessLog(
        doc.id,
        'user-002',
        'view',
        '192.168.1.1',
        'Mozilla/5.0',
        { action_detail: 'viewed contract' }
      );

      expect(log).toBeDefined();
      expect(log.accessType).toBe('view');
      expect(log.ipAddress).toBe('192.168.1.1');
    });

    it('should enforce organization isolation on document retrieval', () => {
      const doc = documentService.createDocument(
        orgId,
        'Test.pdf',
        DocumentType.CONTRACT,
        'url',
        'hash',
        'user-001'
      );

      const retrieved = documentService.getDocumentById(orgId2, doc.id);
      expect(retrieved).toBeNull();
    });

    it('should archive document', () => {
      const doc = documentService.createDocument(
        orgId,
        'Test.pdf',
        DocumentType.CONTRACT,
        'url',
        'hash',
        'user-001'
      );

      const archived = documentService.archiveDocument(orgId, doc.id);
      expect(archived).toBeDefined();
      expect(archived!.status).toBe('archived');
    });

    it('should delete document', () => {
      const doc = documentService.createDocument(
        orgId,
        'Test.pdf',
        DocumentType.CONTRACT,
        'url',
        'hash',
        'user-001'
      );

      const deleted = documentService.deleteDocument(orgId, doc.id);
      expect(deleted).toBe(true);
    });
  });

  describe('SignatureService', () => {
    let document: any;

    beforeEach(() => {
      document = documentService.createDocument(
        orgId,
        'Test.pdf',
        DocumentType.CONTRACT,
        'url',
        'hash',
        'user-001'
      );
    });

    it('should create signature workflow', () => {
      const signatories = [
        { id: 'sig-001', name: 'John Doe', email: 'john@example.com', role: 'Client', signingOrder: 1 },
        { id: 'sig-002', name: 'Jane Smith', email: 'jane@example.com', role: 'Vendor', signingOrder: 2 },
      ] as any;

      const workflow = signatureService.createSignatureWorkflow(
        orgId,
        document.id,
        'Standard Signature Flow',
        signatories
      );

      expect(workflow).toBeDefined();
      expect(workflow.signatories.length).toBe(2);
      expect(workflow.status).toBe('pending');
    });

    it('should retrieve workflow by ID', () => {
      const signatories = [
        { id: 'sig-001', name: 'John', email: 'john@example.com', role: 'Client', signingOrder: 1 },
      ] as any;

      const created = signatureService.createSignatureWorkflow(
        orgId,
        document.id,
        'Workflow',
        signatories
      );

      const retrieved = signatureService.getWorkflowById(orgId, created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.status).toBe('pending');
    });

    it('should add signature to workflow', () => {
      const signatories = [
        { id: 'sig-001', name: 'John', email: 'john@example.com', role: 'Client', signingOrder: 1 },
      ] as any;

      const workflow = signatureService.createSignatureWorkflow(
        orgId,
        document.id,
        'Workflow',
        signatories
      );

      const signature = signatureService.addSignature(
        orgId,
        workflow.id,
        'sig-001',
        SignatureMethod.ELECTRONIC,
        'signature_image_url',
        { signature_type: 'electronic' },
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(signature).toBeDefined();
      expect(signature!.status).toBe('signed');
    });

    it('should get signature status', () => {
      const signatories = [
        { id: 'sig-001', name: 'John', email: 'john@example.com', role: 'Client', signingOrder: 1 },
        { id: 'sig-002', name: 'Jane', email: 'jane@example.com', role: 'Vendor', signingOrder: 2 },
      ] as any;

      const workflow = signatureService.createSignatureWorkflow(
        orgId,
        document.id,
        'Workflow',
        signatories
      );

      signatureService.addSignature(
        orgId,
        workflow.id,
        'sig-001',
        SignatureMethod.ELECTRONIC,
        'url',
        {},
        '192.168.1.1',
        'Mozilla'
      );

      const status = signatureService.getSignatureStatus(orgId, workflow.id);
      expect(status.signedCount).toBe(1);
      expect(status.pendingCount).toBe(1);
      expect(status.completionPercentage).toBe(50);
    });

    it('should reject signature', () => {
      const signatories = [
        { id: 'sig-001', name: 'John', email: 'john@example.com', role: 'Client', signingOrder: 1 },
      ] as any;

      const workflow = signatureService.createSignatureWorkflow(
        orgId,
        document.id,
        'Workflow',
        signatories
      );

      const rejected = signatureService.rejectSignature(
        orgId,
        workflow.id,
        'sig-001',
        'Content needs revision'
      );

      expect(rejected).toBeDefined();
      expect(rejected!.status).toBe('rejected');
      expect(rejected!.rejectionReason).toBe('Content needs revision');
    });

    it('should validate signature', () => {
      const signatories = [
        { id: 'sig-001', name: 'John', email: 'john@example.com', role: 'Client', signingOrder: 1 },
      ] as any;

      const workflow = signatureService.createSignatureWorkflow(
        orgId,
        document.id,
        'Workflow',
        signatories
      );

      const signature = signatureService.addSignature(
        orgId,
        workflow.id,
        'sig-001',
        SignatureMethod.DIGITAL_SIGNATURE,
        'url',
        {},
        '192.168.1.1',
        'Mozilla'
      );

      const isValid = signatureService.validateSignature(orgId, signature!.id);
      expect(isValid).toBe(true);
    });

    it('should escalate workflow', () => {
      const signatories = [
        { id: 'sig-001', name: 'John', email: 'john@example.com', role: 'Client', signingOrder: 1 },
      ] as any;

      const workflow = signatureService.createSignatureWorkflow(
        orgId,
        document.id,
        'Workflow',
        signatories
      );

      const escalated = signatureService.escalateWorkflow(
        orgId,
        workflow.id,
        'Signatory not responding'
      );

      expect(escalated).toBeDefined();
      expect(escalated!.escalatedAt).toBeDefined();
    });

    it('should cancel workflow', () => {
      const signatories = [
        { id: 'sig-001', name: 'John', email: 'john@example.com', role: 'Client', signingOrder: 1 },
      ] as any;

      const workflow = signatureService.createSignatureWorkflow(
        orgId,
        document.id,
        'Workflow',
        signatories
      );

      const cancelled = signatureService.cancelWorkflow(orgId, workflow.id);
      expect(cancelled).toBeDefined();
      expect(cancelled!.status).toBe('failed');
    });
  });

  describe('ComplianceService', () => {
    it('should create compliance checkpoint', () => {
      const checkpoint = complianceService.createComplianceCheckpoint(
        'doc-001',
        'legal_review',
        'Legal Review Completed',
        'user-001',
        { review_status: 'passed', reviewer: 'John Doe' }
      );

      expect(checkpoint).toBeDefined();
      expect(checkpoint.checkType).toBe('legal_review');
      expect(checkpoint.status).toBe('passed');
    });

    it('should update checkpoint status', () => {
      const checkpoint = complianceService.createComplianceCheckpoint(
        'doc-001',
        'legal_review',
        'Legal Review',
        'user-001'
      );

      const updated = complianceService.updateCheckpointStatus(
        checkpoint.id,
        'failed',
        'Needs revision'
      );

      expect(updated).toBeDefined();
      expect(updated!.status).toBe('failed');
    });

    it('should record audit log', () => {
      const log = complianceService.recordAuditLog(
        orgId,
        'doc-001',
        'document_signed',
        'signature',
        'user-001',
        '192.168.1.1',
        'Mozilla/5.0',
        { signature_count: 1 },
        { signed_by: 'John Doe' }
      );

      expect(log).toBeDefined();
      expect(log.action).toBe('document_signed');
      expect(log.actionType).toBe('signature');
    });

    it('should get document audit logs', () => {
      complianceService.recordAuditLog(
        orgId,
        'doc-001',
        'created',
        'document',
        'user-001',
        '192.168.1.1',
        'Mozilla'
      );

      complianceService.recordAuditLog(
        orgId,
        'doc-001',
        'updated',
        'document',
        'user-002',
        '192.168.1.1',
        'Mozilla'
      );

      const logs = complianceService.getDocumentAuditLogs(orgId, 'doc-001');
      expect(logs.length).toBeGreaterThanOrEqual(2);
    });

    it('should check compliance status', () => {
      complianceService.createComplianceCheckpoint(
        'doc-001',
        'check1',
        'Check 1',
        'user-001',
        { result: 'pass' }
      );

      complianceService.createComplianceCheckpoint(
        'doc-001',
        'check2',
        'Check 2',
        'user-001',
        { result: 'pass' }
      );

      const status = complianceService.checkComplianceStatus(orgId, 'doc-001');
      expect(status.isCompliant).toBe(true);
      expect(status.checkpointsPassed).toBe(2);
    });

    it('should generate compliance report', () => {
      const docData = [
        { id: 'doc-001', allSignaturesSigned: true, hasSignatures: true, isCompliant: true },
        { id: 'doc-002', allSignaturesSigned: false, hasSignatures: true, isCompliant: false },
      ];

      const report = complianceService.generateComplianceReport(
        orgId,
        'compliance',
        'user-001',
        docData,
        'json'
      );

      expect(report).toBeDefined();
      expect(report.reportType).toBe('compliance');
      expect(report.documentCount).toBe(2);
    });

    it('should create compliance certificate', () => {
      const cert = complianceService.createComplianceCertificate(
        orgId,
        'doc-001',
        'tamper_proof',
        'user-001'
      );

      expect(cert).toBeDefined();
      expect(cert.certificationType).toBe('tamper_proof');
      expect(cert.certificateUrl).toContain('https://certificates.example.com');
    });

    it('should verify document integrity', () => {
      const originalHash = 'abc123hash';
      const currentHash = 'abc123hash';

      const isValid = complianceService.verifyDocumentIntegrity(
        'doc-001',
        currentHash,
        originalHash
      );

      expect(isValid).toBe(true);
    });

    it('should generate audit trail', () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = new Date();

      complianceService.recordAuditLog(
        orgId,
        'doc-001',
        'action1',
        'type1',
        'user-001',
        '192.168.1.1',
        'Mozilla'
      );

      const trail = complianceService.generateAuditTrail(orgId, 'doc-001', startDate, endDate);
      expect(trail.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('SharingService', () => {
    it('should create sharing link', () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const link = sharingService.createSharingLink(
        'doc-001',
        'user-001',
        'view',
        expiresAt,
        false
      );

      expect(link).toBeDefined();
      expect(link.accessLevel).toBe('view');
      expect(link.isActive).toBe(true);
      expect(link.token).toBeDefined();
    });

    it('should retrieve sharing link by token', () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const created = sharingService.createSharingLink(
        'doc-001',
        'user-001',
        'view',
        expiresAt
      );

      const retrieved = sharingService.getSharingLinkByToken(created.token);
      expect(retrieved).toBeDefined();
      expect(retrieved!.documentId).toBe('doc-001');
    });

    it('should record download', () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const link = sharingService.createSharingLink(
        'doc-001',
        'user-001',
        'view',
        expiresAt,
        false,
        undefined,
        undefined,
        5
      );

      const recorded = sharingService.recordDownload(link.id);
      expect(recorded).toBe(true);
    });

    it('should disable sharing link', () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const link = sharingService.createSharingLink(
        'doc-001',
        'user-001',
        'view',
        expiresAt
      );

      const disabled = sharingService.disableSharingLink(link.id);
      expect(disabled).toBeDefined();
      expect(disabled!.isActive).toBe(false);
    });

    it('should create reminder notification', () => {
      const reminder = sharingService.createReminder(
        'doc-001',
        'sig-001',
        'initial',
        'email'
      );

      expect(reminder).toBeDefined();
      expect(reminder.reminderType).toBe('initial');
      expect(reminder.channel).toBe('email');
    });

    it('should mark reminder as opened', () => {
      const reminder = sharingService.createReminder(
        'doc-001',
        'sig-001',
        'initial',
        'email'
      );

      const marked = sharingService.markReminderAsOpened(reminder.id);
      expect(marked).toBeDefined();
      expect(marked!.status).toBe('opened');
    });

    it('should get access statistics', () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      sharingService.createSharingLink('doc-001', 'user-001', 'view', expiresAt);
      sharingService.createSharingLink('doc-001', 'user-002', 'sign', expiresAt);

      const stats = sharingService.getAccessStatistics('doc-001');
      expect(stats.totalLinks).toBe(2);
      expect(stats.totalDownloads).toBe(0);
    });

    it('should delete sharing link', () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const link = sharingService.createSharingLink(
        'doc-001',
        'user-001',
        'view',
        expiresAt
      );

      const deleted = sharingService.deleteSharingLink(link.id);
      expect(deleted).toBe(true);
    });
  });

  describe('Organization Isolation Tests', () => {
    it('should prevent cross-organization document access', () => {
      const doc1 = documentService.createDocument(
        orgId,
        'Test1.pdf',
        DocumentType.CONTRACT,
        'url',
        'hash1',
        'user-001'
      );

      const doc2 = documentService.createDocument(
        orgId2,
        'Test2.pdf',
        DocumentType.CONTRACT,
        'url',
        'hash2',
        'user-001'
      );

      const retrieved1InOrg2 = documentService.getDocumentById(orgId2, doc1.id);
      const retrieved2InOrg1 = documentService.getDocumentById(orgId, doc2.id);

      expect(retrieved1InOrg2).toBeNull();
      expect(retrieved2InOrg1).toBeNull();
    });

    it('should prevent cross-organization workflow access', () => {
      const doc1 = documentService.createDocument(
        orgId,
        'Test.pdf',
        DocumentType.CONTRACT,
        'url',
        'hash',
        'user-001'
      );

      const signatories = [
        { id: 'sig-001', name: 'John', email: 'john@example.com', role: 'Client', signingOrder: 1 },
      ] as any;

      const workflow = signatureService.createSignatureWorkflow(
        orgId,
        doc1.id,
        'Workflow',
        signatories
      );

      const retrieved = signatureService.getWorkflowById(orgId2, workflow.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('Integration Scenarios', () => {
    it('should complete full document signature workflow', () => {
      const doc = documentService.createDocument(
        orgId,
        'Contract.pdf',
        DocumentType.CONTRACT,
        'https://example.com/contract.pdf',
        'contract123',
        'user-001',
        'Service Agreement'
      );

      const signatories = [
        { id: 'sig-001', name: 'Client', email: 'client@example.com', role: 'Client', signingOrder: 1 },
        { id: 'sig-002', name: 'Vendor', email: 'vendor@example.com', role: 'Vendor', signingOrder: 2 },
      ] as any;

      const workflow = signatureService.createSignatureWorkflow(
        orgId,
        doc.id,
        'Contract Signature Flow',
        signatories
      );

      documentService.updateDocumentStatus(orgId, doc.id, 'ready_for_signature');

      complianceService.recordAuditLog(
        orgId,
        doc.id,
        'sent_for_signature',
        'signature',
        'user-001',
        '192.168.1.1',
        'Mozilla'
      );

      signatureService.addSignature(
        orgId,
        workflow.id,
        'sig-001',
        SignatureMethod.ELECTRONIC,
        'sig_image_1',
        {},
        '192.168.1.2',
        'Mozilla'
      );

      const status = signatureService.getSignatureStatus(orgId, workflow.id);
      expect(status.signedCount).toBe(1);
      expect(status.pendingCount).toBe(1);
    });

    it('should complete document sharing and access tracking', () => {
      const doc = documentService.createDocument(
        orgId,
        'Report.pdf',
        DocumentType.PROPOSAL,
        'https://example.com/report.pdf',
        'report123',
        'user-001'
      );

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const link = sharingService.createSharingLink(
        doc.id,
        'user-001',
        'view',
        expiresAt,
        false,
        undefined,
        ['client@example.com']
      );

      documentService.recordAccessLog(
        doc.id,
        'client@example.com',
        'view',
        '192.168.1.3',
        'Mozilla',
        { shared_link: link.token }
      );

      const accessLogs = documentService.getDocumentAccessLogs(orgId, doc.id);
      expect(accessLogs.length).toBeGreaterThan(0);
      expect(accessLogs[0].accessType).toBe('view');
    });

    it('should complete compliance review workflow', () => {
      const doc = documentService.createDocument(
        orgId,
        'Legal.pdf',
        DocumentType.NDA,
        'url',
        'hash',
        'user-001'
      );

      complianceService.createComplianceCheckpoint(
        doc.id,
        'legal_review',
        'Legal Review',
        'legal-001',
        { status: 'passed' }
      );

      complianceService.createComplianceCheckpoint(
        doc.id,
        'security_review',
        'Security Review',
        'sec-001',
        { status: 'passed' }
      );

      const status = complianceService.checkComplianceStatus(orgId, doc.id);
      expect(status.isCompliant).toBe(true);
      expect(status.checkpointsPassed).toBe(2);

      const report = complianceService.generateComplianceReport(
        orgId,
        'compliance',
        'user-001',
        [{ id: doc.id, isCompliant: true }]
      );

      expect(report.documentCount).toBe(1);
    });
  });
});
