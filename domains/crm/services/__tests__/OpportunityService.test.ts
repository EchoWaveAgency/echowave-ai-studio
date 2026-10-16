import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpportunityService } from '../OpportunityService';
import { NotFoundError, ValidationError } from '../../../../platform/errors/errors';
import * as db from '../../../../platform/database/connection';

vi.mock('../../../../platform/database/connection');
vi.mock('../../../../platform/logging/logger', () => ({
  defaultLogger: {
    info: vi.fn(),
  },
}));

describe('OpportunityService', () => {
  let service: OpportunityService;
  const mockOrgId = '123e4567-e89b-12d3-a456-426614174000';
  const mockOpportunityId = '770e8400-e29b-41d4-a716-446655440000';
  const mockLeadId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    service = new OpportunityService();
    vi.clearAllMocks();
  });

  describe('createOpportunity', () => {
    it('should create an opportunity with valid input', async () => {
      const mockOpportunity = {
        id: mockOpportunityId,
        organizationId: mockOrgId,
        leadId: mockLeadId,
        title: 'Mobile App Project',
        description: 'iOS and Android app',
        value: 50000,
        currency: 'EGP',
        stage: 'prospect',
        expectedCloseDate: new Date('2026-12-31'),
        probability: 25,
        closedDate: null,
        closedReason: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.transaction).mockResolvedValueOnce(mockOpportunity);

      const result = await service.createOpportunity(mockOrgId, {
        leadId: mockLeadId,
        title: 'Mobile App Project',
        description: 'iOS and Android app',
        value: 50000,
        currency: 'EGP',
        stage: 'prospect',
        probability: 25,
      });

      expect(result.id).toBe(mockOpportunityId);
      expect(result.title).toBe('Mobile App Project');
      expect(result.value).toBe(50000);
    });

    it('should reject empty lead ID', async () => {
      await expect(
        service.createOpportunity(mockOrgId, {
          leadId: '',
          title: 'Project',
          stage: 'prospect',
          currency: 'EGP',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should reject empty title', async () => {
      await expect(
        service.createOpportunity(mockOrgId, {
          leadId: mockLeadId,
          title: '',
          stage: 'prospect',
          currency: 'EGP',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should reject invalid stage', async () => {
      await expect(
        service.createOpportunity(mockOrgId, {
          leadId: mockLeadId,
          title: 'Project',
          stage: 'invalid_stage' as any,
          currency: 'EGP',
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getOpportunityById', () => {
    it('should retrieve an opportunity by ID with org isolation', async () => {
      const mockOpportunity = {
        id: mockOpportunityId,
        organizationId: mockOrgId,
        leadId: mockLeadId,
        title: 'Mobile App Project',
        value: 50000,
        stage: 'prospect',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.query).mockResolvedValueOnce({ rows: [mockOpportunity] });

      const result = await service.getOpportunityById(mockOpportunityId, mockOrgId);

      expect(result.id).toBe(mockOpportunityId);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('organization_id'),
        [mockOpportunityId, mockOrgId]
      );
    });

    it('should throw NotFoundError when opportunity does not exist', async () => {
      vi.mocked(db.query).mockResolvedValueOnce({ rows: [] });

      await expect(
        service.getOpportunityById(mockOpportunityId, mockOrgId)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getOrganizationOpportunities', () => {
    it('should retrieve all opportunities with pagination', async () => {
      const mockOpportunities = [
        { id: mockOpportunityId, title: 'Project 1', stage: 'prospect', value: 50000 },
        { id: '880e8400-e29b-41d4-a716-446655440000', title: 'Project 2', stage: 'proposal', value: 75000 },
      ];

      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows: mockOpportunities });

      const result = await service.getOrganizationOpportunities(mockOrgId, undefined, 50, 0);

      expect(result.opportunities).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter opportunities by stage', async () => {
      const mockOpportunities = [
        { id: mockOpportunityId, title: 'Project 1', stage: 'proposal' },
      ];

      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: mockOpportunities });

      const result = await service.getOrganizationOpportunities(
        mockOrgId,
        { stage: 'proposal' },
        50,
        0
      );

      expect(result.opportunities[0].stage).toBe('proposal');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('stage'),
        expect.arrayContaining(['proposal'])
      );
    });

    it('should filter opportunities by lead ID', async () => {
      const mockOpportunities = [
        { id: mockOpportunityId, leadId: mockLeadId, title: 'Project 1' },
      ];

      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: mockOpportunities });

      const result = await service.getOrganizationOpportunities(
        mockOrgId,
        { leadId: mockLeadId },
        50,
        0
      );

      expect(result.opportunities[0].leadId).toBe(mockLeadId);
    });
  });

  describe('updateStage', () => {
    it('should update opportunity stage and set closed date for closed stages', async () => {
      const currentOpportunity = {
        id: mockOpportunityId,
        organizationId: mockOrgId,
        stage: 'proposal',
      };

      const updatedOpportunity = {
        ...currentOpportunity,
        stage: 'closed_won',
        closedDate: new Date(),
      };

      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [currentOpportunity] })
        .mockResolvedValueOnce({ rows: [updatedOpportunity] })
        .mockResolvedValueOnce({ rows: [] }) // history insert
        .mockResolvedValueOnce({ rows: [] }); // audit log

      const result = await service.updateStage(mockOpportunityId, mockOrgId, 'closed_won');

      expect(result.stage).toBe('closed_won');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE opportunities'),
        expect.any(Array)
      );
    });

    it('should reject invalid stage', async () => {
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: [{ id: mockOpportunityId, stage: 'proposal' }],
      });

      await expect(
        service.updateStage(mockOpportunityId, mockOrgId, 'invalid_stage')
      ).rejects.toThrow(ValidationError);
    });

    it('should record stage change in opportunity history', async () => {
      const currentOpp = { id: mockOpportunityId, stage: 'prospect' };
      const updatedOpp = { ...currentOpp, stage: 'qualified' };

      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [currentOpp] })
        .mockResolvedValueOnce({ rows: [updatedOpp] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await service.updateStage(mockOpportunityId, mockOrgId, 'qualified');

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('opportunity_history'),
        [mockOpportunityId, 'qualified']
      );
    });
  });

  describe('updateOpportunity', () => {
    it('should update opportunity details', async () => {
      const currentOpp = {
        id: mockOpportunityId,
        title: 'Mobile App',
        value: 50000,
        probability: 25,
      };

      const updatedOpp = {
        ...currentOpp,
        title: 'Mobile App & Web',
        value: 75000,
        probability: 50,
      };

      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [currentOpp] })
        .mockResolvedValueOnce({ rows: [updatedOpp] });

      const result = await service.updateOpportunity(mockOpportunityId, mockOrgId, {
        title: 'Mobile App & Web',
        value: 75000,
        probability: 50,
      });

      expect(result.value).toBe(75000);
      expect(result.probability).toBe(50);
    });
  });

  describe('getPipelineSummary', () => {
    it('should return pipeline summary grouped by stage', async () => {
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: [
          { stage: 'prospect', count: '15', total_value: '250000' },
          { stage: 'qualified', count: '8', total_value: '320000' },
          { stage: 'proposal', count: '5', total_value: '400000' },
        ],
      });

      const result = await service.getPipelineSummary(mockOrgId);

      expect(result.byStage.prospect.count).toBe(15);
      expect(result.byStage.prospect.totalValue).toBe(250000);
      expect(result.byStage.qualified.count).toBe(8);
      expect(result.totalValue).toBe(970000);
      expect(result.opportunityCount).toBe(28);
    });

    it('should return zero totals when no opportunities exist', async () => {
      vi.mocked(db.query).mockResolvedValueOnce({ rows: [] });

      const result = await service.getPipelineSummary(mockOrgId);

      expect(result.totalValue).toBe(0);
      expect(result.opportunityCount).toBe(0);
    });
  });

  describe('getRevenueForecast', () => {
    it('should calculate weighted revenue forecast by probability', async () => {
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: [{ forecast: '487500' }],
      });

      const forecast = await service.getRevenueForecast(mockOrgId);

      expect(forecast).toBe(487500);
    });

    it('should exclude closed deals from forecast', async () => {
      vi.mocked(db.query).mockResolvedValueOnce({
        rows: [{ forecast: '300000' }],
      });

      await service.getRevenueForecast(mockOrgId);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('closed_lost'),
        [mockOrgId]
      );
    });
  });
});
