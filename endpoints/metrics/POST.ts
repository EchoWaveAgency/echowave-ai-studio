import { metricService } from '../../domains/analytics/services/MetricService';
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

    const { name, description, type, category, unit, dataSource, query, refreshInterval } = req.body;
    const metric = await metricService.createMetric(organizationId, {
      name,
      description,
      type,
      category,
      unit,
      dataSource,
      query,
      refreshInterval,
    });

    return { statusCode: 201, body: JSON.stringify(metric) };
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
    }
    console.error('Failed to create metric:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
}
