import { CustomReportService } from '../../domains/business-intelligence/services/CustomReportService';

export default async function handler(req: any) {
  if (req.method !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const organizationId = req.headers['x-organization-id'];
    if (!organizationId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const reportId = req.query?.reportId;
    const template = req.query?.template;
    const limit = parseInt(req.query?.limit || '50', 10);
    const offset = parseInt(req.query?.offset || '0', 10);

    const reportService = new CustomReportService({} as any);
    let result;

    if (reportId) {
      const report = await reportService.getReportById(organizationId, reportId);
      return { statusCode: 200, body: JSON.stringify(report) };
    } else if (template) {
      result = await reportService.getReportsByTemplate(organizationId, template, limit, offset);
    } else {
      result = await reportService.getOrganizationReports(organizationId, limit, offset);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: result.items,
        pagination: { limit, offset, total: result.total },
      }),
    };
  } catch (error: any) {
    console.error('Failed to retrieve custom reports:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
}
