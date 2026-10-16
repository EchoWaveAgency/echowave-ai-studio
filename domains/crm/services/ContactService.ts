// Contact Service — CRM Domain
// Manages contact creation, CRUD, and communication history

import { query, transaction } from '../../../platform/database/connection';
import { Contact, ContactCreateInput } from '../models';
import { NotFoundError, ValidationError } from '../../../platform/errors/errors';
import { defaultLogger } from '../../../platform/logging/logger';
import { validateEmail, validatePhoneNumber } from '../../../platform/utils/validation';

export class ContactService {
  /**
   * Create a new contact in organization
   */
  async createContact(organizationId: string, input: ContactCreateInput): Promise<Contact> {
    if (!input.firstName || input.firstName.trim().length === 0) {
      throw new ValidationError('First name is required', { firstName: ['First name cannot be empty'] });
    }

    if (!input.lastName || input.lastName.trim().length === 0) {
      throw new ValidationError('Last name is required', { lastName: ['Last name cannot be empty'] });
    }

    if (input.email && !validateEmail(input.email)) {
      throw new ValidationError('Invalid email format', { email: ['Invalid email address'] });
    }

    if (input.phone && !validatePhoneNumber(input.phone)) {
      throw new ValidationError('Invalid phone format', { phone: ['Invalid phone number'] });
    }

    const contact = await transaction(async (client) => {
      const result = await client.query(
        `INSERT INTO contacts
         (organization_id, first_name, last_name, email, phone, address, city, country, postal_code, notes, consent_marketing, consent_phone, consent_email)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
          organizationId,
          input.firstName,
          input.lastName,
          input.email || null,
          input.phone || null,
          input.address || null,
          input.city || null,
          input.country || null,
          input.postalCode || null,
          input.notes || null,
          input.consentMarketing ?? false,
          input.consentPhone ?? false,
          input.consentEmail ?? false,
        ]
      );

      const contact = result.rows[0];

      // Audit log
      await client.query(
        `INSERT INTO audit_events
         (organization_id, operation, resource_type, resource_id, changes, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          organizationId,
          'CREATE',
          'contact',
          contact.id,
          JSON.stringify({ name: `${input.firstName} ${input.lastName}`, email: input.email }),
          'success',
        ]
      );

      return contact;
    });

    defaultLogger.info(`Contact created: ${contact.id}`, {
      organizationId,
      name: `${input.firstName} ${input.lastName}`,
    });

    return contact;
  }

  /**
   * Get contact by ID with org isolation
   */
  async getContactById(contactId: string, organizationId: string): Promise<Contact> {
    const result = await query(
      'SELECT * FROM contacts WHERE id = $1 AND organization_id = $2',
      [contactId, organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Contact', contactId);
    }

    return result.rows[0];
  }

  /**
   * Get all contacts for organization with pagination
   */
  async getOrganizationContacts(
    organizationId: string,
    limit = 50,
    offset = 0
  ): Promise<{ contacts: Contact[]; total: number }> {
    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as count FROM contacts WHERE organization_id = $1',
      [organizationId]
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    const result = await query(
      `SELECT * FROM contacts WHERE organization_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [organizationId, limit, offset]
    );

    return {
      contacts: result.rows,
      total,
    };
  }

  /**
   * Update contact details
   */
  async updateContact(
    contactId: string,
    organizationId: string,
    updates: Partial<Pick<
      Contact,
      'firstName' | 'lastName' | 'email' | 'phone' | 'address' | 'city' | 'country' | 'postalCode' | 'notes' | 'consentMarketing' | 'consentPhone' | 'consentEmail'
    >>
  ): Promise<Contact> {
    const current = await this.getContactById(contactId, organizationId);

    const allowedFields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'address',
      'city',
      'country',
      'postalCode',
      'notes',
      'consentMarketing',
      'consentPhone',
      'consentEmail',
    ];

    const updateClauses = [];
    const params = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        const colName = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updateClauses.push(`${colName} = $${paramIndex++}`);
        params.push(value);
      }
    }

    if (updateClauses.length === 0) {
      return current;
    }

    params.push(contactId);
    params.push(organizationId);

    const result = await query(
      `UPDATE contacts
       SET ${updateClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex++} AND organization_id = $${paramIndex++}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Contact', contactId);
    }

    // Audit log
    await query(
      `INSERT INTO audit_events
       (organization_id, operation, resource_type, resource_id, changes, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        organizationId,
        'UPDATE',
        'contact',
        contactId,
        JSON.stringify({ before: current, after: result.rows[0] }),
        'success',
      ]
    );

    return result.rows[0];
  }

  /**
   * Update contact consent preferences
   */
  async updateConsent(
    contactId: string,
    organizationId: string,
    consent: {
      marketing?: boolean;
      phone?: boolean;
      email?: boolean;
    }
  ): Promise<Contact> {
    const params: any[] = [];
    const setClauses = [];
    let paramIndex = 1;

    if (consent.marketing !== undefined) {
      setClauses.push(`consent_marketing = $${paramIndex++}`);
      params.push(consent.marketing);
    }

    if (consent.phone !== undefined) {
      setClauses.push(`consent_phone = $${paramIndex++}`);
      params.push(consent.phone);
    }

    if (consent.email !== undefined) {
      setClauses.push(`consent_email = $${paramIndex++}`);
      params.push(consent.email);
    }

    if (setClauses.length === 0) {
      return this.getContactById(contactId, organizationId);
    }

    params.push(contactId);
    params.push(organizationId);

    const result = await query(
      `UPDATE contacts
       SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex++} AND organization_id = $${paramIndex++}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Contact', contactId);
    }

    return result.rows[0];
  }

  /**
   * Search contacts by name or email
   */
  async searchContacts(
    organizationId: string,
    query_text: string,
    limit = 20
  ): Promise<Contact[]> {
    const result = await query(
      `SELECT * FROM contacts
       WHERE organization_id = $1 AND (first_name ILIKE $2 OR last_name ILIKE $2 OR email ILIKE $2)
       ORDER BY created_at DESC
       LIMIT $3`,
      [organizationId, `%${query_text}%`, limit]
    );

    return result.rows;
  }

  /**
   * Get contacts by organization
   */
  async countOrganizationContacts(organizationId: string): Promise<number> {
    const result = await query(
      'SELECT COUNT(*) as count FROM contacts WHERE organization_id = $1',
      [organizationId]
    );

    return parseInt(result.rows[0].count, 10);
  }
}

export const contactService = new ContactService();
