import { Dashboard, DashboardWidget, DashboardFilter, DASHBOARD_TYPES } from '../models';

export class DashboardService {
  private dashboards: Map<string, Dashboard> = new Map();

  constructor(private db: any) {}

  async createDashboard(organizationId: string, input: {
    name: string;
    description?: string;
    type: typeof DASHBOARD_TYPES[number];
    layout: { columns: number; rowHeight: number };
    widgets?: DashboardWidget[];
    filters?: DashboardFilter[];
    isDefault?: boolean;
  }, userId: string): Promise<Dashboard> {
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Dashboard name is required');
    }

    if (!DASHBOARD_TYPES.includes(input.type)) {
      throw new Error(`Invalid dashboard type: ${input.type}`);
    }

    if (input.layout.columns < 1 || input.layout.columns > 12) {
      throw new Error('Layout columns must be between 1 and 12');
    }

    if (input.isDefault) {
      const existing = await this.getDefaultDashboard(organizationId);
      if (existing) {
        existing.isDefault = false;
      }
    }

    const dashboard: Dashboard = {
      id: `dash-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      name: input.name,
      description: input.description,
      type: input.type,
      layout: input.layout,
      widgets: input.widgets || [],
      filters: input.filters || [],
      isDefault: input.isDefault || false,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.dashboards.set(dashboard.id, dashboard);
    return dashboard;
  }

  async getDashboardById(organizationId: string, dashboardId: string): Promise<Dashboard> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard || dashboard.organizationId !== organizationId) {
      throw new Error('Dashboard not found');
    }
    return dashboard;
  }

  async getOrganizationDashboards(organizationId: string, limit: number = 50, offset: number = 0): Promise<{ items: Dashboard[]; total: number }> {
    const dashboards = Array.from(this.dashboards.values())
      .filter(d => d.organizationId === organizationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      items: dashboards.slice(offset, offset + limit),
      total: dashboards.length,
    };
  }

  async getDefaultDashboard(organizationId: string): Promise<Dashboard | null> {
    const dashboards = Array.from(this.dashboards.values()).filter(
      d => d.organizationId === organizationId && d.isDefault
    );
    return dashboards.length > 0 ? dashboards[0] : null;
  }

  async getDashboardsByType(organizationId: string, type: typeof DASHBOARD_TYPES[number], limit: number = 50, offset: number = 0): Promise<{ items: Dashboard[]; total: number }> {
    const dashboards = Array.from(this.dashboards.values())
      .filter(d => d.organizationId === organizationId && d.type === type)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      items: dashboards.slice(offset, offset + limit),
      total: dashboards.length,
    };
  }

  async updateDashboard(organizationId: string, dashboardId: string, updates: Partial<Dashboard>): Promise<Dashboard> {
    const dashboard = await this.getDashboardById(organizationId, dashboardId);

    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length === 0) {
        throw new Error('Dashboard name cannot be empty');
      }
      dashboard.name = updates.name;
    }

    if (updates.description !== undefined) {
      dashboard.description = updates.description;
    }

    if (updates.layout !== undefined) {
      if (updates.layout.columns < 1 || updates.layout.columns > 12) {
        throw new Error('Layout columns must be between 1 and 12');
      }
      dashboard.layout = updates.layout;
    }

    if (updates.widgets !== undefined) {
      dashboard.widgets = updates.widgets;
    }

    if (updates.filters !== undefined) {
      dashboard.filters = updates.filters;
    }

    if (updates.isDefault !== undefined) {
      if (updates.isDefault) {
        const current = await this.getDefaultDashboard(organizationId);
        if (current && current.id !== dashboardId) {
          current.isDefault = false;
        }
      }
      dashboard.isDefault = updates.isDefault;
    }

    dashboard.updatedAt = new Date();
    return dashboard;
  }

  async addWidget(organizationId: string, dashboardId: string, widget: DashboardWidget): Promise<Dashboard> {
    const dashboard = await this.getDashboardById(organizationId, dashboardId);
    dashboard.widgets.push(widget);
    dashboard.updatedAt = new Date();
    return dashboard;
  }

  async removeWidget(organizationId: string, dashboardId: string, widgetId: string): Promise<Dashboard> {
    const dashboard = await this.getDashboardById(organizationId, dashboardId);
    dashboard.widgets = dashboard.widgets.filter(w => w.id !== widgetId);
    dashboard.updatedAt = new Date();
    return dashboard;
  }

  async updateWidget(organizationId: string, dashboardId: string, widgetId: string, updates: Partial<DashboardWidget>): Promise<Dashboard> {
    const dashboard = await this.getDashboardById(organizationId, dashboardId);
    const widget = dashboard.widgets.find(w => w.id === widgetId);
    if (!widget) {
      throw new Error('Widget not found');
    }

    Object.assign(widget, updates);
    dashboard.updatedAt = new Date();
    return dashboard;
  }

  async addFilter(organizationId: string, dashboardId: string, filter: DashboardFilter): Promise<Dashboard> {
    const dashboard = await this.getDashboardById(organizationId, dashboardId);
    dashboard.filters.push(filter);
    dashboard.updatedAt = new Date();
    return dashboard;
  }

  async removeFilter(organizationId: string, dashboardId: string, filterId: string): Promise<Dashboard> {
    const dashboard = await this.getDashboardById(organizationId, dashboardId);
    dashboard.filters = dashboard.filters.filter(f => f.id !== filterId);
    dashboard.updatedAt = new Date();
    return dashboard;
  }

  async deleteDashboard(organizationId: string, dashboardId: string): Promise<void> {
    const dashboard = await this.getDashboardById(organizationId, dashboardId);
    if (dashboard.isDefault) {
      throw new Error('Cannot delete default dashboard');
    }
    this.dashboards.delete(dashboardId);
  }

  async cloneDashboard(organizationId: string, dashboardId: string, newName: string, userId: string): Promise<Dashboard> {
    const original = await this.getDashboardById(organizationId, dashboardId);
    return this.createDashboard(organizationId, {
      name: newName,
      description: `Clone of ${original.name}`,
      type: original.type,
      layout: original.layout,
      widgets: JSON.parse(JSON.stringify(original.widgets)),
      filters: JSON.parse(JSON.stringify(original.filters)),
    }, userId);
  }
}
