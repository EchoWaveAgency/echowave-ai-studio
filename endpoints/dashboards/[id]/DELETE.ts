import { dashboardService } from '../../../domains/analytics/services/DashboardService';
import { NotFoundError } from '../../../platform/errors/errors';

export default async function handler(req: any) {
  if (req.method !== 'DELETE') {
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

    await dashboardService.deleteDashboard(dashboardId, organizationId);
    return { statusCode: 204, body: '' };
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      return { statusCode: 404, body: JSON.stringify({ error: error.message }) };
    }
    console.error('Failed to delete dashboard:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
}
