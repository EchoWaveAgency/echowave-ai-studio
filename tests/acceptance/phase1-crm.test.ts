// Phase 1 CRM Acceptance Tests
// E2E tests for lead capture, CRM operations, and opportunity tracking

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Mock API client for tests
const mockApiClient = {
  async request(method: string, path: string, data?: any) {
    const baseUrl = process.env.API_URL || 'http://localhost:3000/api/v1';
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TEST_TOKEN}`,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    return {
      status: response.status,
      data: await response.json(),
    };
  },
};

describe('Phase 1 CRM Acceptance Tests', () => {
  const testOrgId = 'test-org-' + Date.now();
  let leadId: string;
  let contactId: string;
  let opportunityId: string;

  // Test 1: Lead Capture from Website Form
  describe('Lead Capture (Website Form)', () => {
    it('should create a new lead from website form', async () => {
      const response = await mockApiClient.request('POST', '/leads', {
        name: 'Ahmed Hassan',
        email: 'ahmed.hassan@example.com',
        phone: '+201001234567',
        message: 'Interested in mobile app development for e-commerce',
        serviceInterest: 'mobile_app',
        source: 'website',
      });

      expect(response.status).toBe(201);
      expect(response.data.id).toBeDefined();
      expect(response.data.status).toBe('new');
      expect(response.data.source).toBe('website');
      leadId = response.data.id;
    });

    it('should validate required fields on lead creation', async () => {
      const response = await mockApiClient.request('POST', '/leads', {
        name: 'Test',
        // missing email
      });

      expect(response.status).toBe(400);
      expect(response.data.error).toBe('validation_error');
      expect(response.data.fields.email).toBeDefined();
    });

    it('should reject invalid email format', async () => {
      const response = await mockApiClient.request('POST', '/leads', {
        name: 'Test User',
        email: 'invalid-email',
        source: 'website',
      });

      expect(response.status).toBe(400);
      expect(response.data.fields.email).toBeDefined();
    });

    it('should track lead source accurately', async () => {
      const response = await mockApiClient.request('POST', '/leads', {
        name: 'Referral Lead',
        email: 'referral@example.com',
        source: 'referral',
      });

      expect(response.status).toBe(201);
      expect(response.data.source).toBe('referral');
    });
  });

  // Test 2: Lead Management Workflow
  describe('Lead Management Workflow', () => {
    it('should retrieve a specific lead by ID', async () => {
      const response = await mockApiClient.request('GET', `/leads/${leadId}`);

      expect(response.status).toBe(200);
      expect(response.data.id).toBe(leadId);
      expect(response.data.email).toBe('ahmed.hassan@example.com');
    });

    it('should list all leads with pagination', async () => {
      const response = await mockApiClient.request('GET', '/leads?limit=10&offset=0');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.pagination).toBeDefined();
      expect(response.data.pagination.limit).toBe(10);
    });

    it('should filter leads by status', async () => {
      const response = await mockApiClient.request('GET', '/leads?status=new');

      expect(response.status).toBe(200);
      expect(response.data.data.every((lead: any) => lead.status === 'new')).toBe(true);
    });

    it('should filter leads by source', async () => {
      const response = await mockApiClient.request('GET', '/leads?source=website');

      expect(response.status).toBe(200);
      expect(response.data.data.every((lead: any) => lead.source === 'website')).toBe(true);
    });

    it('should search leads by name or email', async () => {
      const response = await mockApiClient.request('GET', '/leads?search=Ahmed');

      expect(response.status).toBe(200);
      expect(response.data.data.length).toBeGreaterThan(0);
      expect(
        response.data.data[0].name.toLowerCase().includes('ahmed') ||
        response.data.data[0].email.toLowerCase().includes('ahmed')
      ).toBe(true);
    });

    it('should update lead status from new to contacted', async () => {
      const response = await mockApiClient.request('PATCH', `/leads/${leadId}`, {
        status: 'contacted',
        notes: 'Initial call scheduled for tomorrow',
      });

      expect(response.status).toBe(200);
      expect(response.data.status).toBe('contacted');
      expect(response.data.lastContactedAt).toBeDefined();
    });

    it('should update lead status to qualified', async () => {
      const response = await mockApiClient.request('PATCH', `/leads/${leadId}`, {
        status: 'qualified',
        notes: 'Budget approved, timeline confirmed',
      });

      expect(response.status).toBe(200);
      expect(response.data.status).toBe('qualified');
    });

    it('should reject invalid status values', async () => {
      const response = await mockApiClient.request('PATCH', `/leads/${leadId}`, {
        status: 'invalid_status',
      });

      expect(response.status).toBe(400);
    });

    it('should track lead statistics by status', async () => {
      const response = await mockApiClient.request('GET', '/leads/stats');

      expect(response.status).toBe(200);
      expect(response.data.total).toBeGreaterThan(0);
      expect(response.data.byStatus).toBeDefined();
      expect(response.data.bySource).toBeDefined();
    });
  });

  // Test 3: Contact Management
  describe('Contact Management', () => {
    it('should create a new contact', async () => {
      const response = await mockApiClient.request('POST', '/contacts', {
        firstName: 'Ahmed',
        lastName: 'Hassan',
        email: 'ahmed.hassan@example.com',
        phone: '+201001234567',
        address: '123 Business Street',
        city: 'Cairo',
        country: 'Egypt',
        postalCode: '11111',
        consentMarketing: true,
        consentEmail: true,
        consentPhone: false,
      });

      expect(response.status).toBe(201);
      expect(response.data.id).toBeDefined();
      expect(response.data.firstName).toBe('Ahmed');
      contactId = response.data.id;
    });

    it('should validate first and last names are required', async () => {
      const response = await mockApiClient.request('POST', '/contacts', {
        firstName: 'Ahmed',
        // missing lastName
      });

      expect(response.status).toBe(400);
      expect(response.data.fields.lastName).toBeDefined();
    });

    it('should validate email format if provided', async () => {
      const response = await mockApiClient.request('POST', '/contacts', {
        firstName: 'Test',
        lastName: 'User',
        email: 'invalid-email',
      });

      expect(response.status).toBe(400);
    });

    it('should retrieve a contact by ID', async () => {
      const response = await mockApiClient.request('GET', `/contacts/${contactId}`);

      expect(response.status).toBe(200);
      expect(response.data.id).toBe(contactId);
    });

    it('should list all contacts with pagination', async () => {
      const response = await mockApiClient.request('GET', '/contacts?limit=10&offset=0');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.pagination).toBeDefined();
    });

    it('should update contact details', async () => {
      const response = await mockApiClient.request('PATCH', `/contacts/${contactId}`, {
        email: 'ahmed.new@example.com',
        city: 'Alexandria',
      });

      expect(response.status).toBe(200);
      expect(response.data.email).toBe('ahmed.new@example.com');
      expect(response.data.city).toBe('Alexandria');
    });

    it('should update contact consent preferences', async () => {
      const response = await mockApiClient.request('PATCH', `/contacts/${contactId}/consent`, {
        marketing: false,
        email: true,
        phone: false,
      });

      expect(response.status).toBe(200);
      expect(response.data.consentMarketing).toBe(false);
      expect(response.data.consentEmail).toBe(true);
    });

    it('should search contacts by name or email', async () => {
      const response = await mockApiClient.request('GET', '/contacts/search?q=Ahmed');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  // Test 4: Opportunity Management
  describe('Opportunity Management', () => {
    it('should create a new opportunity for a lead', async () => {
      const response = await mockApiClient.request('POST', '/opportunities', {
        leadId,
        title: 'Mobile App Development Project',
        description: 'iOS and Android app for e-commerce platform',
        value: 75000,
        currency: 'EGP',
        stage: 'prospect',
        expectedCloseDate: '2026-12-31',
        probability: 25,
        notes: 'Initial scope discussion completed',
      });

      expect(response.status).toBe(201);
      expect(response.data.id).toBeDefined();
      expect(response.data.leadId).toBe(leadId);
      expect(response.data.stage).toBe('prospect');
      opportunityId = response.data.id;
    });

    it('should require lead ID for opportunity', async () => {
      const response = await mockApiClient.request('POST', '/opportunities', {
        title: 'Test Opportunity',
        stage: 'prospect',
        currency: 'EGP',
        // missing leadId
      });

      expect(response.status).toBe(400);
    });

    it('should retrieve an opportunity by ID', async () => {
      const response = await mockApiClient.request('GET', `/opportunities/${opportunityId}`);

      expect(response.status).toBe(200);
      expect(response.data.id).toBe(opportunityId);
    });

    it('should list opportunities with pagination', async () => {
      const response = await mockApiClient.request('GET', '/opportunities?limit=10&offset=0');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should filter opportunities by stage', async () => {
      const response = await mockApiClient.request('GET', '/opportunities?stage=prospect');

      expect(response.status).toBe(200);
      expect(response.data.data.every((opp: any) => opp.stage === 'prospect')).toBe(true);
    });

    it('should filter opportunities by lead ID', async () => {
      const response = await mockApiClient.request('GET', `/opportunities?leadId=${leadId}`);

      expect(response.status).toBe(200);
      expect(response.data.data.every((opp: any) => opp.leadId === leadId)).toBe(true);
    });

    it('should move opportunity through sales pipeline', async () => {
      let response = await mockApiClient.request('PATCH', `/opportunities/${opportunityId}/stage`, {
        stage: 'qualified',
      });
      expect(response.status).toBe(200);
      expect(response.data.stage).toBe('qualified');

      response = await mockApiClient.request('PATCH', `/opportunities/${opportunityId}/stage`, {
        stage: 'proposal',
      });
      expect(response.status).toBe(200);
      expect(response.data.stage).toBe('proposal');
    });

    it('should update opportunity details without changing stage', async () => {
      const response = await mockApiClient.request('PATCH', `/opportunities/${opportunityId}`, {
        title: 'Mobile App & Web Platform Development',
        value: 100000,
        probability: 60,
      });

      expect(response.status).toBe(200);
      expect(response.data.value).toBe(100000);
      expect(response.data.probability).toBe(60);
    });

    it('should calculate pipeline summary by stage', async () => {
      const response = await mockApiClient.request('GET', '/opportunities/pipeline/summary');

      expect(response.status).toBe(200);
      expect(response.data.byStage).toBeDefined();
      expect(response.data.totalValue).toBeGreaterThan(0);
      expect(response.data.opportunityCount).toBeGreaterThan(0);
    });

    it('should calculate revenue forecast weighted by probability', async () => {
      const response = await mockApiClient.request('GET', '/opportunities/forecast');

      expect(response.status).toBe(200);
      expect(typeof response.data.forecast).toBe('number');
      expect(response.data.forecast).toBeGreaterThanOrEqual(0);
    });
  });

  // Test 5: Lead-Contact-Opportunity Linking
  describe('Lead-Contact-Opportunity Linking', () => {
    it('should attach contact to lead', async () => {
      const response = await mockApiClient.request('PATCH', `/leads/${leadId}`, {
        contactId,
      });

      expect(response.status).toBe(200);
      expect(response.data.contactId).toBe(contactId);
    });

    it('should attach opportunity to lead', async () => {
      const response = await mockApiClient.request('PATCH', `/leads/${leadId}`, {
        opportunityId,
      });

      expect(response.status).toBe(200);
      expect(response.data.opportunityId).toBe(opportunityId);
    });
  });

  // Test 6: Tenant Isolation (org_id enforcement)
  describe('Tenant Isolation', () => {
    it('should enforce org isolation on lead retrieval', async () => {
      // Attempt to get lead from different org should fail
      const response = await mockApiClient.request('GET', `/leads/${leadId}`, {
        organizationId: 'different-org',
      });

      // Should either return 403 (forbidden) or 404 (not found)
      expect([403, 404]).toContain(response.status);
    });

    it('should enforce org isolation on contact updates', async () => {
      const response = await mockApiClient.request('PATCH', `/contacts/${contactId}`, {
        organizationId: 'different-org',
        firstName: 'Hacker',
      });

      expect([403, 404]).toContain(response.status);
    });

    it('should not allow querying leads from other orgs', async () => {
      const response = await mockApiClient.request('GET', '/leads?organizationId=different-org');

      expect(response.status).toBe(200);
      expect(response.data.data.every((lead: any) => lead.organizationId === testOrgId)).toBe(true);
    });
  });

  // Test 7: Audit Trail
  describe('Audit Trail', () => {
    it('should log lead creation in audit trail', async () => {
      // Verify audit logs exist for lead operations
      // This would typically be queried from audit_events table
      const response = await mockApiClient.request('GET', `/audit?resourceType=lead&resourceId=${leadId}`);

      expect(response.status).toBe(200);
      expect(response.data.some((event: any) => event.operation === 'CREATE')).toBe(true);
    });

    it('should log lead status changes', async () => {
      const response = await mockApiClient.request('GET', `/audit?resourceType=lead&resourceId=${leadId}`);

      expect(response.status).toBe(200);
      expect(response.data.some((event: any) => event.operation === 'UPDATE')).toBe(true);
    });
  });

  // Test 8: Bulk CSV Import
  describe('Bulk CSV Lead Import', () => {
    it('should import multiple leads from CSV file', async () => {
      const csvContent = `name,email,phone,serviceInterest,source
John Smith,john@example.com,+201001234567,web_design,referral
Jane Doe,jane@example.com,+201009876543,mobile_app,email`;

      const response = await mockApiClient.request('POST', '/leads/import', {
        csvContent,
        source: 'import',
      });

      expect(response.status).toBe(201);
      expect(response.data.imported).toBe(2);
      expect(response.data.errors).toHaveLength(0);
    });

    it('should validate CSV format before import', async () => {
      const invalidCsvContent = `invalid,format
data,missing,email`;

      const response = await mockApiClient.request('POST', '/leads/import', {
        csvContent: invalidCsvContent,
        source: 'import',
      });

      expect(response.status).toBe(400);
      expect(response.data.error).toBe('validation_error');
    });
  });

  // Test 9: Duplicate Lead Detection
  describe('Duplicate Lead Detection', () => {
    it('should detect duplicate leads by email', async () => {
      const response = await mockApiClient.request('POST', '/leads', {
        name: 'Duplicate Test',
        email: 'ahmed.hassan@example.com', // Same email as first test lead
        phone: '+201005555555',
        source: 'website',
      });

      expect(response.status).toBe(409);
      expect(response.data.error).toBe('duplicate_error');
      expect(response.data.existingLeadId).toBeDefined();
    });
  });

  // Test 10: Lead-Opportunity Linking Workflow
  describe('Lead-Opportunity Linking Workflow', () => {
    it('should automatically link opportunity when creating for a lead', async () => {
      const response = await mockApiClient.request('POST', '/opportunities', {
        leadId,
        title: 'Linked Opportunity',
        value: 50000,
        currency: 'EGP',
        stage: 'prospect',
      });

      expect(response.status).toBe(201);
      expect(response.data.leadId).toBe(leadId);
    });

    it('should retrieve all opportunities for a lead', async () => {
      const response = await mockApiClient.request('GET', `/leads/${leadId}/opportunities`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.opportunities)).toBe(true);
      expect(response.data.opportunities.length).toBeGreaterThan(0);
    });
  });

  // Test 11: Contact Attachment to Lead
  describe('Contact Attachment to Lead', () => {
    it('should attach created contact to existing lead', async () => {
      const response = await mockApiClient.request('PATCH', `/leads/${leadId}`, {
        contactId,
      });

      expect(response.status).toBe(200);
      expect(response.data.contactId).toBe(contactId);
    });
  });

  // Test 12: Communication History Tracking
  describe('Communication History Tracking', () => {
    it('should record communication history entry for a contact', async () => {
      const response = await mockApiClient.request('POST', `/contacts/${contactId}/communications`, {
        type: 'email',
        subject: 'Project Discussion',
        body: 'Discussed project timeline and budget',
        direction: 'outbound',
        status: 'sent',
      });

      expect(response.status).toBe(201);
      expect(response.data.id).toBeDefined();
      expect(response.data.type).toBe('email');
    });

    it('should retrieve communication history for a contact', async () => {
      const response = await mockApiClient.request('GET', `/contacts/${contactId}/communications`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.communications)).toBe(true);
      expect(response.data.communications.length).toBeGreaterThan(0);
    });
  });

  // Test 13: Email Notification Verification
  describe('Email Notifications', () => {
    it('should send email notification on new lead creation', async () => {
      const response = await mockApiClient.request('POST', '/leads', {
        name: 'Notification Test',
        email: 'notify@example.com',
        phone: '+201002222222',
        serviceInterest: 'branding',
        source: 'website',
      });

      expect(response.status).toBe(201);

      // Verify notification was queued
      const notificationCheck = await mockApiClient.request('GET', `/notifications?leadId=${response.data.id}`);
      expect(notificationCheck.status).toBe(200);
      expect(notificationCheck.data.some((n: any) => n.type === 'lead.created')).toBe(true);
    });

    it('should send email notification on lead status change to qualified', async () => {
      const response = await mockApiClient.request('PATCH', `/leads/${leadId}`, {
        status: 'qualified',
      });

      expect(response.status).toBe(200);

      // Verify notification was queued
      const notificationCheck = await mockApiClient.request('GET', `/notifications?leadId=${leadId}`);
      expect(notificationCheck.status).toBe(200);
      expect(notificationCheck.data.some((n: any) => n.type === 'lead.status_changed' && n.newStatus === 'qualified')).toBe(true);
    });
  });
});
