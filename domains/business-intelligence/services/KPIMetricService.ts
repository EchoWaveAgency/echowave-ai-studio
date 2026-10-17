import { KPIMetric, KPIDataPoint, KPI_CATEGORIES, METRIC_UNITS } from '../models';

export class KPIMetricService {
  private metrics: Map<string, KPIMetric> = new Map();

  constructor(private db: any) {}

  async createMetric(organizationId: string, input: {
    key: string;
    name: string;
    category: typeof KPI_CATEGORIES[number];
    description: string;
    unit: typeof METRIC_UNITS[number];
    formula: string;
    refreshInterval: number;
    alertThresholds?: { warning?: number; critical?: number };
  }): Promise<KPIMetric> {
    if (!input.key || input.key.trim().length === 0) {
      throw new Error('Metric key is required');
    }

    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Metric name is required');
    }

    if (!KPI_CATEGORIES.includes(input.category)) {
      throw new Error(`Invalid metric category: ${input.category}`);
    }

    if (!METRIC_UNITS.includes(input.unit)) {
      throw new Error(`Invalid metric unit: ${input.unit}`);
    }

    if (input.refreshInterval < 60) {
      throw new Error('Refresh interval must be at least 60 seconds');
    }

    const metric: KPIMetric = {
      id: `kpi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      key: input.key,
      name: input.name,
      category: input.category,
      description: input.description,
      unit: input.unit,
      formula: input.formula,
      refreshInterval: input.refreshInterval,
      alertThresholds: input.alertThresholds,
      historicalData: [],
      lastUpdated: new Date(),
    };

    this.metrics.set(metric.id, metric);
    return metric;
  }

  async getMetricById(organizationId: string, metricId: string): Promise<KPIMetric> {
    const metric = this.metrics.get(metricId);
    if (!metric || metric.organizationId !== organizationId) {
      throw new Error('Metric not found');
    }
    return metric;
  }

  async getMetricByKey(organizationId: string, key: string): Promise<KPIMetric | null> {
    const metrics = Array.from(this.metrics.values()).filter(
      m => m.organizationId === organizationId && m.key === key
    );
    return metrics.length > 0 ? metrics[0] : null;
  }

  async getOrganizationMetrics(organizationId: string, limit: number = 50, offset: number = 0): Promise<{ items: KPIMetric[]; total: number }> {
    const metrics = Array.from(this.metrics.values())
      .filter(m => m.organizationId === organizationId)
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      items: metrics.slice(offset, offset + limit),
      total: metrics.length,
    };
  }

  async getMetricsByCategory(organizationId: string, category: typeof KPI_CATEGORIES[number], limit: number = 50, offset: number = 0): Promise<{ items: KPIMetric[]; total: number }> {
    const metrics = Array.from(this.metrics.values())
      .filter(m => m.organizationId === organizationId && m.category === category)
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      items: metrics.slice(offset, offset + limit),
      total: metrics.length,
    };
  }

  async recordDataPoint(organizationId: string, metricId: string, value: number, target?: number, previous?: number): Promise<KPIMetric> {
    const metric = await this.getMetricById(organizationId, metricId);

    const dataPoint: KPIDataPoint = {
      timestamp: new Date(),
      value,
      target,
      previous,
    };

    metric.historicalData.push(dataPoint);

    // Keep only last 365 data points (1 year of daily data)
    if (metric.historicalData.length > 365) {
      metric.historicalData = metric.historicalData.slice(-365);
    }

    metric.lastUpdated = new Date();
    return metric;
  }

  async getMetricHistory(organizationId: string, metricId: string, days: number = 30): Promise<KPIDataPoint[]> {
    const metric = await this.getMetricById(organizationId, metricId);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return metric.historicalData.filter(dp => dp.timestamp >= cutoffDate);
  }

  async getCurrentValue(organizationId: string, metricId: string): Promise<number | null> {
    const metric = await this.getMetricById(organizationId, metricId);
    if (metric.historicalData.length === 0) {
      return null;
    }
    return metric.historicalData[metric.historicalData.length - 1].value;
  }

  async getMetricTrend(organizationId: string, metricId: string, days: number = 30): Promise<{
    current: number;
    previous: number;
    change: number;
    changePercent: number;
    trend: 'up' | 'down' | 'stable';
  }> {
    const metric = await this.getMetricById(organizationId, metricId);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const history = metric.historicalData.filter(dp => dp.timestamp >= cutoffDate);
    if (history.length < 2) {
      throw new Error('Insufficient data for trend calculation');
    }

    const current = history[history.length - 1].value;
    const previous = history[0].value;
    const change = current - previous;
    const changePercent = previous !== 0 ? (change / previous) * 100 : 0;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (changePercent > 5) trend = 'up';
    if (changePercent < -5) trend = 'down';

    return { current, previous, change, changePercent, trend };
  }

  async updateMetric(organizationId: string, metricId: string, updates: Partial<KPIMetric>): Promise<KPIMetric> {
    const metric = await this.getMetricById(organizationId, metricId);

    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length === 0) {
        throw new Error('Metric name cannot be empty');
      }
      metric.name = updates.name;
    }

    if (updates.description !== undefined) {
      metric.description = updates.description;
    }

    if (updates.formula !== undefined) {
      metric.formula = updates.formula;
    }

    if (updates.refreshInterval !== undefined) {
      if (updates.refreshInterval < 60) {
        throw new Error('Refresh interval must be at least 60 seconds');
      }
      metric.refreshInterval = updates.refreshInterval;
    }

    if (updates.alertThresholds !== undefined) {
      metric.alertThresholds = updates.alertThresholds;
    }

    return metric;
  }

  async deleteMetric(organizationId: string, metricId: string): Promise<void> {
    const metric = await this.getMetricById(organizationId, metricId);
    this.metrics.delete(metricId);
  }

  async compareMetrics(organizationId: string, metricIds: string[], period: 'daily' | 'weekly' | 'monthly' = 'monthly'): Promise<Map<string, number>> {
    const comparison = new Map<string, number>();

    for (const metricId of metricIds) {
      const value = await this.getCurrentValue(organizationId, metricId);
      if (value !== null) {
        comparison.set(metricId, value);
      }
    }

    return comparison;
  }

  async getMetricsForecast(organizationId: string, metricId: string, forecastDays: number = 30): Promise<KPIDataPoint[]> {
    const metric = await this.getMetricById(organizationId, metricId);
    if (metric.historicalData.length < 7) {
      throw new Error('Insufficient historical data for forecasting');
    }

    // Simple linear regression forecast
    const data = metric.historicalData.slice(-90);
    const n = data.length;
    const sumX = (n * (n + 1)) / 2;
    const sumY = data.reduce((sum, dp) => sum + dp.value, 0);
    const sumXY = data.reduce((sum, dp, i) => sum + (i + 1) * dp.value, 0);
    const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const forecast: KPIDataPoint[] = [];
    const lastDate = data[data.length - 1].timestamp;

    for (let i = 1; i <= forecastDays; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + i);

      const forecastValue = intercept + slope * (n + i);
      forecast.push({
        timestamp: forecastDate,
        value: Math.max(0, forecastValue),
      });
    }

    return forecast;
  }
}
