// Analytics domain models for Phase 13: Advanced Analytics & Business Intelligence

export interface Dashboard {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  type: 'executive' | 'sales' | 'finance' | 'project' | 'marketing' | 'custom';
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  refresh_interval: number; // minutes
  created_by: string;
  updated_by: string;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DashboardLayout {
  rows: number;
  cols: number;
  gaps: {
    horizontal: number;
    vertical: number;
  };
  widgets_positions: {
    [widgetId: string]: {
      row: number;
      col: number;
      width: number;
      height: number;
    };
  };
}

export interface DashboardWidget {
  id: string;
  dashboard_id: string;
  type: 'chart' | 'metric' | 'table' | 'gauge' | 'timeline' | 'heatmap' | 'custom';
  title: string;
  data_source_id: string;
  config: WidgetConfig;
  dimensions: string[];
  measures: string[];
  filters: Filter[];
  drill_downs: DrillDownConfig[];
  refresh_interval: number;
}

export interface WidgetConfig {
  chart_type?: 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'combo';
  x_axis?: string;
  y_axis?: string[];
  colors?: string[];
  show_legend?: boolean;
  show_grid?: boolean;
  animation_enabled?: boolean;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export interface Filter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains' | 'between';
  value: string | number | boolean | string[] | number[];
}

export interface DrillDownConfig {
  dimension: string;
  target_dashboard_id?: string;
  target_report_id?: string;
}

export interface Report {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  type: 'operational' | 'financial' | 'sales' | 'project' | 'marketing' | 'custom';
  sections: ReportSection[];
  schedule: ReportSchedule;
  recipients: string[]; // email addresses
  created_by: string;
  updated_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface ReportSection {
  id: string;
  title: string;
  description: string;
  data_sources: string[];
  visualizations: ReportVisualization[];
  narrative?: string;
  order: number;
}

export interface ReportVisualization {
  id: string;
  type: 'chart' | 'table' | 'summary_stats' | 'trend' | 'comparison';
  title: string;
  config: WidgetConfig;
  dimensions: string[];
  measures: string[];
}

export interface ReportSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  day_of_week?: number; // 0-6
  day_of_month?: number;
  time_of_day?: string; // HH:MM
  timezone?: string;
  next_run?: Date;
}

export interface DataSource {
  id: string;
  organization_id: string;
  name: string;
  type: 'database' | 'api' | 'spreadsheet' | 'crm' | 'file';
  connection_string?: string;
  endpoint?: string;
  schema?: string;
  tables?: string[];
  refresh_frequency: number; // minutes
  last_refresh?: Date;
  status: 'active' | 'inactive' | 'error';
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Metric {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  formula: string; // e.g., "SUM(amount) WHERE status = 'completed'"
  data_source_id: string;
  dimensions: string[];
  measures: string[];
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'cumulative';
  target_value?: number;
  warning_threshold?: number;
  critical_threshold?: number;
  unit?: string;
  created_at: Date;
  updated_at: Date;
}

export interface KPI {
  id: string;
  organization_id: string;
  metric_id: string;
  name: string;
  description: string;
  current_value: number;
  target_value: number;
  previous_value: number;
  change_percentage: number;
  status: 'on_track' | 'at_risk' | 'off_track';
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  last_updated: Date;
}

export interface AnalyticsEvent {
  id: string;
  organization_id: string;
  event_type: string; // e.g., "lead_created", "proposal_sent", "payment_received"
  entity_type: string; // e.g., "lead", "proposal", "payment"
  entity_id: string;
  user_id?: string;
  properties: Record<string, any>;
  timestamp: Date;
  context?: {
    ip_address?: string;
    user_agent?: string;
    referrer?: string;
  };
}

export interface AnalyticsFunnel {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  steps: FunnelStep[];
  conversion_rate: number; // overall rate
  created_at: Date;
}

export interface FunnelStep {
  step_number: number;
  name: string;
  event_type: string;
  user_count: number;
  conversion_to_next: number; // percentage
}

export interface Cohort {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  criteria: CohortCriteria;
  member_count: number;
  created_date: Date;
  last_updated: Date;
}

export interface CohortCriteria {
  and_conditions?: Filter[];
  or_conditions?: Filter[];
  date_range?: {
    start_date: Date;
    end_date: Date;
  };
}

export interface PredictiveMetric {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  model_type: 'linear_regression' | 'decision_tree' | 'time_series' | 'neural_network';
  training_data_source_id: string;
  historical_periods: number;
  forecast_periods: number;
  accuracy_score: number;
  predictions: PredictionPoint[];
  confidence_interval: {
    lower: number;
    upper: number;
  };
  created_at: Date;
  last_trained: Date;
}

export interface PredictionPoint {
  period: Date;
  predicted_value: number;
  confidence: number;
}

export interface CustomReport {
  id: string;
  organization_id: string;
  name: string;
  query: string; // SQL or similar
  parameters: ReportParameter[];
  columns: ReportColumn[];
  created_by: string;
  created_at: Date;
}

export interface ReportParameter {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  default_value?: any;
  required: boolean;
}

export interface ReportColumn {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  format?: string;
  sortable: boolean;
  filterable: boolean;
}

export interface AnalyticsAggregation {
  id: string;
  organization_id: string;
  metric_id: string;
  period: Date;
  value: number;
  dimensions: Record<string, string | number>;
  metadata?: Record<string, any>;
}

export interface DashboardSnapshot {
  id: string;
  organization_id: string;
  dashboard_id: string;
  created_at: Date;
  data: Record<string, any>;
  snapshot_url?: string;
}

// Constants
export const DASHBOARD_TYPES = [
  'executive',
  'sales',
  'finance',
  'project',
  'marketing',
  'custom'
] as const;

export const WIDGET_TYPES = [
  'chart',
  'metric',
  'table',
  'gauge',
  'timeline',
  'heatmap',
  'custom'
] as const;

export const CHART_TYPES = [
  'bar',
  'line',
  'pie',
  'area',
  'scatter',
  'combo'
] as const;

export const REPORT_TYPES = [
  'operational',
  'financial',
  'sales',
  'project',
  'marketing',
  'custom'
] as const;

export const DATA_SOURCE_TYPES = [
  'database',
  'api',
  'spreadsheet',
  'crm',
  'file'
] as const;

export const METRIC_AGGREGATIONS = [
  'sum',
  'avg',
  'count',
  'min',
  'max',
  'cumulative'
] as const;

export const KPI_STATUSES = [
  'on_track',
  'at_risk',
  'off_track'
] as const;

export const FILTER_OPERATORS = [
  'eq',
  'ne',
  'gt',
  'lt',
  'gte',
  'lte',
  'in',
  'contains',
  'between'
] as const;

export const MODEL_TYPES = [
  'linear_regression',
  'decision_tree',
  'time_series',
  'neural_network'
] as const;

export const FREQUENCY_TYPES = [
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'yearly'
] as const;
