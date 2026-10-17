import { dashboardService } from '../../../../domains/analytics/services/DashboardService';
import { ValidationError, NotFoundError } from '../../../../platform/errors/errors';

export default async function handler(req: any) {
  if (req.method !== 'POST') {
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

    const { metricId, position, width, height, chartType, timeRange, refreshInterval } = req.body;
    const widget = await dashboardService.addWidget(dashboardId, organizationId, metricId, {
      position,
      width,
      height,
      chartType,
      timeRange,
      refreshInterval,
    });

    return { statusCode: 201, body: JSON.stringify(widget) };
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
    }
    if (error instanceof NotFoundError) {
      return { statusCode: 404, body: JSON.stringify({ error: error.message }) };
    }
    console.error('Failed to add widget:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
}
