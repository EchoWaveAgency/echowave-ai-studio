import { Dashboard, DashboardLayout, DashboardWidget, WidgetConfig, Filter, DrillDownConfig } from '../models/index.js';

export class DashboardService {
  private dashboards: Map<string, Dashboard> = new Map();
  private widgets: Map<string, DashboardWidget> = new Map();
  private nextDashboardId = 1;
  private nextWidgetId = 1;

  createDashboard(
    organization_id: string,
    name: string,
    description: string,
    type: string,
    created_by: string
  ): Dashboard {
    if (!name || name.trim().length === 0) {
      throw new Error('Dashboard name is required');
    }

    const id = `dashboard_${this.nextDashboardId++}`;
    const dashboard: Dashboard = {
      id,
      organization_id,
      name,
      description,
      type: type as 'executive' | 'sales' | 'finance' | 'project' | 'marketing' | 'custom',
      layout: {
        rows: 4,
        cols: 12,
        gaps: { horizontal: 16, vertical: 16 },
        widgets_positions: {}
      },
      widgets: [],
      refresh_interval: 60,
      created_by,
      updated_by: created_by,
      is_public: false,
      created_at: new Date(),
      updated_at: new Date()
    };

    this.dashboards.set(id, dashboard);
    return dashboard;
  }

  getDashboardById(organization_id: string, dashboard_id: string): Dashboard | null {
    const dashboard = this.dashboards.get(dashboard_id);
    if (!dashboard || dashboard.organization_id !== organization_id) {
      return null;
    }
    return dashboard;
  }

  getOrganizationDashboards(organization_id: string, type?: string): Dashboard[] {
    return Array.from(this.dashboards.values()).filter(d => {
      if (d.organization_id !== organization_id) return false;
      if (type && d.type !== type) return false;
      return true;
    });
  }

  updateDashboard(
    organization_id: string,
    dashboard_id: string,
    updates: Partial<Dashboard>
  ): Dashboard | null {
    const dashboard = this.getDashboardById(organization_id, dashboard_id);
    if (!dashboard) return null;

    const updated = {
      ...dashboard,
      ...updates,
      id: dashboard.id,
      organization_id: dashboard.organization_id,
      created_by: dashboard.created_by,
      updated_at: new Date()
    };

    this.dashboards.set(dashboard_id, updated);
    return updated;
  }

  deleteDashboard(organization_id: string, dashboard_id: string): boolean {
    const dashboard = this.getDashboardById(organization_id, dashboard_id);
    if (!dashboard) return false;

    // Remove all widgets from this dashboard
    dashboard.widgets.forEach(w => this.widgets.delete(w.id));

    return this.dashboards.delete(dashboard_id);
  }

  addWidget(
    organization_id: string,
    dashboard_id: string,
    title: string,
    type: string,
    data_source_id: string,
    config: WidgetConfig
  ): DashboardWidget | null {
    const dashboard = this.getDashboardById(organization_id, dashboard_id);
    if (!dashboard) return null;

    const id = `widget_${this.nextWidgetId++}`;
    const widget: DashboardWidget = {
      id,
      dashboard_id,
      type: type as 'chart' | 'metric' | 'table' | 'gauge' | 'timeline' | 'heatmap' | 'custom',
      title,
      data_source_id,
      config,
      dimensions: [],
      measures: [],
      filters: [],
      drill_downs: [],
      refresh_interval: 60
    };

    this.widgets.set(id, widget);
    dashboard.widgets.push(widget);

    return widget;
  }

  removeWidget(organization_id: string, dashboard_id: string, widget_id: string): boolean {
    const dashboard = this.getDashboardById(organization_id, dashboard_id);
    if (!dashboard) return false;

    const widget = this.widgets.get(widget_id);
    if (!widget || widget.dashboard_id !== dashboard_id) return false;

    dashboard.widgets = dashboard.widgets.filter(w => w.id !== widget_id);
    return this.widgets.delete(widget_id);
  }

  updateWidgetConfig(
    organization_id: string,
    dashboard_id: string,
    widget_id: string,
    config: Partial<WidgetConfig>
  ): DashboardWidget | null {
    const dashboard = this.getDashboardById(organization_id, dashboard_id);
    if (!dashboard) return null;

    const widget = this.widgets.get(widget_id);
    if (!widget || widget.dashboard_id !== dashboard_id) return null;

    widget.config = { ...widget.config, ...config };
    return widget;
  }

