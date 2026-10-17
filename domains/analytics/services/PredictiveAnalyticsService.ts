import { PredictiveMetric, PredictionPoint } from '../models/index.js';

export class PredictiveAnalyticsService {
  private predictiveMetrics: Map<string, PredictiveMetric> = new Map();
  private nextMetricId = 1;

  createPredictiveMetric(
    organization_id: string,
    name: string,
    description: string,
    model_type: string,
    training_data_source_id: string,
    historical_periods: number,
    forecast_periods: number
  ): PredictiveMetric {
    if (!name || !model_type) {
      throw new Error('Metric name and model type are required');
    }

    if (forecast_periods < 1 || forecast_periods > 36) {
      throw new Error('Forecast periods must be between 1 and 36');
    }

    const id = `predictive_${this.nextMetricId++}`;
    const metric: PredictiveMetric = {
      id,
      organization_id,
      name,
      description,
      model_type: model_type as 'linear_regression' | 'decision_tree' | 'time_series' | 'neural_network',
      training_data_source_id,
      historical_periods,
      forecast_periods,
      accuracy_score: 0,
      predictions: [],
      confidence_interval: {
        lower: 0.7,
        upper: 0.95
      },
      created_at: new Date(),
      last_trained: new Date()
    };

    this.predictiveMetrics.set(id, metric);
    return metric;
  }

  getPredictiveMetricById(organization_id: string, metric_id: string): PredictiveMetric | null {
    const metric = this.predictiveMetrics.get(metric_id);
    if (!metric || metric.organization_id !== organization_id) {
      return null;
    }
    return metric;
  }

  getOrganizationPredictiveMetrics(organization_id: string): PredictiveMetric[] {
    return Array.from(this.predictiveMetrics.values()).filter(m => m.organization_id === organization_id);
  }

  trainModel(
    organization_id: string,
    metric_id: string,
    historical_data: Array<{ period: Date; value: number }>
  ): PredictiveMetric | null {
    const metric = this.getPredictiveMetricById(organization_id, metric_id);
    if (!metric) return null;

    if (historical_data.length < 2) {
      throw new Error('At least 2 historical data points required for training');
    }

    const sorted = historical_data.sort((a, b) => a.period.getTime() - b.period.getTime());

    // Simple linear regression for accuracy calculation
    const n = sorted.length;
    const x_values = Array.from({ length: n }, (_, i) => i);
    const y_values = sorted.map(d => d.value);

    const x_mean = x_values.reduce((a, b) => a + b, 0) / n;
    const y_mean = y_values.reduce((a, b) => a + b, 0) / n;

    const numerator = x_values.reduce((sum, x, i) => sum + (x - x_mean) * (y_values[i] - y_mean), 0);
    const denominator = x_values.reduce((sum, x) => sum + Math.pow(x - x_mean, 2), 0);

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = y_mean - slope * x_mean;

    // Calculate R-squared for accuracy
    const predicted_values = x_values.map(x => slope * x + intercept);
    const ss_res = y_values.reduce((sum, y, i) => sum + Math.pow(y - predicted_values[i], 2), 0);
    const ss_tot = y_values.reduce((sum, y) => sum + Math.pow(y - y_mean, 2), 0);
    const r_squared = ss_tot !== 0 ? 1 - (ss_res / ss_tot) : 0;

    metric.accuracy_score = Math.max(0, Math.min(100, r_squared * 100));

    // Generate predictions
    const predictions: PredictionPoint[] = [];
    const last_period = sorted[sorted.length - 1].period;

    for (let i = 1; i <= metric.forecast_periods; i++) {
      const future_period = new Date(last_period);
      future_period.setDate(future_period.getDate() + i * 30); // Monthly forecast

      const predicted_value = slope * (n - 1 + i) + intercept;
      const confidence = Math.max(0.5, metric.accuracy_score / 100);

      predictions.push({
        period: future_period,
        predicted_value: Math.max(0, predicted_value),
        confidence
      });
    }

    metric.predictions = predictions;
    metric.last_trained = new Date();

    this.predictiveMetrics.set(metric_id, metric);
    return metric;
  }

  getPredictions(
    organization_id: string,
    metric_id: string,
    periods: number = 12
  ): PredictionPoint[] {
    const metric = this.getPredictiveMetricById(organization_id, metric_id);
    if (!metric) return [];

    return metric.predictions.slice(0, periods);
  }

  getForecastAccuracy(organization_id: string, metric_id: string): number {
    const metric = this.getPredictiveMetricById(organization_id, metric_id);
    if (!metric) return 0;

    return Math.round(metric.accuracy_score);
  }

  updateConfidenceInterval(
    organization_id: string,
    metric_id: string,
    lower: number,
    upper: number
  ): PredictiveMetric | null {
    const metric = this.getPredictiveMetricById(organization_id, metric_id);
    if (!metric) return null;

    if (lower < 0 || lower > 1 || upper < 0 || upper > 1 || lower >= upper) {
      throw new Error('Invalid confidence interval values');
    }

    metric.confidence_interval = { lower, upper };
    this.predictiveMetrics.set(metric_id, metric);
    return metric;
  }

  deletePredictiveMetric(organization_id: string, metric_id: string): boolean {
    const metric = this.getPredictiveMetricById(organization_id, metric_id);
    if (!metric) return false;

    return this.predictiveMetrics.delete(metric_id);
  }

  getModelPerformanceSummary(organization_id: string): {
    total_models: number;
    high_accuracy: number; // >80%
    medium_accuracy: number; // 50-80%
    low_accuracy: number; // <50%
    average_accuracy: number;
  } {
    const metrics = this.getOrganizationPredictiveMetrics(organization_id);

    if (metrics.length === 0) {
      return {
        total_models: 0,
        high_accuracy: 0,
        medium_accuracy: 0,
        low_accuracy: 0,
        average_accuracy: 0
      };
    }

    const high = metrics.filter(m => m.accuracy_score >= 80).length;
    const medium = metrics.filter(m => m.accuracy_score >= 50 && m.accuracy_score < 80).length;
    const low = metrics.filter(m => m.accuracy_score < 50).length;
    const average = metrics.reduce((sum, m) => sum + m.accuracy_score, 0) / metrics.length;

    return {
      total_models: metrics.length,
      high_accuracy: high,
      medium_accuracy: medium,
      low_accuracy: low,
      average_accuracy: Math.round(average)
    };
  }
}
