import { Metric, KPI } from '../models/index.js';

export class MetricsService {
  private metrics: Map<string, Metric> = new Map();
  private kpis: Map<string, KPI> = new Map();
  private nextMetricId = 1;
  private nextKpiId = 1;

  createMetric(
    organization_id: string,
    name: string,
    description: string,
    formula: string,
    data_source_id: string,
    aggregation: string
  ): Metric {
    if (!name || !formula) {
      throw new Error('Metric name and formula are required');
    }

    const id = `metric_${this.nextMetricId++}`;
    const metric: Metric = {
      id,
      organization_id,
      name,
      description,
      formula,
      data_source_id,
      dimensions: [],
      measures: [],
      aggregation: aggregation as 'sum' | 'avg' | 'count' | 'min' | 'max' | 'cumulative',
      created_at: new Date(),
      updated_at: new Date()
    };

    this.metrics.set(id, metric);
    return metric;
  }

  getMetricById(organization_id: string, metric_id: string): Metric | null {
    const metric = this.metrics.get(metric_id);
    if (!metric || metric.organization_id !== organization_id) {
      return null;
    }
    return metric;
  }

  getOrganizationMetrics(organization_id: string): Metric[] {
    return Array.from(this.metrics.values()).filter(m => m.organization_id === organization_id);
  }

  updateMetric(
    organization_id: string,
    metric_id: string,
    updates: Partial<Metric>
  ): Metric | null {
    const metric = this.getMetricById(organization_id, metric_id);
    if (!metric) return null;

    const updated = {
      ...metric,
      ...updates,
      id: metric.id,
      organization_id: metric.organization_id,
      updated_at: new Date()
    };

    this.metrics.set(metric_id, updated);
    return updated;
  }

  deleteMetric(organization_id: string, metric_id: string): boolean {
    const metric = this.getMetricById(organization_id, metric_id);
    if (!metric) return false;

    // Remove associated KPIs
    const kpisToDelete = Array.from(this.kpis.values())
      .filter(k => k.metric_id === metric_id && k.organization_id === organization_id)
      .map(k => k.id);

    kpisToDelete.forEach(id => this.kpis.delete(id));

    return this.metrics.delete(metric_id);
  }

  setMetricThresholds(
    organization_id: string,
    metric_id: string,
    target_value?: number,
    warning_threshold?: number,
    critical_threshold?: number
  ): Metric | null {
    const metric = this.getMetricById(organization_id, metric_id);
    if (!metric) return null;

    metric.target_value = target_value;
    metric.warning_threshold = warning_threshold;
    metric.critical_threshold = critical_threshold;
    metric.updated_at = new Date();

    this.metrics.set(metric_id, metric);
    return metric;
  }

  createKPI(
    organization_id: string,
    metric_id: string,
    name: string,
    description: string,
    target_value: number,
    period: string
  ): KPI | null {
    const metric = this.getMetricById(organization_id, metric_id);
    if (!metric) return null;

    const id = `kpi_${this.nextKpiId++}`;
    const kpi: KPI = {
      id,
      organization_id,
      metric_id,
      name,
      description,
      current_value: 0,
      target_value,
      previous_value: 0,
      change_percentage: 0,
      status: 'on_track',
      period: period as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
      last_updated: new Date()
    };

    this.kpis.set(id, kpi);
    return kpi;
  }

  getKPIById(organization_id: string, kpi_id: string): KPI | null {
    const kpi = this.kpis.get(kpi_id);
    if (!kpi || kpi.organization_id !== organization_id) {
      return null;
    }
    return kpi;
  }

  getOrganizationKPIs(organization_id: string): KPI[] {
    return Array.from(this.kpis.values()).filter(k => k.organization_id === organization_id);
  }

  getMetricKPIs(organization_id: string, metric_id: string): KPI[] {
    return Array.from(this.kpis.values()).filter(k => 
      k.organization_id === organization_id && k.metric_id === metric_id
    );
  }

  updateKPIValue(
    organization_id: string,
    kpi_id: string,
    current_value: number
  ): KPI | null {
    const kpi = this.getKPIById(organization_id, kpi_id);
    if (!kpi) return null;

    const previous_value = kpi.current_value;
    const change_percentage = previous_value > 0 
      ? ((current_value - previous_value) / previous_value) * 100
      : 0;

    let status: 'on_track' | 'at_risk' | 'off_track' = 'on_track';
    if (current_value >= kpi.target_value * 0.9) {
      status = 'on_track';
    } else if (current_value >= kpi.target_value * 0.7) {
      status = 'at_risk';
    } else {
      status = 'off_track';
    }

    kpi.current_value = current_value;
    kpi.previous_value = previous_value;
    kpi.change_percentage = change_percentage;
    kpi.status = status;
    kpi.last_updated = new Date();

    this.kpis.set(kpi_id, kpi);
    return kpi;
  }

  deleteKPI(organization_id: string, kpi_id: string): boolean {
    const kpi = this.getKPIById(organization_id, kpi_id);
    if (!kpi) return false;

    return this.kpis.delete(kpi_id);
  }

  getKPIsTrendingUp(organization_id: string): KPI[] {
    return this.getOrganizationKPIs(organization_id).filter(k => k.change_percentage > 0);
  }

  getKPIsAtRisk(organization_id: string): KPI[] {
    return this.getOrganizationKPIs(organization_id).filter(k => 
      k.status === 'at_risk' || k.status === 'off_track'
    );
  }

  getKPISummary(organization_id: string): {
    total_kpis: number;
    on_track: number;
    at_risk: number;
    off_track: number;
    trending_up: number;
    trending_down: number;
  } {
    const kpis = this.getOrganizationKPIs(organization_id);
    
    return {
      total_kpis: kpis.length,
      on_track: kpis.filter(k => k.status === 'on_track').length,
      at_risk: kpis.filter(k => k.status === 'at_risk').length,
      off_track: kpis.filter(k => k.status === 'off_track').length,
      trending_up: kpis.filter(k => k.change_percentage > 0).length,
      trending_down: kpis.filter(k => k.change_percentage < 0).length
    };
  }
}