  updateDashboardLayout(
    organization_id: string,
    dashboard_id: string,
    layout: Partial<DashboardLayout>
  ): Dashboard | null {
    const dashboard = this.getDashboardById(organization_id, dashboard_id);
    if (!dashboard) return null;

    dashboard.layout = { ...dashboard.layout, ...layout };
    dashboard.updated_at = new Date();

    this.dashboards.set(dashboard_id, dashboard);
    return dashboard;
  }

  setWidgetPosition(
    organization_id: string,
    dashboard_id: string,
    widget_id: string,
    row: number,
    col: number,
    width: number,
    height: number
  ): Dashboard | null {
    const dashboard = this.getDashboardById(organization_id, dashboard_id);
    if (!dashboard) return null;

    const widget = this.widgets.get(widget_id);
    if (!widget || widget.dashboard_id !== dashboard_id) return null;

    dashboard.layout.widgets_positions[widget_id] = {
      row,
      col,
      width,
      height
    };

    dashboard.updated_at = new Date();
    this.dashboards.set(dashboard_id, dashboard);
    return dashboard;
  }

  addFilterToWidget(
    organization_id: string,
    dashboard_id: string,
    widget_id: string,
    filter: Filter
  ): DashboardWidget | null {
    const dashboard = this.getDashboardById(organization_id, dashboard_id);
    if (!dashboard) return null;

    const widget = this.widgets.get(widget_id);
    if (!widget || widget.dashboard_id !== dashboard_id) return null;

    widget.filters.push(filter);
    return widget;
  }

  removeFilterFromWidget(
    organization_id: string,
    dashboard_id: string,
    widget_id: string,
    filter_index: number
  ): DashboardWidget | null {
    const dashboard = this.getDashboardById(organization_id, dashboard_id);
    if (!dashboard) return null;

    const widget = this.widgets.get(widget_id);
    if (!widget || widget.dashboard_id !== dashboard_id) return null;

    if (filter_index < 0 || filter_index >= widget.filters.length) return null;

    widget.filters.splice(filter_index, 1);
    return widget;
  }

  addDrillDown(
    organization_id: string,
    dashboard_id: string,
    widget_id: string,
    drill_down: DrillDownConfig
  ): DashboardWidget | null {
    const dashboard = this.getDashboardById(organization_id, dashboard_id);
    if (!dashboard) return null;

    const widget = this.widgets.get(widget_id);
    if (!widget || widget.dashboard_id !== dashboard_id) return null;

    widget.drill_downs.push(drill_down);
    return widget;
  }

  publishDashboard(organization_id: string, dashboard_id: string): Dashboard | null {
    const dashboard = this.getDashboardById(organization_id, dashboard_id);
    if (!dashboard) return null;

    dashboard.is_public = true;
    dashboard.updated_at = new Date();

    this.dashboards.set(dashboard_id, dashboard);
    return dashboard;
  }

  unpublishDashboard(organization_id: string, dashboard_id: string): Dashboard | null {
    const dashboard = this.getDashboardById(organization_id, dashboard_id);
    if (!dashboard) return null;

    dashboard.is_public = false;
    dashboard.updated_at = new Date();

    this.dashboards.set(dashboard_id, dashboard);
    return dashboard;
  }

  getDashboardMetrics(organization_id: string, dashboard_id: string): {
    widget_count: number;
    data_sources: Set<string>;
    dimensions: Set<string>;
    measures: Set<string>;
  } {
    const dashboard = this.getDashboardById(organization_id, dashboard_id);
    if (!dashboard) {
      return {
        widget_count: 0,
        data_sources: new Set(),
        dimensions: new Set(),
        measures: new Set()
      };
    }

    const data_sources = new Set<string>();
    const dimensions = new Set<string>();
    const measures = new Set<string>();

    dashboard.widgets.forEach(w => {
      data_sources.add(w.data_source_id);
      w.dimensions.forEach(d => dimensions.add(d));
      w.measures.forEach(m => measures.add(m));
    });

    return {
      widget_count: dashboard.widgets.length,
      data_sources,
      dimensions,
      measures
    };
  }
}
