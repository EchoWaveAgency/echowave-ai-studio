import { dashboardService } from '../../domains/analytics/services/DashboardService';
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

    const { name, description, layout, isPublic, accessControl } = req.body;
    const dashboard = await dashboardService.createDashboard(organizationId, {
      name,
      description,
      layout,
      isPublic,
      accessControl,
    });

    return { statusCode: 201, body: JSON.stringify(dashboard) };
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
    }
    console.error('Failed to create dashboard:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
}
