import { KPIMetricService } from '../../domains/business-intelligence/services/KPIMetricService';

export default async function handler(req: any) {
  if (req.method !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const organizationId = req.headers['x-organization-id'];
    if (!organizationId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const { key, name, category, description, unit, formula, refreshInterval, alertThresholds } = req.body;
    const metricService = new KPIMetricService({} as any);

    const metric = await metricService.createMetric(organizationId, {
      key,
      name,
      category,
      description,
      unit,
      formula,
      refreshInterval,
      alertThresholds,
    });

    return { statusCode: 201, body: JSON.stringify(metric) };
  } catch (error: any) {
    console.error('Failed to create KPI metric:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message || 'Internal server error' }) };
  }
}
