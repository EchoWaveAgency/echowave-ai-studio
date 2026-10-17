export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const organization_id = req.headers['x-organization-id'];
  const { kpiId, metric_id, limit = 50, offset = 0 } = req.query;

  if (!organization_id) {
    return res.status(400).json({ error: 'Missing organization_id header' });
  }

  if (kpiId) {
    // Get single KPI
    const kpi = {
      id: kpiId,
      organization_id,
      metric_id: metric_id || 'metric_1',
      name: 'Revenue KPI',
      description: 'Monthly revenue target',
      current_value: 95000,
      target_value: 100000,
      previous_value: 90000,
      change_percentage: 5.56,
      status: 'on_track',
      period: 'monthly',
      last_updated: new Date()
    };

    return res.status(200).json(kpi);
  }

  // Get paginated KPIs
  const kpis = [];

  return res.status(200).json({
    data: kpis,
    total: kpis.length,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
}
