import { reportService } from '../../domains/analytics/services/ReportService';
import { ValidationError } from '../../platform/errors/errors';

export default async function handler(req: any) {
  if (req.method !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const organizationId = req.headers['x-organization-id'];
    const userId = req.user?.id;

    if (!organizationId || !userId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const { name, description, type, metrics, filters, format, schedule, recipients } = req.body;
    const report = await reportService.createReport(organizationId, userId, {
      name,
      description,
      type,
      metrics,
      filters,
      format,
      schedule,
      recipients,
    });

    return { statusCode: 201, body: JSON.stringify(report) };
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
    }
    console.error('Failed to create report:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
}
