import { DashboardService } from '../../domains/business-intelligence/services/DashboardService';

export default async function handler(req: any) {
  if (req.method !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const organizationId = req.headers['x-organization-id'];
    if (!organizationId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const dashboardId = req.query?.dashboardId;
    const type = req.query?.type;
    const limit = parseInt(req.query?.limit || '50', 10);
    const offset = parseInt(req.query?.offset || '0', 10);

    const dashboardService = new DashboardService({} as any);
    let result;

    if (dashboardId) {
      const dashboard = await dashboardService.getDashboardById(organizationId, dashboardId);
      return { statusCode: 200, body: JSON.stringify(dashboard) };
    } else if (type) {
      result = await dashboardService.getDashboardsByType(organizationId, type, limit, offset);
    } else {
      result = await dashboardService.getOrganizationDashboards(organizationId, limit, offset);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: result.items,
        pagination: { limit, offset, total: result.total },
      }),
    };
  } catch (error: any) {
    console.error('Failed to retrieve dashboards:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
}
