import { metricService } from '../../../domains/analytics/services/MetricService';
import { NotFoundError } from '../../../platform/errors/errors';

export default async function handler(req: any) {
  if (req.method !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const organizationId = req.headers['x-organization-id'];
    const metricId = req.params?.id;

    if (!organizationId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    if (!metricId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Metric ID is required' }) };
    }

    const metric = await metricService.getMetricById(metricId, organizationId);
    return { statusCode: 200, body: JSON.stringify(metric) };
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      return { statusCode: 404, body: JSON.stringify({ error: error.message }) };
    }
    console.error('Failed to get metric:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
}
