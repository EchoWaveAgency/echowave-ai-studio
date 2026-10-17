export interface Dashboard {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  type: 'financial' | 'sales' | 'operations' | 'custom';
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  filters: DashboardFilter[];
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardLayout {
  columns: number;
  rowHeight: number;
}

export interface DashboardWidget {
  id: string;
  dashboardId: string;
  type: 'kpi' | 'chart' | 'table' | 'gauge' | 'sparkline' | 'list';
  title: string;
  metric: string;
  position: { x: number; y: number; w: number; h: number };
  configuration: Record<string, any>;
  refreshInterval?: number;
  dataSource: 'real_time' | 'cached' | 'historical';
}

export interface DashboardFilter {
  id: string;
  dashboardId: string;
  key: string;
  label: string;
  type: 'date_range' | 'select' | 'multi_select' | 'search';
  defaultValue?: any;
  options?: Array<{ label: string; value: any }>;
}

export interface KPIMetric {
  id: string;
  organizationId: string;
  key: string;
  name: string;
  category: 'financial' | 'sales' | 'subscription' | 'contract' | 'team' | 'customer';
  description: string;
  unit: 'currency' | 'percent' | 'count' | 'duration' | 'decimal';
  formula: string;
  refreshInterval: number;
  alertThresholds?: {
    warning?: number;
    critical?: number;
  };
  historicalData: KPIDataPoint[];
  lastUpdated: Date;
}

export interface KPIDataPoint {
  timestamp: Date;
  value: number;
  target?: number;
  previous?: number;
}

export interface FinancialMetrics {
  id: string;
  organizationId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  grossMargin: number;
  operatingMargin: number;
  revenueByCategory: Record<string, number>;
  expensesByCategory: Record<string, number>;
  paymentStatus: {
    paid: number;
    pending: number;
    overdue: number;
  };
  invoiceMetrics: {
    count: number;
    avgAmount: number;
    avgPaymentTime: number;
  };
  subscriptionMetrics: {
    mrr: number;
    arr: number;
    churnRate: number;
  };
}

export interface SalesMetrics {
  id: string;
  organizationId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  totalProposals: number;
  wonProposals: number;
  lostProposals: number;
  winRate: number;
  totalValue: number;
  avgDealSize: number;
  pipelineValue: number;
  proposalsByStage: Record<string, number>;
  conversionRates: {
    leadToOpportunity: number;
    opportunityToProposal: number;
    proposalToWon: number;
  };
  topProducts: Array<{ name: string; count: number; value: number }>;
  teamPerformance: Array<{
    userId: string;
    name: string;
    proposalsCount: number;
    wonCount: number;
    totalValue: number;
  }>;
}

export interface OperationalMetrics {
  id: string;
  organizationId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  totalProjects: number;
  completedProjects: number;
  completionRate: number;
  avgProjectDuration: number;
  onTimeDeliveryRate: number;
  contractMetrics: {
    totalContracts: number;
    activeContracts: number;
    signedContracts: number;
    expiringContracts: number;
  };
  teamMetrics: {
    totalTeamMembers: number;
    activeMembers: number;
    utilizationRate: number;
    avgTasksPerMember: number;
  };
  qualityMetrics: {
    defectRate: number;
    customerSatisfactionScore: number;
    reworkRate: number;
  };
}

export interface CustomReport {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  template: 'blank' | 'financial' | 'sales' | 'operational' | 'custom';
  metrics: string[];
  filters: Record<string, any>;
  groupBy?: string;
  orderBy?: { field: string; order: 'asc' | 'desc' };
  visualization: 'table' | 'chart' | 'hybrid';
  chartType?: 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isScheduled: boolean;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    format: 'pdf' | 'excel' | 'csv';
  };
}

export interface MetricAlert {
  id: string;
  organizationId: string;
  metricKey: string;
  type: 'threshold' | 'change_rate' | 'anomaly';
  condition: 'exceeds' | 'falls_below' | 'increases_by' | 'decreases_by';
  value: number;
  enabled: boolean;
  notificationChannels: ('email' | 'sms' | 'in_app' | 'webhook')[];
  recipients: string[];
  lastTriggered?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportExport {
  id: string;
  organizationId: string;
  reportId: string;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  fileName: string;
  fileSize: number;
  downloadUrl: string;
  expiresAt: Date;
  createdAt: Date;
}

export const DASHBOARD_TYPES = ['financial', 'sales', 'operations', 'custom'] as const;
export const WIDGET_TYPES = ['kpi', 'chart', 'table', 'gauge', 'sparkline', 'list'] as const;
export const KPI_CATEGORIES = ['financial', 'sales', 'subscription', 'contract', 'team', 'customer'] as const;
export const METRIC_UNITS = ['currency', 'percent', 'count', 'duration', 'decimal'] as const;
export const PERIOD_TYPES = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] as const;
export const CHART_TYPES = ['bar', 'line', 'pie', 'scatter', 'heatmap'] as const;
export const EXPORT_FORMATS = ['pdf', 'excel', 'csv', 'json'] as const;
export const ALERT_TYPES = ['threshold', 'change_rate', 'anomaly'] as const;
