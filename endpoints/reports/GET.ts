export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const organization_id = req.headers['x-organization-id'];
  const { reportId, type, limit = 50, offset = 0 } = req.query;

  if (!organization_id) {
    return res.status(400).json({ error: 'Missing organization_id header' });
  }

  if (reportId) {
    // Get single report
    const report = {
      id: reportId,
      organization_id,
      name: 'Monthly Report',
      description: 'Monthly performance metrics',
      type: type || 'operational',
      sections: [],
      schedule: {
        enabled: false,
        frequency: 'monthly'
      },
      recipients: [],
      created_by: 'user_1',
      updated_by: 'user_1',
      created_at: new Date(),
      updated_at: new Date()
    };

    return res.status(200).json(report);
  }

  // Get paginated reports
  const reports = [];

  return res.status(200).json({
    data: reports,
    total: reports.length,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
}
