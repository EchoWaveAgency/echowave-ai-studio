export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const organization_id = req.headers['x-organization-id'];
  const user_id = req.headers['x-user-id'];

  if (!organization_id || !user_id) {
    return res.status(400).json({ error: 'Missing organization_id or user_id headers' });
  }

  const { name, description, type } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: 'Report name and type are required' });
  }

  const report = {
    id: `report_${Date.now()}`,
    organization_id,
    name,
    description,
    type,
    sections: [],
    schedule: {
      enabled: false,
      frequency: 'monthly'
    },
    recipients: [],
    created_by: user_id,
    updated_by: user_id,
    created_at: new Date(),
    updated_at: new Date()
  };

  return res.status(201).json(report);
}
