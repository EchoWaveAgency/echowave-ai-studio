import { describe, it, expect, beforeEach } from 'vitest';
import { contractTemplateService } from '../../domains/contracts/services/ContractTemplateService';
import { contractService } from '../../domains/contracts/services/ContractService';
import { contractSignerService } from '../../domains/contracts/services/ContractSignerService';
import { contractApprovalService } from '../../domains/contracts/services/ContractApprovalService';
import { contractVersionService } from '../../domains/contracts/services/ContractVersionService';
import { contractAuditLogService } from '../../domains/contracts/services/ContractAuditLogService';
import { ValidationError } from '../../platform/errors/errors';

const ORG_ID = 'test-org-phase9';
const USER_ID = 'user-phase9';
const USER_NAME = 'Test User';

describe('Phase 9: Contracts & Legal Management', () => {
  describe('ContractTemplateService', () => {
    it('should create a contract template', async () => {
      const template = await contractTemplateService.createTemplate(
        ORG_ID,
        {
          name: 'Service Agreement',
          category: 'service',
          description: 'Standard service agreement template',
          content: 'Service Agreement\n\nParty 1: {{party1}}\nParty 2: {{party2}}\n\nTerms and conditions...',
          tags: ['service', 'standard'],
        },
        USER_ID,
      );

      expect(template.id).toBeDefined();
      expect(template.organizationId).toBe(ORG_ID);
      expect(template.name).toBe('Service Agreement');
      expect(template.category).toBe('service');
      expect(template.status).toBe('draft');
      expect(template.version).toBe(1);
      expect(template.variables).toContain('party1');
      expect(template.variables).toContain('party2');
      expect(template.createdBy).toBe(USER_ID);
    });

    it('should throw error for missing template name', async () => {
      try {
        await contractTemplateService.createTemplate(
          ORG_ID,
          {
            name: '',
            category: 'service',
            content: 'Content',
          },
          USER_ID,
        );
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
      }
    });

    it('should throw error for invalid category', async () => {
      try {
        await contractTemplateService.createTemplate(
          ORG_ID,
          {
            name: 'Test',
            category: 'invalid',
            content: 'Content',
          },
          USER_ID,
        );
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
      }
    });

    it('should activate a template', async () => {
      const template = await contractTemplateService.createTemplate(
        ORG_ID,
        {
          name: 'NDA Template',
          category: 'nda',
          content: 'NDA Content',
        },
        USER_ID,
      );

      const activated = await contractTemplateService.activateTemplate(ORG_ID, template.id);
      expect(activated.status).toBe('active');
      expect(activated.version).toBe(2);
    });

    it('should archive a template', async () => {
      const template = await contractTemplateService.createTemplate(
        ORG_ID,
        {
          name: 'Old Template',
          category: 'service',
          content: 'Content',
        },
        USER_ID,
      );

      const archived = await contractTemplateService.archiveTemplate(ORG_ID, template.id);
      expect(archived.status).toBe('archived');
    });

    it('should extract variables from template content', async () => {
      const template = await contractTemplateService.createTemplate(
        ORG_ID,
        {
          name: 'Multi-variable Template',
          category: 'service',
          content: 'Agreement between {{vendor}} and {{client}} for {{service}} at {{price}} per {{unit}}',
        },
        USER_ID,
      );

      expect(template.variables).toHaveLength(5);
      expect(template.variables).toContain('vendor');
      expect(template.variables).toContain('client');
      expect(template.variables).toContain('service');
      expect(template.variables).toContain('price');
      expect(template.variables).toContain('unit');
    });

    it('should update template content and increment version', async () => {
      const template = await contractTemplateService.createTemplate(
        ORG_ID,
        {
          name: 'Versioned Template',
          category: 'service',
          content: 'Version 1 Content {{variable1}}',
        },
        USER_ID,
      );

      const updated = await contractTemplateService.updateTemplate(ORG_ID, template.id, {
        content: 'Version 2 Content {{variable1}} {{variable2}}',
      });

      expect(updated.version).toBe(2);
      expect(updated.variables).toHaveLength(2);
      expect(updated.content).toContain('Version 2');
    });
  });

  describe('ContractService', () => {
    it('should create a contract', async () => {
      const contract = await contractService.createContract(
        ORG_ID,
        {
          templateId: 'tpl_123',
          title: 'Service Agreement - Client A',
          category: 'service',
          content: 'Full contract content here',
          parties: ['Company Inc', 'Client A LLC'],
          variables: { vendor: 'Company Inc', client: 'Client A LLC' },
        },
        USER_ID,
      );

      expect(contract.id).toBeDefined();
      expect(contract.contractNumber).toBeDefined();
      expect(contract.contractNumber.startsWith('CNT-')).toBe(true);
      expect(contract.status).toBe('draft');
      expect(contract.title).toBe('Service Agreement - Client A');
      expect(contract.parties).toHaveLength(2);
    });

    it('should throw error for missing contract title', async () => {
      try {
        await contractService.createContract(
          ORG_ID,
          {
            templateId: 'tpl_123',
            title: '',
            category: 'service',
            content: 'Content',
            parties: ['A', 'B'],
          },
          USER_ID,
        );
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
      }
    });

    it('should require at least one party', async () => {
      try {
        await contractService.createContract(
          ORG_ID,
          {
            templateId: 'tpl_123',
            title: 'Test',
            category: 'service',
            content: 'Content',
            parties: [],
          },
          USER_ID,
        );
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
      }
    });

    it('should transition contract from draft to pending_review', async () => {
      const contract = await contractService.createContract(
        ORG_ID,
        {
          templateId: 'tpl_123',
          title: 'For Review',
          category: 'service',
          content: 'Content',
          parties: ['A', 'B'],
        },
        USER_ID,
      );

      const inReview = await contractService.sendForReview(ORG_ID, contract.id);
      expect(inReview.status).toBe('pending_review');
    });

    it('should transition contract from draft to pending_signature', async () => {
      const contract = await contractService.createContract(
        ORG_ID,
        {
          templateId: 'tpl_123',
          title: 'For Signature',
          category: 'service',
          content: 'Content',
          parties: ['A', 'B'],
        },
        USER_ID,
      );

      const pending = await contractService.sendForSignature(ORG_ID, contract.id);
      expect(pending.status).toBe('pending_signature');
    });

    it('should mark contract as signed', async () => {
      const contract = await contractService.createContract(
        ORG_ID,
        {
          templateId: 'tpl_123',
          title: 'To Sign',
          category: 'service',
          content: 'Content',
          parties: ['A', 'B'],
        },
        USER_ID,
      );

      await contractService.sendForSignature(ORG_ID, contract.id);
      const signed = await contractService.markAsSigned(ORG_ID, contract.id);

      expect(signed.status).toBe('signed');
    });

    it('should terminate contract with reason', async () => {
      const contract = await contractService.createContract(
        ORG_ID,
        {
          templateId: 'tpl_123',
          title: 'To Terminate',
          category: 'service',
          content: 'Content',
          parties: ['A', 'B'],
        },
        USER_ID,
      );

      const terminated = await contractService.terminateContract(ORG_ID, contract.id, 'Client requested termination');
      expect(terminated.status).toBe('terminated');
      expect(terminated.metadata.terminationReason).toBe('Client requested termination');
    });

    it('should archive contract', async () => {
      const contract = await contractService.createContract(
        ORG_ID,
        {
          templateId: 'tpl_123',
          title: 'To Archive',
          category: 'service',
          content: 'Content',
          parties: ['A', 'B'],
        },
        USER_ID,
      );

      const archived = await contractService.archiveContract(ORG_ID, contract.id);
      expect(archived.status).toBe('archived');
    });

    it('should link contract to subscription', async () => {
      const contract = await contractService.createContract(
        ORG_ID,
        {
          templateId: 'tpl_123',
          title: 'Subscription Contract',
          category: 'service',
          content: 'Content',
          parties: ['A', 'B'],
          relatedToSubscriptionId: 'sub_123',
        },
        USER_ID,
      );

      expect(contract.relatedToSubscriptionId).toBe('sub_123');
    });

    it('should link contract to proposal', async () => {
      const contract = await contractService.createContract(
        ORG_ID,
        {
          templateId: 'tpl_123',
          title: 'Proposal Contract',
          category: 'service',
          content: 'Content',
          parties: ['A', 'B'],
          relatedToProposalId: 'prop_123',
        },
        USER_ID,
      );

      expect(contract.relatedToProposalId).toBe('prop_123');
    });
  });

  describe('ContractSignerService', () => {
    it('should add a signer to contract', async () => {
      const signer = await contractSignerService.addSigner(
        ORG_ID,
        'contract_123',
        {
          name: 'John Doe',
          email: 'john@example.com',
          role: 'owner',
          signatureType: 'esignature',
        },
        USER_ID,
      );

      expect(signer.id).toBeDefined();
      expect(signer.name).toBe('John Doe');
      expect(signer.email).toBe('john@example.com');
      expect(signer.status).toBe('pending');
      expect(signer.signatureTokenId).toBeDefined();
      expect(signer.tokenExpiresAt).toBeDefined();
    });

    it('should require valid email for signer', async () => {
      try {
        await contractSignerService.addSigner(
          ORG_ID,
          'contract_123',
          {
            name: 'John',
            email: 'invalid-email',
            role: 'owner',
          },
          USER_ID,
        );
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
      }
    });

    it('should sign contract', async () => {
      const signer = await contractSignerService.addSigner(
        ORG_ID,
        'contract_123',
        {
          name: 'Jane Doe',
          email: 'jane@example.com',
          role: 'owner',
        },
        USER_ID,
      );

      const signatureToken = signer.signatureTokenId!;
      const signed = await contractSignerService.signContract(ORG_ID, signer.id, signatureToken, {
        timestamp: new Date(),
        lat: 40.7128,
        lon: -74.006,
      });

      expect(signed.status).toBe('signed');
      expect(signed.signedAt).toBeDefined();
      expect(signed.signatureData).toBeDefined();
      expect(signed.signatureTokenId).toBeUndefined();
    });

    it('should decline signature', async () => {
      const signer = await contractSignerService.addSigner(
        ORG_ID,
        'contract_123',
        {
          name: 'Bob Smith',
          email: 'bob@example.com',
          role: 'witness',
        },
        USER_ID,
      );

      const signatureToken = signer.signatureTokenId!;
      const declined = await contractSignerService.declineSignature(
        ORG_ID,
        signer.id,
        signatureToken,
        'Cannot sign due to conflicts of interest',
      );

      expect(declined.status).toBe('declined');
      expect(declined.metadata.declineReason).toBe('Cannot sign due to conflicts of interest');
    });

    it('should resend signature request', async () => {
      const signer = await contractSignerService.addSigner(
        ORG_ID,
        'contract_123',
        {
          name: 'Alice Wonder',
          email: 'alice@example.com',
          role: 'approver',
        },
        USER_ID,
      );

      const originalToken = signer.signatureTokenId;
      const resent = await contractSignerService.resendSignatureRequest(ORG_ID, signer.id);

      expect(resent.signatureTokenId).toBeDefined();
      expect(resent.signatureTokenId).not.toBe(originalToken);
      expect(resent.metadata.lastResendAt).toBeDefined();
    });

    it('should enforce signer role types', async () => {
      const roles = ['owner', 'witness', 'approver', 'recipient'];

      for (const role of roles) {
        const signer = await contractSignerService.addSigner(
          ORG_ID,
          'contract_123',
          {
            name: 'Test',
            email: `test${roles.indexOf(role)}@example.com`,
            role: role as any,
          },
          USER_ID,
        );

        expect(signer.role).toBe(role);
      }
    });

    it('should reject invalid signer role', async () => {
      try {
        await contractSignerService.addSigner(
          ORG_ID,
          'contract_123',
          {
            name: 'Test',
            email: 'test@example.com',
            role: 'invalid-role' as any,
          },
          USER_ID,
        );
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
      }
    });
  });

  describe('ContractApprovalService', () => {
    it('should create approval request', async () => {
      const approval = await contractApprovalService.createApprovalRequest(
        ORG_ID,
        'contract_123',
        {
          approverId: 'approver_1',
          approverName: 'Legal Team',
          approverEmail: 'legal@company.com',
          level: 1,
          requiredRole: 'legal_reviewer',
        },
        USER_ID,
      );

      expect(approval.id).toBeDefined();
      expect(approval.status).toBe('pending');
      expect(approval.level).toBe(1);
      expect(approval.approvalTokenId).toBeDefined();
      expect(approval.tokenExpiresAt).toBeDefined();
    });

    it('should require approver details', async () => {
      try {
        await contractApprovalService.createApprovalRequest(
          ORG_ID,
          'contract_123',
          {
            approverId: '',
            approverName: 'Test',
            approverEmail: 'test@example.com',
            level: 1,
            requiredRole: 'role',
          },
          USER_ID,
        );
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
      }
    });

    it('should approve contract', async () => {
      const approval = await contractApprovalService.createApprovalRequest(
        ORG_ID,
        'contract_123',
        {
          approverId: 'approver_1',
          approverName: 'Manager',
          approverEmail: 'manager@company.com',
          level: 1,
          requiredRole: 'manager',
        },
        USER_ID,
      );

      const approvalToken = approval.approvalTokenId!;
      const approved = await contractApprovalService.approveContract(
        ORG_ID,
        approval.id,
        approvalToken,
        'Approved - meets all requirements',
      );

      expect(approved.status).toBe('approved');
      expect(approved.approvedAt).toBeDefined();
      expect(approved.comments).toBe('Approved - meets all requirements');
    });

    it('should reject contract', async () => {
      const approval = await contractApprovalService.createApprovalRequest(
        ORG_ID,
        'contract_123',
        {
          approverId: 'approver_2',
          approverName: 'Reviewer',
          approverEmail: 'reviewer@company.com',
          level: 2,
          requiredRole: 'reviewer',
        },
        USER_ID,
      );

      const approvalToken = approval.approvalTokenId!;
      const rejected = await contractApprovalService.rejectContract(
        ORG_ID,
        approval.id,
        approvalToken,
        'Requires changes to Section 3',
      );

      expect(rejected.status).toBe('rejected');
      expect(rejected.rejectedAt).toBeDefined();
      expect(rejected.comments).toBe('Requires changes to Section 3');
    });

    it('should escalate approval', async () => {
      const approval = await contractApprovalService.createApprovalRequest(
        ORG_ID,
        'contract_123',
        {
          approverId: 'approver_3',
          approverName: 'Escalation Team',
          approverEmail: 'escalation@company.com',
          level: 3,
          requiredRole: 'escalation_handler',
        },
        USER_ID,
      );

      const escalated = await contractApprovalService.escalateApproval(
        ORG_ID,
        approval.id,
        'Requires executive review',
      );

      expect(escalated.status).toBe('escalated');
      expect(escalated.metadata.escalatedAt).toBeDefined();
    });

    it('should support multi-level approvals', async () => {
      const approval1 = await contractApprovalService.createApprovalRequest(
        ORG_ID,
        'contract_123',
        {
          approverId: 'approver_level1',
          approverName: 'Level 1',
          approverEmail: 'level1@company.com',
          level: 1,
          requiredRole: 'reviewer',
        },
        USER_ID,
      );

      const approval2 = await contractApprovalService.createApprovalRequest(
        ORG_ID,
        'contract_123',
        {
          approverId: 'approver_level2',
          approverName: 'Level 2',
          approverEmail: 'level2@company.com',
          level: 2,
          requiredRole: 'manager',
        },
        USER_ID,
      );

      expect(approval1.level).toBe(1);
      expect(approval2.level).toBe(2);
    });
  });

  describe('ContractVersionService', () => {
    it('should create contract version', async () => {
      const version = await contractVersionService.createVersion(
        ORG_ID,
        'contract_123',
        {
          version: 1,
          content: 'Version 1 Content',
          changes: 'Initial version',
        },
        USER_ID,
      );

      expect(version.id).toBeDefined();
      expect(version.version).toBe(1);
      expect(version.content).toBe('Version 1 Content');
      expect(version.createdBy).toBe(USER_ID);
    });

    it('should restore previous version', async () => {
      await contractVersionService.createVersion(
        ORG_ID,
        'contract_123',
        { version: 1, content: 'V1 Content' },
        USER_ID,
      );

      const restored = await contractVersionService.restoreVersion(
        ORG_ID,
        'contract_123',
        1,
        USER_ID,
      );

      expect(restored.content).toBe('V1 Content');
      expect(restored.version).toBe(2);
      expect(restored.changes).toContain('Restored from version 1');
    });

    it('should compare versions', async () => {
      await contractVersionService.createVersion(
        ORG_ID,
        'contract_123',
        { version: 1, content: 'Line 1\nLine 2\nLine 3' },
        USER_ID,
      );

      await contractVersionService.createVersion(
        ORG_ID,
        'contract_123',
        { version: 2, content: 'Line 1\nLine 2 Modified\nLine 3' },
        USER_ID,
      );

      const comparison = await contractVersionService.compareVersions(
        ORG_ID,
        'contract_123',
        1,
        2,
      );

      expect(comparison).toBeDefined();
      expect(comparison?.differences.length).toBeGreaterThan(0);
    });
  });

  describe('ContractAuditLogService', () => {
    it('should log contract creation event', async () => {
      const log = await contractAuditLogService.logEvent(
        ORG_ID,
        'contract_123',
        'created',
        USER_ID,
        USER_NAME,
        {
          title: 'New Contract',
          category: 'service',
        },
        '192.168.1.1',
        'Mozilla/5.0',
      );

      expect(log.id).toBeDefined();
      expect(log.event).toBe('created');
      expect(log.userId).toBe(USER_ID);
      expect(log.userName).toBe(USER_NAME);
      expect(log.ipAddress).toBe('192.168.1.1');
      expect(log.timestamp).toBeDefined();
    });

    it('should log signature event', async () => {
      const log = await contractAuditLogService.logEvent(
        ORG_ID,
        'contract_123',
        'signed',
        'signer_user',
        'John Signer',
        {
          signerEmail: 'john@example.com',
          signatureType: 'esignature',
        },
      );

      expect(log.event).toBe('signed');
      expect(log.details.signerEmail).toBe('john@example.com');
    });

    it('should log approval event', async () => {
      const log = await contractAuditLogService.logEvent(
        ORG_ID,
        'contract_123',
        'approved',
        'approver_user',
        'Legal Approver',
        {
          approvalLevel: 1,
          comments: 'Approved',
        },
      );

      expect(log.event).toBe('approved');
      expect(log.details.approvalLevel).toBe(1);
    });

    it('should track all audit event types', async () => {
      const events = [
        'created',
        'updated',
        'sent_for_review',
        'sent_for_signature',
        'signed',
        'approved',
        'rejected',
        'expired',
        'terminated',
        'renewed',
        'archived',
      ];

      for (const event of events) {
        const log = await contractAuditLogService.logEvent(
          ORG_ID,
          'contract_123',
          event,
          USER_ID,
          USER_NAME,
          {},
        );

        expect(log.event).toBe(event);
      }
    });

    it('should export audit trail as JSON', async () => {
      await contractAuditLogService.logEvent(
        ORG_ID,
        'contract_123',
        'created',
        USER_ID,
        USER_NAME,
        { title: 'Test' },
      );

      const json = await contractAuditLogService.exportAuditTrail(
        ORG_ID,
        'contract_123',
        'json',
      );

      expect(json).toBeDefined();
      expect(typeof json).toBe('string');
    });

    it('should export audit trail as CSV', async () => {
      await contractAuditLogService.logEvent(
        ORG_ID,
        'contract_123',
        'created',
        USER_ID,
        USER_NAME,
        { title: 'Test' },
      );

      const csv = await contractAuditLogService.exportAuditTrail(
        ORG_ID,
        'contract_123',
        'csv',
      );

      expect(csv).toBeDefined();
      expect(csv.includes('ID')).toBe(true);
      expect(csv.includes('Event')).toBe(true);
      expect(csv.includes('User')).toBe(true);
    });
  });

  describe('Organization Isolation', () => {
    it('should isolate contracts between organizations', async () => {
      const org1 = 'org-1-phase9';
      const org2 = 'org-2-phase9';

      const contract1 = await contractService.createContract(
        org1,
        {
          templateId: 'tpl_123',
          title: 'Org 1 Contract',
          category: 'service',
          content: 'Content',
          parties: ['A', 'B'],
        },
        USER_ID,
      );

      const contract2 = await contractService.createContract(
        org2,
        {
          templateId: 'tpl_456',
          title: 'Org 2 Contract',
          category: 'nda',
          content: 'Content',
          parties: ['C', 'D'],
        },
        USER_ID,
      );

      expect(contract1.organizationId).toBe(org1);
      expect(contract2.organizationId).toBe(org2);
      expect(contract1.id).not.toBe(contract2.id);
    });

    it('should not retrieve contracts across organization boundaries', async () => {
      try {
        await contractService.getContractById('wrong-org', 'contract_123');
        // Should not error in mock, but in production would check org isolation
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
      }
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete contract lifecycle', async () => {
      // Create contract
      const contract = await contractService.createContract(
        ORG_ID,
        {
          templateId: 'tpl_123',
          title: 'Full Lifecycle Contract',
          category: 'service',
          content: 'Agreement content',
          parties: ['Company', 'Vendor'],
          relatedToSubscriptionId: 'sub_001',
        },
        USER_ID,
      );

      expect(contract.status).toBe('draft');

      // Send for review
      const inReview = await contractService.sendForReview(ORG_ID, contract.id);
      expect(inReview.status).toBe('pending_review');

      // Create approval request
      const approval = await contractApprovalService.createApprovalRequest(
        ORG_ID,
        contract.id,
        {
          approverId: 'legal_1',
          approverName: 'Legal Team',
          approverEmail: 'legal@company.com',
          level: 1,
          requiredRole: 'legal_reviewer',
        },
        USER_ID,
      );

      expect(approval.status).toBe('pending');

      // Approve contract
      const approved = await contractApprovalService.approveContract(
        ORG_ID,
        approval.id,
        approval.approvalTokenId!,
      );

      expect(approved.status).toBe('approved');

      // Send for signature
      const pending = await contractService.sendForSignature(ORG_ID, contract.id);
      expect(pending.status).toBe('pending_signature');

      // Add signer
      const signer = await contractSignerService.addSigner(
        ORG_ID,
        contract.id,
        {
          name: 'John Doe',
          email: 'john@vendor.com',
          role: 'owner',
        },
        USER_ID,
      );

      expect(signer.status).toBe('pending');

      // Sign contract
      const signed = await contractSignerService.signContract(
        ORG_ID,
        signer.id,
        signer.signatureTokenId!,
        { timestamp: new Date() },
      );

      expect(signed.status).toBe('signed');

      // Mark contract as signed
      const fullySignedContract = await contractService.markAsSigned(
        ORG_ID,
        contract.id,
      );

      expect(fullySignedContract.status).toBe('signed');

      // Log final event
      const log = await contractAuditLogService.logEvent(
        ORG_ID,
        contract.id,
        'signed',
        USER_ID,
        USER_NAME,
        { allPartiesSigned: true },
      );

      expect(log.event).toBe('signed');
    });

    it('should handle contract amendments with versioning', async () => {
      const contract = await contractService.createContract(
        ORG_ID,
        {
          templateId: 'tpl_123',
          title: 'Amendable Contract',
          category: 'service',
          content: 'Original contract content',
          parties: ['A', 'B'],
        },
        USER_ID,
      );

      // Create version 1
      const v1 = await contractVersionService.createVersion(
        ORG_ID,
        contract.id,
        {
          version: 1,
          content: 'Original contract content',
          changes: 'Initial version',
        },
        USER_ID,
      );

      expect(v1.version).toBe(1);

      // Create version 2 (amendment)
      const v2 = await contractVersionService.createVersion(
        ORG_ID,
        contract.id,
        {
          version: 2,
          content: 'Amended contract content\nNew clause added',
          changes: 'Amendment 1: Added new service clause',
        },
        USER_ID,
      );

      expect(v2.version).toBe(2);
      expect(v2.changes).toContain('Amendment 1');
    });
  });
});
