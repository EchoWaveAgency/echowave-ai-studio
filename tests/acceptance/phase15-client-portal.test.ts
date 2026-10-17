import { describe, it, expect, beforeEach } from 'vitest';
import { ClientAccountService } from '../../domains/client-portal/services/ClientAccountService';
import { ProjectViewService } from '../../domains/client-portal/services/ProjectViewService';
import { PortalService } from '../../domains/client-portal/services/PortalService';
import { InvoiceViewService } from '../../domains/client-portal/services/InvoiceViewService';

describe('Phase 15: Client Portal & Self-Service', () => {
  const orgId = 'org-001';
  const orgId2 = 'org-002';
  const clientAccountService = new ClientAccountService();
  const projectViewService = new ProjectViewService();
  const portalService = new PortalService();
  const invoiceViewService = new InvoiceViewService();

  describe('ClientAccountService', () => {
    it('should create a client account', () => {
      const account = clientAccountService.createClientAccount(
        orgId,
        'ACME Corp',
        'primary-color',
        'accent-color'
      );
      expect(account).toBeDefined();
      expect(account.organizationId).toBe(orgId);
      expect(account.companyName).toBe('ACME Corp');
      expect(account.status).toBe('pending');
    });

    it('should retrieve a client account by ID', () => {
      const created = clientAccountService.createClientAccount(orgId, 'Test Client', '#000000', '#FFFFFF');
      const retrieved = clientAccountService.getClientAccountById(orgId, created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.companyName).toBe('Test Client');
    });

    it('should activate a client account', () => {
      const account = clientAccountService.createClientAccount(orgId, 'Test Client', '#000000', '#FFFFFF');
      const activated = clientAccountService.activateClientAccount(orgId, account.id);
      expect(activated).toBeDefined();
      expect(activated!.status).toBe('active');
    });

    it('should suspend a client account', () => {
      const account = clientAccountService.createClientAccount(orgId, 'Test Client', '#000000', '#FFFFFF');
      clientAccountService.activateClientAccount(orgId, account.id);
      const suspended = clientAccountService.suspendClientAccount(orgId, account.id);
      expect(suspended).toBeDefined();
      expect(suspended!.status).toBe('suspended');
    });

    it('should create a portal user', () => {
      const account = clientAccountService.createClientAccount(orgId, 'Test Client', '#000000', '#FFFFFF');
      const user = clientAccountService.createPortalUser(
        orgId,
        account.id,
        'user@example.com',
        'viewer'
      );
      expect(user).toBeDefined();
      expect(user.email).toBe('user@example.com');
      expect(user.accessLevel).toBe('viewer');
    });

    it('should update portal user access level', () => {
      const account = clientAccountService.createClientAccount(orgId, 'Test Client', '#000000', '#FFFFFF');
      const user = clientAccountService.createPortalUser(orgId, account.id, 'user@example.com', 'viewer');
      const updated = clientAccountService.updateUserAccessLevel(orgId, user.id, 'collaborator');
      expect(updated).toBeDefined();
      expect(updated!.accessLevel).toBe('collaborator');
    });

    it('should grant a permission', () => {
      const account = clientAccountService.createClientAccount(orgId, 'Test Client', '#000000', '#FFFFFF');
      const user = clientAccountService.createPortalUser(orgId, account.id, 'user@example.com', 'viewer');
      const permission = clientAccountService.grantPermission(
        orgId,
        user.id,
        'project',
        'proj-001',
        'editor'
      );
      expect(permission).toBeDefined();
      expect(permission.permissionLevel).toBe('editor');
    });

    it('should check if user has permission', () => {
      const account = clientAccountService.createClientAccount(orgId, 'Test Client', '#000000', '#FFFFFF');
      const user = clientAccountService.createPortalUser(orgId, account.id, 'user@example.com', 'viewer');
      clientAccountService.grantPermission(orgId, user.id, 'project', 'proj-001', 'editor');
      const hasPermission = clientAccountService.hasPermission(orgId, user.id, 'project', 'proj-001', 'editor');
      expect(hasPermission).toBe(true);
    });

    it('should update notification preference', () => {
      const account = clientAccountService.createClientAccount(orgId, 'Test Client', '#000000', '#FFFFFF');
      const user = clientAccountService.createPortalUser(orgId, account.id, 'user@example.com', 'viewer');
      const pref = clientAccountService.updateNotificationPreference(
        orgId,
        user.id,
        'project_update',
        'daily_digest',
        ['email', 'sms'],
        true
      );
      expect(pref).toBeDefined();
      expect(pref.frequency).toBe('daily_digest');
    });

    it('should retrieve organization client accounts', () => {
      clientAccountService.createClientAccount(orgId, 'Client 1', '#000000', '#FFFFFF');
      clientAccountService.createClientAccount(orgId, 'Client 2', '#000000', '#FFFFFF');
      const accounts = clientAccountService.getOrganizationClientAccounts(orgId);
      expect(accounts.length).toBeGreaterThanOrEqual(2);
    });

    it('should enforce organization isolation on client account retrieval', () => {
      const account = clientAccountService.createClientAccount(orgId, 'Test Client', '#000000', '#FFFFFF');
      const retrieved = clientAccountService.getClientAccountById(orgId2, account.id);
      expect(retrieved).toBeNull();
    });

    it('should delete a client account', () => {
      const account = clientAccountService.createClientAccount(orgId, 'Test Client', '#000000', '#FFFFFF');
      const deleted = clientAccountService.deleteClientAccount(orgId, account.id);
      expect(deleted).toBe(true);
    });
  });

  describe('ProjectViewService', () => {
    let clientAccount: any;

    beforeEach(() => {
      clientAccount = clientAccountService.createClientAccount(orgId, 'Test Client', '#000000', '#FFFFFF');
    });

    it('should create a project view for client', () => {
      const view = projectViewService.createProjectViewForClient(orgId, clientAccount.id, 'proj-001');
      expect(view).toBeDefined();
      expect(view.projectId).toBe('proj-001');
    });

    it('should retrieve client project view', () => {
      const created = projectViewService.createProjectViewForClient(orgId, clientAccount.id, 'proj-001');
      const retrieved = projectViewService.getClientProjectView(orgId, clientAccount.id, created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.projectId).toBe('proj-001');
    });

    it('should add deliverable to project view', () => {
      const view = projectViewService.createProjectViewForClient(orgId, clientAccount.id, 'proj-001');
      const deliverable = projectViewService.addDeliverableToView(
        orgId,
        clientAccount.id,
        view.id,
        'deliv-001',
        'Design Mockups',
        'in_review'
      );
      expect(deliverable).toBeDefined();
      expect(deliverable.deliverableName).toBe('Design Mockups');
    });

    it('should add feedback to deliverable', () => {
      const view = projectViewService.createProjectViewForClient(orgId, clientAccount.id, 'proj-001');
      projectViewService.addDeliverableToView(orgId, clientAccount.id, view.id, 'deliv-001', 'Design', 'pending');
      const feedback = projectViewService.addFeedbackToDeliverable(
        orgId,
        clientAccount.id,
        view.id,
        'deliv-001',
        'Please adjust colors'
      );
      expect(feedback).toBeDefined();
    });

    it('should acknowledge feedback', () => {
      const view = projectViewService.createProjectViewForClient(orgId, clientAccount.id, 'proj-001');
      projectViewService.addDeliverableToView(orgId, clientAccount.id, view.id, 'deliv-001', 'Design', 'pending');
      projectViewService.addFeedbackToDeliverable(orgId, clientAccount.id, view.id, 'deliv-001', 'Comment');
      const acknowledged = projectViewService.acknowledgeFeedback(
        orgId,
        clientAccount.id,
        view.id,
        'deliv-001'
      );
      expect(acknowledged).toBeDefined();
    });

    it('should create feedback request', () => {
      const view = projectViewService.createProjectViewForClient(orgId, clientAccount.id, 'proj-001');
      const feedbackRequest = projectViewService.createFeedbackRequest(
        orgId,
        clientAccount.id,
        view.id,
        'deliv-001',
        ['user-001', 'user-002']
      );
      expect(feedbackRequest).toBeDefined();
      expect(feedbackRequest.requiredParticipants.length).toBe(2);
    });

    it('should get feedback requests', () => {
      const view = projectViewService.createProjectViewForClient(orgId, clientAccount.id, 'proj-001');
      projectViewService.createFeedbackRequest(orgId, clientAccount.id, view.id, 'deliv-001', ['user-001']);
      const requests = projectViewService.getFeedbackRequests(orgId, clientAccount.id, view.id);
      expect(requests.length).toBeGreaterThan(0);
    });

    it('should add timeline event', () => {
      const view = projectViewService.createProjectViewForClient(orgId, clientAccount.id, 'proj-001');
      const timeline = projectViewService.addTimelineEvent(
        orgId,
        clientAccount.id,
        view.id,
        'Kickoff meeting',
        new Date('2026-11-01')
      );
      expect(timeline).toBeDefined();
    });

    it('should get project timeline', () => {
      const view = projectViewService.createProjectViewForClient(orgId, clientAccount.id, 'proj-001');
      projectViewService.addTimelineEvent(orgId, clientAccount.id, view.id, 'Event 1', new Date('2026-11-01'));
      projectViewService.addTimelineEvent(orgId, clientAccount.id, view.id, 'Event 2', new Date('2026-11-15'));
      const timeline = projectViewService.getProjectTimeline(orgId, clientAccount.id, view.id);
      expect(timeline.length).toBe(2);
    });

    it('should generate signed URL for file access', () => {
      const url = projectViewService.generateSignedUrl(
        orgId,
        clientAccount.id,
        'https://example.com/file.pdf'
      );
      expect(url).toContain('https://example.com/file.pdf');
      expect(url).toContain('token=');
    });

    it('should enforce organization isolation on project view retrieval', () => {
      const view = projectViewService.createProjectViewForClient(orgId, clientAccount.id, 'proj-001');
      const retrieved = projectViewService.getClientProjectView(orgId2, clientAccount.id, view.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('PortalService', () => {
    let clientAccount: any;

    beforeEach(() => {
      clientAccount = clientAccountService.createClientAccount(orgId, 'Test Client', '#000000', '#FFFFFF');
    });

    it('should create a message', () => {
      const message = portalService.createMessage(
        orgId,
        clientAccount.id,
        'user-001',
        'user-002',
        'Hello, how are you?'
      );
      expect(message).toBeDefined();
      expect(message.messageText).toBe('Hello, how are you?');
    });

    it('should retrieve message by ID', () => {
      const created = portalService.createMessage(orgId, clientAccount.id, 'user-001', 'user-002', 'Hello');
      const retrieved = portalService.getMessageById(orgId, created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.messageText).toBe('Hello');
    });

    it('should get thread messages', () => {
      const msg1 = portalService.createMessage(orgId, clientAccount.id, 'user-001', 'user-002', 'First');
      const msg2 = portalService.createMessage(
        orgId,
        clientAccount.id,
        'user-002',
        'user-001',
        'Reply',
        msg1.threadId
      );
      const messages = portalService.getThreadMessages(orgId, clientAccount.id, msg1.threadId);
      expect(messages.length).toBe(2);
    });

    it('should get client threads', () => {
      portalService.createMessage(orgId, clientAccount.id, 'user-001', 'user-002', 'Message 1');
      portalService.createMessage(orgId, clientAccount.id, 'user-002', 'user-001', 'Message 2');
      const threads = portalService.getClientThreads(orgId, clientAccount.id);
      expect(threads.length).toBeGreaterThan(0);
    });

    it('should mark message as read', () => {
      const message = portalService.createMessage(orgId, clientAccount.id, 'user-001', 'user-002', 'Test');
      const marked = portalService.markMessageAsRead(orgId, message.id);
      expect(marked).toBeDefined();
      expect(marked!.readAt).toBeDefined();
    });

    it('should record activity log', () => {
      const log = portalService.recordActivityLog(
        orgId,
        clientAccount.id,
        'user-001',
        'view_project',
        'project',
        'proj-001',
        '192.168.1.1',
        'Mozilla/5.0'
      );
      expect(log).toBeDefined();
      expect(log.action).toBe('view_project');
    });

    it('should get activity logs', () => {
      portalService.recordActivityLog(orgId, clientAccount.id, 'user-001', 'action1', 'project', 'proj-001', '192.168.1.1', 'Mozilla');
      portalService.recordActivityLog(orgId, clientAccount.id, 'user-001', 'action2', 'project', 'proj-002', '192.168.1.1', 'Mozilla');
      const logs = portalService.getActivityLogs(orgId, clientAccount.id);
      expect(logs.length).toBeGreaterThanOrEqual(2);
    });

    it('should get activity logs by portal user', () => {
      portalService.recordActivityLog(orgId, clientAccount.id, 'user-001', 'action1', 'project', 'proj-001', '192.168.1.1', 'Mozilla');
      const logs = portalService.getActivityLogsByPortalUser(orgId, clientAccount.id, 'user-001');
      expect(logs.length).toBeGreaterThan(0);
    });

    it('should enforce organization isolation on message retrieval', () => {
      const message = portalService.createMessage(orgId, clientAccount.id, 'user-001', 'user-002', 'Test');
      const retrieved = portalService.getMessageById(orgId2, message.id);
      expect(retrieved).toBeNull();
    });

    it('should delete a message', () => {
      const message = portalService.createMessage(orgId, clientAccount.id, 'user-001', 'user-002', 'Test');
      const deleted = portalService.deleteMessage(orgId, message.id);
      expect(deleted).toBe(true);
    });
  });

  describe('InvoiceViewService', () => {
    let clientAccount: any;

    beforeEach(() => {
      clientAccount = clientAccountService.createClientAccount(orgId, 'Test Client', '#000000', '#FFFFFF');
    });

    it('should create an invoice view', () => {
      const invoice = invoiceViewService.createInvoiceView(
        orgId,
        clientAccount.id,
        'INV-001',
        new Date('2026-11-01'),
        new Date('2026-11-30'),
        [{ id: 'li-001', description: 'Design Services', quantity: 10, unitPrice: 100, total: 1000 }],
        'pending',
        [],
        'Thank you for your business'
      );
      expect(invoice).toBeDefined();
      expect(invoice.invoiceNumber).toBe('INV-001');
      expect(invoice.total).toBeGreaterThan(0);
    });

    it('should retrieve client invoice view', () => {
      const created = invoiceViewService.createInvoiceView(
        orgId,
        clientAccount.id,
        'INV-002',
        new Date(),
        new Date(),
        [{ id: 'li-001', description: 'Service', quantity: 1, unitPrice: 100, total: 100 }],
        'pending',
        []
      );
      const retrieved = invoiceViewService.getClientInvoiceView(orgId, clientAccount.id, created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.invoiceNumber).toBe('INV-002');
    });

    it('should mark invoice as viewed', () => {
      const invoice = invoiceViewService.createInvoiceView(
        orgId,
        clientAccount.id,
        'INV-003',
        new Date(),
        new Date(),
        [{ id: 'li-001', description: 'Service', quantity: 1, unitPrice: 100, total: 100 }],
        'pending',
        []
      );
      const marked = invoiceViewService.markInvoiceAsViewed(orgId, clientAccount.id, invoice.id);
      expect(marked).toBeDefined();
      expect(marked!.viewedAt).toBeDefined();
    });

    it('should update payment status', () => {
      const invoice = invoiceViewService.createInvoiceView(
        orgId,
        clientAccount.id,
        'INV-004',
        new Date(),
        new Date(),
        [{ id: 'li-001', description: 'Service', quantity: 1, unitPrice: 100, total: 100 }],
        'pending',
        []
      );
      const updated = invoiceViewService.updatePaymentStatus(orgId, clientAccount.id, invoice.id, 'paid');
      expect(updated).toBeDefined();
      expect(updated!.paymentStatus).toBe('paid');
    });

    it('should validate payment method', () => {
      const method = {
        id: 'pm-001',
        type: 'bank_transfer',
        displayName: 'Main Bank',
        bankName: 'Bank ABC',
        accountNumber: '123456789'
      };
      const isValid = invoiceViewService.validatePaymentMethod(orgId, method as any);
      expect(isValid).toBe(true);
    });

    it('should get overdueInvoices', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      invoiceViewService.createInvoiceView(
        orgId,
        clientAccount.id,
        'INV-005',
        pastDate,
        pastDate,
        [{ id: 'li-001', description: 'Service', quantity: 1, unitPrice: 100, total: 100 }],
        'pending',
        []
      );
      const overdue = invoiceViewService.getOverdueInvoices(orgId, clientAccount.id);
      expect(overdue.length).toBeGreaterThan(0);
    });

    it('should get upcoming invoices', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);
      invoiceViewService.createInvoiceView(
        orgId,
        clientAccount.id,
        'INV-006',
        futureDate,
        futureDate,
        [{ id: 'li-001', description: 'Service', quantity: 1, unitPrice: 100, total: 100 }],
        'pending',
        []
      );
      const upcoming = invoiceViewService.getUpcomingInvoices(orgId, clientAccount.id, 30);
      expect(upcoming.length).toBeGreaterThan(0);
    });

    it('should get client invoice summary', () => {
      invoiceViewService.createInvoiceView(
        orgId,
        clientAccount.id,
        'INV-007',
        new Date(),
        new Date(),
        [{ id: 'li-001', description: 'Service', quantity: 1, unitPrice: 500, total: 500 }],
        'pending',
        []
      );
      const summary = invoiceViewService.getClientInvoiceSummary(orgId, clientAccount.id);
      expect(summary.totalInvoices).toBeGreaterThan(0);
      expect(summary.totalAmount).toBeGreaterThan(0);
    });

    it('should enforce organization isolation on invoice retrieval', () => {
      const invoice = invoiceViewService.createInvoiceView(
        orgId,
        clientAccount.id,
        'INV-008',
        new Date(),
        new Date(),
        [{ id: 'li-001', description: 'Service', quantity: 1, unitPrice: 100, total: 100 }],
        'pending',
        []
      );
      const retrieved = invoiceViewService.getClientInvoiceView(orgId2, clientAccount.id, invoice.id);
      expect(retrieved).toBeNull();
    });

    it('should delete an invoice', () => {
      const invoice = invoiceViewService.createInvoiceView(
        orgId,
        clientAccount.id,
        'INV-009',
        new Date(),
        new Date(),
        [{ id: 'li-001', description: 'Service', quantity: 1, unitPrice: 100, total: 100 }],
        'pending',
        []
      );
      const deleted = invoiceViewService.deleteInvoice(orgId, clientAccount.id, invoice.id);
      expect(deleted).toBe(true);
    });
  });

  describe('Organization Isolation Tests', () => {
    it('should prevent cross-organization data access', () => {
      const account1 = clientAccountService.createClientAccount(orgId, 'Org1 Client', '#000000', '#FFFFFF');
      const account2 = clientAccountService.createClientAccount(orgId2, 'Org2 Client', '#000000', '#FFFFFF');

      const retrieved1InOrg2 = clientAccountService.getClientAccountById(orgId2, account1.id);
      const retrieved2InOrg1 = clientAccountService.getClientAccountById(orgId, account2.id);

      expect(retrieved1InOrg2).toBeNull();
      expect(retrieved2InOrg1).toBeNull();
    });

    it('should prevent cross-organization message access', () => {
      const account1 = clientAccountService.createClientAccount(orgId, 'Client', '#000000', '#FFFFFF');
      const message = portalService.createMessage(orgId, account1.id, 'user-001', 'user-002', 'Test');

      const retrieved = portalService.getMessageById(orgId2, message.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('Integration Scenarios', () => {
    it('should complete a full client project access flow', () => {
      const account = clientAccountService.createClientAccount(orgId, 'Client Corp', '#FF5733', '#33FF57');
      const user = clientAccountService.createPortalUser(orgId, account.id, 'contact@client.com', 'viewer');
      
      const projectView = projectViewService.createProjectViewForClient(orgId, account.id, 'proj-2026');
      projectViewService.addDeliverableToView(orgId, account.id, projectView.id, 'deliv-001', 'Logo Design', 'in_review');
      
      const feedback = projectViewService.addFeedbackToDeliverable(
        orgId,
        account.id,
        projectView.id,
        'deliv-001',
        'Looks great! Minor color adjustment needed.'
      );

      expect(account).toBeDefined();
      expect(user).toBeDefined();
      expect(projectView).toBeDefined();
      expect(feedback).toBeDefined();
    });

    it('should complete a full messaging workflow', () => {
      const account = clientAccountService.createClientAccount(orgId, 'Client', '#000000', '#FFFFFF');
      const user1 = clientAccountService.createPortalUser(orgId, account.id, 'user1@client.com', 'collaborator');
      const user2 = clientAccountService.createPortalUser(orgId, account.id, 'user2@client.com', 'viewer');

      const msg1 = portalService.createMessage(orgId, account.id, user1.id, user2.id, 'Can you review this?');
      const msg2 = portalService.createMessage(orgId, account.id, user2.id, user1.id, 'Sure!', msg1.threadId);

      const thread = portalService.getThreadMessages(orgId, account.id, msg1.threadId);
      expect(thread.length).toBe(2);

      portalService.recordActivityLog(orgId, account.id, user1.id, 'send_message', 'message', msg1.id, '192.168.1.1', 'Mozilla');
      const logs = portalService.getActivityLogs(orgId, account.id);
      expect(logs.length).toBeGreaterThan(0);
    });

    it('should complete a full invoice management workflow', () => {
      const account = clientAccountService.createClientAccount(orgId, 'Client', '#000000', '#FFFFFF');
      
      const invoice = invoiceViewService.createInvoiceView(
        orgId,
        account.id,
        'INV-2026-001',
        new Date('2026-11-01'),
        new Date('2026-11-30'),
        [
          { id: 'li-001', description: 'Design Services', quantity: 20, unitPrice: 100, total: 2000 },
          { id: 'li-002', description: 'Development', quantity: 40, unitPrice: 150, total: 6000 }
        ],
        'pending',
        [
          { id: 'pm-001', type: 'bank_transfer', displayName: 'Wire Transfer', bankName: 'ABC Bank', accountNumber: '123456' }
        ]
      );

      invoiceViewService.markInvoiceAsViewed(orgId, account.id, invoice.id);
      const updated = invoiceViewService.updatePaymentStatus(orgId, account.id, invoice.id, 'paid');
      const summary = invoiceViewService.getClientInvoiceSummary(orgId, account.id);

      expect(invoice.total).toBeGreaterThan(0);
      expect(updated!.paymentStatus).toBe('paid');
      expect(summary.totalAmount).toBeGreaterThan(0);
    });
  });
});
