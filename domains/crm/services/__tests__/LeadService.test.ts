import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LeadService } from '../LeadService';
import { NotFoundError, ValidationError } from '../../../../platform/errors/errors';
import * as db from '../../../../platform/database/connection';

vi.mock('../../../../platform/database/connection');
vi.mock('../../../../platform/logging/logger', () => ({
  defaultLogger: {
    info: vi.fn(),
    audit: vi.fn(),
  },
}));

describe('LeadService', () => {
  let service: LeadService;
  const mockOrgId = '123e4567-e89b-12d3-a456-426614174000';
  const mockLeadId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    service = new LeadService();
    vi.clearAllMocks();
  });

  describe('createLead', () => {
    it('should create a lead with valid input', async () => {
      const mockLead = {
        id: mockLeadId,
        organizationId: mockOrgId,
        name: 'Ahmed Hassan',
        email: 'ahmed@example.com',
        phone: '+201001234567',
        message: 'Interested in mobile app',
        serviceInterest: 'mobile_app',
        status: 'new',
        source: 'website',
        score: null,
        notes: null,
        contactId: null,
        opportunityId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastContactedAt: null,
      };

      const mockClient = {
        query: vi.fn()
          .mockResolvedValueOnce({ rows: [mockLead] }) // INSERT
          .mockResolvedValueOnce({ rows: [] }), // audit log
      };

      vi.mocked(db.transaction).mockResolvedValueOnce(mockLead);
      vi.mocked(db.query).mockResolvedValueOnce({ rows: [] }); // org exists check (implied)

      const result = await service.createLead(mockOrgId, {
        name: 'Ahmed Hassan',
        email: 'ahmed@example.com',
        phone: '+201001234567',
        message: 'Interested in mobile app',
        serviceInterest: 'mobile_app',
        status: 'new',
        source: 'website',
      });

      expect(result.id).toBe(mockLeadId);
      expect(result.email).toBe('ahmed@example.com');
      expect(result.status).toBe('new');
    });

    it('should reject invalid email format', async () => {
      await expect(
        service.createLead(mockOrgId, {
          name: 'Ahmed Hassan',
          email: 'invalid-email',
          status: 'new',
          source: 'website',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should reject empty name', async () => {
      await expect(
        service.createLead(mockOrgId, {
          name: '',
          email: 'ahmed@example.com',
          status: 'new',
          source: 'website',
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getLeadById', () => {
    it('should retrieve a lead by ID with org isolation', async () => {
      const mockLead = {
        id: mockLeadId,
        organizationId: mockOrgId,
        name: 'Ahmed Hassan',
        email: 'ahmed@example.com',
        status: 'new',
        source: 'website',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.query).mockResolvedValueOnce({ rows: [mockLead] });

      const result = await service.getLeadById(mockLeadId, mockOrgId);

      expect(result.id).toBe(mockLeadId);
      expect(result.email).toBe('ahmed@example.com');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('organization_id'),
        [mockLeadId, mockOrgId]
      );
    });

    it('should throw NotFoundError when lead does not exist', async () => {
      vi.mocked(db.query).mockResolvedValueOnce({ rows: [] });

      await expect(service.getLeadById(mockLeadId, mockOrgId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getOrganizationLeads', () => {
    it('should retrieve all leads with pagination', async () => {
      const mockLeads = [
        { id: mockLeadId, name: 'Ahmed', email: 'ahmed@example.com', status: 'new' },
        { id: '660e8400-e29b-41d4-a716-446655440000', name: 'Fatima', email: 'fatima@example.com', status: 'contacted' },
      ];

      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }) // count query
        .mockResolvedValueOnce({ rows: mockLeads }); // select query

      const result = await service.getOrganizationLeads(mockOrgId, undefined, 50, 0);

      expect(result.leads).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter leads by status', async () => {
      const mockLeads = [{ id: mockLeadId, status: 'qualified' }];

      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: mockLeads });

      const result = await service.getOrganizationLeads(
        mockOrgId,
        { status: 'qualified' },
        50,
        0
      );

      expect(result.leads[0].status).toBe('qualified');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('status'),
        expect.arrayContaining(['qualified'])
      );
    });

    it('should search leads by name or email', async () => {
      const mockLeads = [{ id: mockLeadId, name: 'Ahmed', email: 'ahmed@example.com' }];

      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: mockLeads });

      const result = await service.getOrganizationLeads(
        mockOrgId,
        { search: 'Ahmed' },
        50,
        0
      );

      expect(result.leads).toHaveLength(1);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.arrayContaining(['%Ahmed%'])
      );
    });
  });

  describe('updateLeadStatus', () => {
    it('should update lead status and record last contacted', async () => {
      const mockLead = {
        id: mockLeadId,
        organizationId: mockOrgId,
        status: 'new',
        lastContactedAt: null,
      };

      const updatedLead = {
        ...mockLead,
        status: 'contacted',
        lastContactedAt: new Date(),
      };

      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [mockLead] }) // get current
        .mockResolvedValueOnce({ rows: [updatedLead] }) // update
        .mockResolvedValueOnce({ rows: [] }); // audit log

      const result = await service.updateLeadStatus(mockLeadId, mockOrgId, 'contacted', 'Initial call made');

      expect(result.status).toBe('contacted');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE leads'),
        expect.arrayContaining(['contacted'])
      );
    });

    it('should reject invalid status', async () => {
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: [{ id: mockLeadId, status: 'new' }],
      });

      await expect(
        service.updateLeadStatus(mockLeadId, mockOrgId, 'invalid_status')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('searchLeads', () => {
    it('should search leads by name or email', async () => {
      const mockLeads = [
        { id: mockLeadId, name: 'Ahmed Hassan', email: 'ahmed@example.com' },
      ];

      vi.mocked(db.query).mockResolvedValueOnce({ rows: mockLeads });

      const result = await service.searchLeads(mockOrgId, 'Ahmed', 20);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Ahmed Hassan');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        [mockOrgId, '%Ahmed%', 20]
      );
    });
  });

  describe('getLeadStats', () => {
    it('should return lead statistics by status and source', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce({
          rows: [
            { status: 'new', count: '10' },
            { status: 'contacted', count: '5' },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            { source: 'website', count: '12' },
            { source: 'referral', count: '3' },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ count: '15' }],
        });

      const result = await service.getLeadStats(mockOrgId);

      expect(result.total).toBe(15);
      expect(result.byStatus.new).toBe(10);
      expect(result.byStatus.contacted).toBe(5);
      expect(result.bySource.website).toBe(12);
      expect(result.bySource.referral).toBe(3);
    });
  });

  describe('attachOpportunity', () => {
    it('should attach an opportunity to a lead', async () => {
      const opportunityId = '770e8400-e29b-41d4-a716-446655440000';
      const updatedLead = {
        id: mockLeadId,
        opportunityId,
      };

      vi.mocked(db.query).mockResolvedValueOnce({ rows: [updatedLead] });

      const result = await service.attachOpportunity(mockLeadId, mockOrgId, opportunityId);

      expect(result.opportunityId).toBe(opportunityId);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('opportunity_id'),
        [opportunityId, mockLeadId, mockOrgId]
      );
    });
  });
});
