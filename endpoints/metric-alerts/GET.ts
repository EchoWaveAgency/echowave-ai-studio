import { MetricAlertService } from '../../domains/business-intelligence/services/MetricAlertService';

export default async function handler(req: any) {
  if (req.method !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const organizationId = req.headers['x-organization-id'];
    if (!organizationId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const alertId = req.query?.alertId;
    const metricKey = req.query?.metricKey;
    const limit = parseInt(req.query?.limit || '50', 10);
    const offset = parseInt(req.query?.offset || '0', 10);

    const alertService = new MetricAlertService({} as any);
    let result;

    if (alertId) {
      const alert = await alertService.getAlertById(organizationId, alertId);
      return { statusCode: 200, body: JSON.stringify(alert) };
    } else if (metricKey) {
      result = await alertService.getAlertsByMetric(organizationId, metricKey, limit, offset);
    } else {
      result = await alertService.getOrganizationAlerts(organizationId, limit, offset);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: result.items,
        pagination: { limit, offset, total: result.total },
      }),
    };
  } catch (error: any) {
    console.error('Failed to retrieve metric alerts:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
}
