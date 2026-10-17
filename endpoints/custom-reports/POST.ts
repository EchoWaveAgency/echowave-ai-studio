import { CustomReportService } from '../../domains/business-intelligence/services/CustomReportService';

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

    const { name, description, template, metrics, filters, groupBy, orderBy, visualization, chartType, isScheduled, schedule } = req.body;
    const reportService = new CustomReportService({} as any);

    const report = await reportService.createReport(organizationId, {
      name,
      description,
      template,
      metrics,
      filters,
      groupBy,
      orderBy,
      visualization,
      chartType,
      isScheduled,
      schedule,
    }, userId);

    return { statusCode: 201, body: JSON.stringify(report) };
  } catch (error: any) {
    console.error('Failed to create custom report:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message || 'Internal server error' }) };
  }
}
