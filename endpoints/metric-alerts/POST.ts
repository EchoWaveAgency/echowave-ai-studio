import { MetricAlertService } from '../../domains/business-intelligence/services/MetricAlertService';

export default async function handler(req: any) {
  if (req.method !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const organizationId = req.headers['x-organization-id'];
    if (!organizationId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const { metricKey, type, condition, value, notificationChannels, recipients } = req.body;
    const alertService = new MetricAlertService({} as any);

    const alert = await alertService.createAlert(organizationId, {
      metricKey,
      type,
      condition,
      value,
      notificationChannels,
      recipients,
    });

    return { statusCode: 201, body: JSON.stringify(alert) };
  } catch (error: any) {
    console.error('Failed to create metric alert:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message || 'Internal server error' }) };
  }
}
