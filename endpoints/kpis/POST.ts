export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const organization_id = req.headers['x-organization-id'];
  const user_id = req.headers['x-user-id'];

  if (!organization_id || !user_id) {
    return res.status(400).json({ error: 'Missing organization_id or user_id headers' });
  }

  const { metric_id, name, description, target_value, period } = req.body;

  if (!metric_id || !name || !target_value || !period) {
    return res.status(400).json({ error: 'metric_id, name, target_value, and period are required' });
  }

  const kpi = {
    id: `kpi_${Date.now()}`,
    organization_id,
    metric_id,
    name,
    description,
    current_value: 0,
    target_value,
    previous_value: 0,
    change_percentage: 0,
    status: 'on_track',
    period,
    last_updated: new Date()
  };

  return res.status(201).json(kpi);
}
