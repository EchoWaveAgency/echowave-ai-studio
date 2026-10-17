import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContactService } from '../ContactService';
import { NotFoundError, ValidationError } from '../../../../platform/errors/errors';
import * as db from '../../../../platform/database/connection';

vi.mock('../../../../platform/database/connection');
vi.mock('../../../../platform/logging/logger', () => ({
  defaultLogger: {
    info: vi.fn(),
  },
}));

describe('ContactService', () => {
  let service: ContactService;
  const mockOrgId = '123e4567-e89b-12d3-a456-426614174000';
  const mockContactId = '660e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    service = new ContactService();
    vi.clearAllMocks();
  });

  describe('createContact', () => {
    it('should create a contact with valid input', async () => {
      const mockContact = {
        id: mockContactId,
        organizationId: mockOrgId,
        firstName: 'Ahmed',
        lastName: 'Hassan',
        email: 'ahmed@example.com',
        phone: '+201001234567',
        address: '123 Business St',
        city: 'Cairo',
        country: 'Egypt',
        postalCode: '11111',
        notes: null,
        consentMarketing: true,
        consentPhone: false,
        consentEmail: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.transaction).mockResolvedValueOnce(mockContact);

      const result = await service.createContact(mockOrgId, {
        firstName: 'Ahmed',
        lastName: 'Hassan',
        email: 'ahmed@example.com',
        phone: '+201001234567',
        address: '123 Business St',
        city: 'Cairo',
        country: 'Egypt',
        postalCode: '11111',
        consentMarketing: true,
        consentEmail: true,
      });

      expect(result.id).toBe(mockContactId);
      expect(result.firstName).toBe('Ahmed');
      expect(result.lastName).toBe('Hassan');
    });

    it('should reject invalid email format', async () => {
      await expect(
        service.createContact(mockOrgId, {
          firstName: 'Ahmed',
          lastName: 'Hassan',
          email: 'invalid-email',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should reject invalid phone format', async () => {
      await expect(
        service.createContact(mockOrgId, {
          firstName: 'Ahmed',
          lastName: 'Hassan',
          email: 'ahmed@example.com',
          phone: 'invalid',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should reject empty first name', async () => {
      await expect(
        service.createContact(mockOrgId, {
          firstName: '',
          lastName: 'Hassan',
          email: 'ahmed@example.com',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should reject empty last name', async () => {
      await expect(
        service.createContact(mockOrgId, {
          firstName: 'Ahmed',
          lastName: '',
          email: 'ahmed@example.com',
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getContactById', () => {
    it('should retrieve a contact by ID with org isolation', async () => {
      const mockContact = {
        id: mockContactId,
        organizationId: mockOrgId,
        firstName: 'Ahmed',
        lastName: 'Hassan',
        email: 'ahmed@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.query).mockResolvedValueOnce({ rows: [mockContact] });

      const result = await service.getContactById(mockContactId, mockOrgId);

      expect(result.id).toBe(mockContactId);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('organization_id'),
        [mockContactId, mockOrgId]
      );
    });

    it('should throw NotFoundError when contact does not exist', async () => {
      vi.mocked(db.query).mockResolvedValueOnce({ rows: [] });

      await expect(service.getContactById(mockContactId, mockOrgId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getOrganizationContacts', () => {
    it('should retrieve all contacts with pagination', async () => {
      const mockContacts = [
        { id: mockContactId, firstName: 'Ahmed', lastName: 'Hassan' },
        { id: '770e8400-e29b-41d4-a716-446655440000', firstName: 'Fatima', lastName: 'Ali' },
      ];

      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows: mockContacts });

      const result = await service.getOrganizationContacts(mockOrgId, 50, 0);

      expect(result.contacts).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });

  describe('updateContact', () => {
    it('should update contact details', async () => {
      const currentContact = {
        id: mockContactId,
        organizationId: mockOrgId,
        firstName: 'Ahmed',
        lastName: 'Hassan',
        email: 'ahmed@example.com',
      };

      const updatedContact = {
        ...currentContact,
        email: 'ahmed.new@example.com',
      };

      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [currentContact] })
        .mockResolvedValueOnce({ rows: [updatedContact] })
        .mockResolvedValueOnce({ rows: [] }); // audit log

      const result = await service.updateContact(mockContactId, mockOrgId, {
        email: 'ahmed.new@example.com',
      });

      expect(result.email).toBe('ahmed.new@example.com');
    });

    it('should allow multiple field updates', async () => {
      const currentContact = {
        id: mockContactId,
        firstName: 'Ahmed',
        lastName: 'Hassan',
      };

      const updatedContact = {
        ...currentContact,
        firstName: 'Mohammed',
        lastName: 'Hassan',
        city: 'Alexandria',
      };

      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [currentContact] })
        .mockResolvedValueOnce({ rows: [updatedContact] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await service.updateContact(mockContactId, mockOrgId, {
        firstName: 'Mohammed',
        city: 'Alexandria',
      });

      expect(result.firstName).toBe('Mohammed');
      expect(result.city).toBe('Alexandria');
    });

    it('should return current contact if no updates provided', async () => {
      const currentContact = {
        id: mockContactId,
        firstName: 'Ahmed',
        lastName: 'Hassan',
      };

      vi.mocked(db.query).mockResolvedValueOnce({ rows: [currentContact] });

      const result = await service.updateContact(mockContactId, mockOrgId, {});

      expect(result.id).toBe(mockContactId);
    });
  });

  describe('updateConsent', () => {
    it('should update consent preferences', async () => {
      const updatedContact = {
        id: mockContactId,
        consentMarketing: false,
        consentEmail: true,
        consentPhone: false,
      };

      vi.mocked(db.query).mockResolvedValueOnce({ rows: [updatedContact] });

      const result = await service.updateConsent(mockContactId, mockOrgId, {
        marketing: false,
        email: true,
        phone: false,
      });

      expect(result.consentMarketing).toBe(false);
      expect(result.consentEmail).toBe(true);
    });

    it('should handle partial consent updates', async () => {
      const updatedContact = {
        id: mockContactId,
        consentMarketing: true,
        consentEmail: false,
        consentPhone: true,
      };

      vi.mocked(db.query).mockResolvedValueOnce({ rows: [updatedContact] });

      const result = await service.updateConsent(mockContactId, mockOrgId, {
        email: false,
      });

      expect(result.consentEmail).toBe(false);
    });
  });

  describe('searchContacts', () => {
    it('should search contacts by name or email', async () => {
      const mockContacts = [
        { id: mockContactId, firstName: 'Ahmed', lastName: 'Hassan', email: 'ahmed@example.com' },
      ];

      vi.mocked(db.query).mockResolvedValueOnce({ rows: mockContacts });

      const result = await service.searchContacts(mockOrgId, 'Ahmed', 20);

      expect(result).toHaveLength(1);
      expect(result[0].firstName).toBe('Ahmed');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        [mockOrgId, '%Ahmed%', 20]
      );
    });
  });

  describe('countOrganizationContacts', () => {
    it('should return contact count for organization', async () => {
      vi.mocked(db.query).mockResolvedValueOnce({ rows: [{ count: '42' }] });

      const count = await service.countOrganizationContacts(mockOrgId);

      expect(count).toBe(42);
    });
  });
});
