// Analytics Domain Models

// Metrics
export interface Metric {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  type: 'count' | 'sum' | 'average' | 'percentage' | 'ratio';
  category: 'sales' | 'marketing' | 'support' | 'financial' | 'operational' | 'custom';
  unit?: string;
  dataSource: string; // table/view name
  query: string; // SQL query to calculate metric
  refreshInterval: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  lastRefreshedAt?: string;
  status: 'active' | 'inactive' | 'error';
  lastErrorMessage?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MetricCreateInput {
  name: string;
  description?: string;
  type: 'count' | 'sum' | 'average' | 'percentage' | 'ratio';
  category: 'sales' | 'marketing' | 'support' | 'financial' | 'operational' | 'custom';
  unit?: string;
  dataSource: string;
  query: string;
  refreshInterval: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly';
}

// Dashboard
export interface Dashboard {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  layout: 'grid' | 'custom';
  widgets: DashboardWidget[];
  isPublic: boolean;
  accessControl: string[]; // user IDs with access
  status: 'active' | 'archived';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardWidget {
  id: string;
  dashboardId: string;
  metricId: string;
  position: number;
  width: 'small' | 'medium' | 'large';
  height: 'small' | 'medium' | 'large';
  chartType: 'line' | 'bar' | 'pie' | 'gauge' | 'table' | 'number' | 'heatmap';
  timeRange: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  refreshInterval: 'realtime' | 'hourly' | 'daily' | 'never';
}

export interface DashboardCreateInput {
  name: string;
  description?: string;
  layout: 'grid' | 'custom';
  isPublic?: boolean;
  accessControl?: string[];
}

// Report
export interface Report {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  type: 'summary' | 'detailed' | 'executive' | 'custom';
  metrics: string[]; // metric IDs
  filters: Record<string, any>;
  format: 'pdf' | 'csv' | 'xlsx' | 'html';
  schedule: ReportSchedule;
  recipients: string[]; // email addresses
  lastRunAt?: string;
  nextRunAt?: string;
  status: 'draft' | 'active' | 'inactive' | 'error';
  lastErrorMessage?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportSchedule {
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time?: string; // HH:mm format
  timezone?: string;
}

export interface ReportCreateInput {
  name: string;
  description?: string;
  type: 'summary' | 'detailed' | 'executive' | 'custom';
  metrics: string[];
  filters?: Record<string, any>;
  format: 'pdf' | 'csv' | 'xlsx' | 'html';
  schedule: ReportSchedule;
  recipients: string[];
}

// Event
export interface AnalyticsEvent {
  id: string;
  organizationId: string;
  userId?: string;
  contactId?: string;
  eventType: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  properties: Record<string, any>;
  timestamp: string;
  sessionId?: string;
  metadata: Record<string, any>;
}

export interface AnalyticsEventCreateInput {
  eventType: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  properties?: Record<string, any>;
  sessionId?: string;
  metadata?: Record<string, any>;
}

// Query Result
export interface QueryResult {
  id: string;
  organizationId: string;
  query: string;
  result: any[];
  rowCount: number;
  executionTimeMs: number;
  executedAt: string;
  createdBy: string;
}

// Constants
export const METRIC_TYPES = ['count', 'sum', 'average', 'percentage', 'ratio'] as const;
export const METRIC_CATEGORIES = ['sales', 'marketing', 'support', 'financial', 'operational', 'custom'] as const;
export const METRIC_STATUSES = ['active', 'inactive', 'error'] as const;
export const REFRESH_INTERVALS = ['realtime', 'hourly', 'daily', 'weekly', 'monthly'] as const;
export const DASHBOARD_LAYOUTS = ['grid', 'custom'] as const;
export const WIDGET_CHART_TYPES = ['line', 'bar', 'pie', 'gauge', 'table', 'number', 'heatmap'] as const;
export const WIDGET_TIME_RANGES = ['day', 'week', 'month', 'quarter', 'year', 'custom'] as const;
export const REPORT_TYPES = ['summary', 'detailed', 'executive', 'custom'] as const;
export const REPORT_FORMATS = ['pdf', 'csv', 'xlsx', 'html'] as const;
export const REPORT_FREQUENCIES = ['once', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'] as const;
export const REPORT_STATUSES = ['draft', 'active', 'inactive', 'error'] as const;
