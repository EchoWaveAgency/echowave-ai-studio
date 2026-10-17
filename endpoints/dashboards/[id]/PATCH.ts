import { dashboardService } from '../../../domains/analytics/services/DashboardService';
import { ValidationError, NotFoundError } from '../../../platform/errors/errors';

export default async function handler(req: any) {
  if (req.method !== 'PATCH') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const organizationId = req.headers['x-organization-id'];
    const dashboardId = req.params?.id;

    if (!organizationId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    if (!dashboardId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Dashboard ID is required' }) };
    }

    const { name, description, layout, isPublic, accessControl } = req.body;
    const dashboard = await dashboardService.updateDashboard(dashboardId, organizationId, {
      name,
      description,
      layout,
      isPublic,
      accessControl,
    });

    return { statusCode: 200, body: JSON.stringify(dashboard) };
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
    }
    if (error instanceof NotFoundError) {
      return { statusCode: 404, body: JSON.stringify({ error: error.message }) };
    }
    console.error('Failed to update dashboard:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
}
