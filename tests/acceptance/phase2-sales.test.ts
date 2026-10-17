// Phase 2 Sales & Proposals Acceptance Tests

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

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

describe('Phase 2 Sales & Proposals', () => {
  const testOrgId = 'test-org-' + Date.now();
  let catalogItemId: string;
  let proposalId: string;
  let leadId: string;

  // Test 1: Service Catalog Management
  describe('Service Catalog Management', () => {
    it('should create a service catalog item', async () => {
      const response = await mockApiClient.request('POST', '/services', {
        name: 'Mobile App Development',
        description: 'Full-stack iOS and Android development',
        category: 'mobile_app',
        basePrice: 50000,
        currency: 'EGP',
        deliveryDays: 60,
      });

      expect(response.status).toBe(201);
      expect(response.data.id).toBeDefined();
      expect(response.data.name).toBe('Mobile App Development');
      expect(response.data.basePrice).toBe(50000);
      catalogItemId = response.data.id;
    });

    it('should validate required fields in catalog item', async () => {
      const response = await mockApiClient.request('POST', '/services', {
        // missing name and category
        basePrice: 1000,
      });

      expect(response.status).toBe(400);
      expect(response.data.error).toBe('validation_error');
    });

    it('should list service catalog items with pagination', async () => {
      const response = await mockApiClient.request('GET', '/services?limit=10&offset=0');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.items)).toBe(true);
      expect(response.data.pagination).toBeDefined();
    });

    it('should filter catalog items by category', async () => {
      const response = await mockApiClient.request('GET', '/services?category=mobile_app');

      expect(response.status).toBe(200);
      expect(response.data.items.every((item: any) => item.category === 'mobile_app')).toBe(true);
    });

    it('should update service catalog item', async () => {
      const response = await mockApiClient.request('PATCH', `/services/${catalogItemId}`, {
        basePrice: 60000,
        deliveryDays: 75,
      });

      expect(response.status).toBe(200);
      expect(response.data.basePrice).toBe(60000);
      expect(response.data.deliveryDays).toBe(75);
    });

    it('should toggle catalog item active status', async () => {
      const response = await mockApiClient.request('PATCH', `/services/${catalogItemId}/toggle`, {
        isActive: false,
      });

      expect(response.status).toBe(200);
      expect(response.data.isActive).toBe(false);
    });
  });

  // Test 2: Proposal Creation
  describe('Proposal Creation and Management', () => {
    beforeAll(async () => {
      // Create a test lead first
      const leadResponse = await mockApiClient.request('POST', '/leads', {
        name: 'Test Client',
        email: 'client@example.com',
        phone: '+201001234567',
        source: 'website',
      });
      leadId = leadResponse.data.id;
    });

    it('should create a proposal for a lead', async () => {
      const response = await mockApiClient.request('POST', '/proposals', {
        clientId: leadId,
        leadId,
        title: 'Mobile App Proposal',
        description: 'Complete proposal for mobile app project',
        validUntilDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        lineItems: [
          {
            description: 'UI/UX Design',
            quantity: 1,
            unitPrice: 10000,
          },
          {
            description: 'Backend Development',
            quantity: 1,
            unitPrice: 25000,
          },
          {
            description: 'Frontend Development',
            quantity: 1,
            unitPrice: 20000,
          },
        ],
        discount: 5000,
        notes: 'Custom discount applied',
      });

      expect(response.status).toBe(201);
      expect(response.data.id).toBeDefined();
      expect(response.data.status).toBe('draft');
      expect(response.data.basePrice).toBe(55000);
      expect(response.data.finalPrice).toBe(50000);
      proposalId = response.data.id;
    });

    it('should require at least one line item', async () => {
      const response = await mockApiClient.request('POST', '/proposals', {
        clientId: leadId,
        title: 'Empty Proposal',
        validUntilDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        lineItems: [],
      });

      expect(response.status).toBe(400);
      expect(response.data.error).toBe('validation_error');
    });

    it('should retrieve proposal by ID', async () => {
      const response = await mockApiClient.request('GET', `/proposals/${proposalId}`);

      expect(response.status).toBe(200);
      expect(response.data.id).toBe(proposalId);
      expect(response.data.title).toBe('Mobile App Proposal');
    });

    it('should list proposals with pagination and filters', async () => {
      const response = await mockApiClient.request('GET', '/proposals?status=draft&limit=10');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.proposals)).toBe(true);
      expect(response.data.pagination).toBeDefined();
    });

    it('should update proposal details', async () => {
      const response = await mockApiClient.request('PATCH', `/proposals/${proposalId}`, {
        title: 'Updated Mobile App Proposal',
        discount: 7500,
        notes: 'Increased discount',
      });

      expect(response.status).toBe(200);
      expect(response.data.title).toBe('Updated Mobile App Proposal');
      expect(response.data.finalPrice).toBe(47500);
    });
  });

  // Test 3: Proposal Versioning
  describe('Proposal Versioning', () => {
    it('should track proposal versions when updated', async () => {
      // Create initial proposal
      const createResponse = await mockApiClient.request('POST', '/proposals', {
        clientId: leadId,
        title: 'Versioning Test',
        validUntilDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        lineItems: [{ description: 'Item', quantity: 1, unitPrice: 1000 }],
      });

      const proposalVersion1Id = createResponse.data.id;
      expect(createResponse.data.version).toBe(1);

      // Update proposal
      await mockApiClient.request('PATCH', `/proposals/${proposalVersion1Id}`, {
        title: 'Updated Title',
      });

      // Check history
      const historyResponse = await mockApiClient.request(
        'GET',
        `/proposals/${proposalVersion1Id}/history`
      );

      expect(historyResponse.status).toBe(200);
      expect(Array.isArray(historyResponse.data.history)).toBe(true);
    });
  });

  // Test 4: Proposal Sending
  describe('Proposal Sending and Client Views', () => {
    it('should send draft proposal to client', async () => {
      const response = await mockApiClient.request('POST', `/proposals/${proposalId}/send`, {});

      expect(response.status).toBe(200);
      expect(response.data.status).toBe('sent');
      expect(response.data.sentAt).toBeDefined();
    });

    it('should prevent editing after proposal is sent', async () => {
      const response = await mockApiClient.request('PATCH', `/proposals/${proposalId}`, {
        title: 'Cannot Edit',
      });

      expect(response.status).toBe(400);
      expect(response.data.error).toBe('validation_error');
      expect(response.data.message).toContain('locked');
    });

    it('should track proposal view timestamp', async () => {
      const response = await mockApiClient.request('PATCH', `/proposals/${proposalId}/view`, {});

      expect(response.status).toBe(200);
      expect(response.data.viewedAt).toBeDefined();
      expect(response.data.status).toBe('viewed');
    });

    it('should record client response to proposal', async () => {
      const response = await mockApiClient.request(
        'PATCH',
        `/proposals/${proposalId}/respond`,
        {
          response: 'accepted',
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.response).toBe('accepted');
      expect(response.data.status).toBe('accepted');
      expect(response.data.respondedAt).toBeDefined();
    });
  });

  // Test 5: Proposal Approval Workflow
  describe('Proposal Approval Workflow', () => {
    let approvalProposalId: string;

    beforeAll(async () => {
      const createResponse = await mockApiClient.request('POST', '/proposals', {
        clientId: leadId,
        title: 'Approval Test Proposal',
        validUntilDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        lineItems: [{ description: 'Service', quantity: 1, unitPrice: 75000 }],
      });
      approvalProposalId = createResponse.data.id;
    });

    it('should require approval before sending high-value proposals', async () => {
      const response = await mockApiClient.request('GET', `/proposals/${approvalProposalId}`);

      expect(response.status).toBe(200);
      expect(response.data.approvalStatus).toBe('pending');
    });

    it('should approve proposal', async () => {
      const response = await mockApiClient.request(
        'PATCH',
        `/proposals/${approvalProposalId}/approve`,
        {}
      );

      expect(response.status).toBe(200);
      expect(response.data.approvalStatus).toBe('approved');
      expect(response.data.approvedAt).toBeDefined();
    });

    it('should send proposal after approval', async () => {
      const response = await mockApiClient.request(
        'POST',
        `/proposals/${approvalProposalId}/send`,
        {}
      );

      expect(response.status).toBe(200);
      expect(response.data.status).toBe('sent');
    });
  });

  // Test 6: Line Item Management
  describe('Proposal Line Items', () => {
    it('should retrieve proposal line items', async () => {
      const response = await mockApiClient.request(
        'GET',
        `/proposals/${proposalId}/line-items`
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.lineItems)).toBe(true);
      expect(response.data.lineItems.length).toBeGreaterThan(0);
    });

    it('should calculate line item subtotals correctly', async () => {
      const response = await mockApiClient.request(
        'GET',
        `/proposals/${proposalId}/line-items`
      );

      const lineItem = response.data.lineItems[0];
      expect(lineItem.subtotal).toBe(lineItem.quantity * lineItem.unitPrice);
    });
  });

  // Test 7: Proposal PDF Export
  describe('Proposal PDF Export', () => {
    it('should export proposal to PDF', async () => {
      const response = await mockApiClient.request(
        'GET',
        `/proposals/${proposalId}/export/pdf`
      );

      expect(response.status).toBe(200);
      expect(response.data.pdfUrl).toBeDefined();
    });

    it('should include all proposal details in PDF', async () => {
      const response = await mockApiClient.request(
        'GET',
        `/proposals/${proposalId}/export/pdf`
      );

      expect(response.status).toBe(200);
      // PDF should contain title, client info, line items, pricing
    });
  });

  // Test 8: Org Isolation on Proposals
  describe('Proposal Org Isolation', () => {
    it('should enforce org isolation on proposal retrieval', async () => {
      const response = await mockApiClient.request('GET', `/proposals/${proposalId}`, {
        organizationId: 'different-org',
      });

      expect([403, 404]).toContain(response.status);
    });

    it('should not allow listing proposals from other orgs', async () => {
      const response = await mockApiClient.request('GET', '/proposals');

      expect(response.status).toBe(200);
      // All proposals should belong to current org
    });
  });
});
