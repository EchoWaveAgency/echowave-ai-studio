// GET /api/v1/contacts - List contacts with pagination and search

import { contactService } from '../../domains/crm/services/ContactService';
import { defaultLogger } from '../../platform/logging/logger';

export default async function handler(req: any) {
  try {
    const organizationId = req.context?.organizationId;
    if (!organizationId) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          error: 'unauthorized',
          message: 'Authentication required',
        }),
      };
    }

    // Parse query parameters
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search;

    // Get contacts
    const result = await contactService.getOrganizationContacts(
      organizationId,
      limit,
      offset
    );

    // If search is provided, filter results
    let contacts = result.contacts;
    if (search) {
      const searchLower = search.toLowerCase();
      contacts = contacts.filter(
        (c: any) =>
          c.firstName?.toLowerCase().includes(searchLower) ||
          c.lastName?.toLowerCase().includes(searchLower) ||
          c.email?.toLowerCase().includes(searchLower)
      );
    }

    defaultLogger.info('Contacts retrieved', {
      organizationId,
      count: contacts.length,
      total: result.total,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: contacts,
        pagination: {
          limit,
          offset,
          total: result.total,
          hasMore: offset + limit < result.total,
        },
      }),
    };
  } catch (error) {
    defaultLogger.error('Failed to retrieve contacts', { error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Failed to retrieve contacts',
      }),
    };
  }
}
