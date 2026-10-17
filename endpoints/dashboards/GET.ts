export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const organization_id = req.headers['x-organization-id'];
  const { dashboardId, type, limit = 50, offset = 0 } = req.query;

  if (!organization_id) {
    return res.status(400).json({ error: 'Missing organization_id header' });
  }

  if (dashboardId) {
    // Get single dashboard
    const dashboard = {
      id: dashboardId,
      organization_id,
      name: 'Dashboard Name',
      description: 'Dashboard description',
      type: type || 'executive',
      layout: {
        rows: 4,
        cols: 12,
        gaps: { horizontal: 16, vertical: 16 },
        widgets_positions: {}
      },
      widgets: [],
      refresh_interval: 60,
      created_by: 'user_1',
      updated_by: 'user_1',
      is_public: false,
      created_at: new Date(),
      updated_at: new Date()
    };

    return res.status(200).json(dashboard);
  }

  // Get paginated dashboards
  const dashboards = [
    {
      id: `dashboard_1`,
      organization_id,
      name: 'Executive Dashboard',
      description: 'Company-wide KPIs and metrics',
      type: 'executive',
      layout: {
        rows: 4,
        cols: 12,
        gaps: { horizontal: 16, vertical: 16 },
        widgets_positions: {}
      },
      widgets: [],
      refresh_interval: 60,
      created_by: 'user_1',
      updated_by: 'user_1',
      is_public: false,
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  return res.status(200).json({
    data: dashboards,
    total: dashboards.length,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
}
