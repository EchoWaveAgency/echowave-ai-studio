import { contractTemplateService } from '../../domains/contracts/services/ContractTemplateService';
import { ValidationError } from '../../platform/errors/errors';

export default async function handler(req: any) {
  if (req.method !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const organizationId = req.headers['x-organization-id'];
    if (!organizationId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const userId = req.headers['x-user-id'];
    if (!userId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const { name, category, description, content, tags, metadata } = req.body;
    const template = await contractTemplateService.createTemplate(
      organizationId,
      {
        name,
        category,
        description,
        content,
        tags,
        metadata,
      },
      userId,
    );

    return { statusCode: 201, body: JSON.stringify(template) };
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
    }
    console.error('Failed to create template:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
}
