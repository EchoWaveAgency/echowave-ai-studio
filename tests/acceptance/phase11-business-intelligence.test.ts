import { describe, it, expect, beforeEach } from 'vitest';
import { DashboardService } from '../../domains/business-intelligence/services/DashboardService';
import { KPIMetricService } from '../../domains/business-intelligence/services/KPIMetricService';
import { FinancialAnalyticsService } from '../../domains/business-intelligence/services/FinancialAnalyticsService';
import { SalesAnalyticsService } from '../../domains/business-intelligence/services/SalesAnalyticsService';
import { OperationalAnalyticsService } from '../../domains/business-intelligence/services/OperationalAnalyticsService';
import { CustomReportService } from '../../domains/business-intelligence/services/CustomReportService';
import { MetricAlertService } from '../../domains/business-intelligence/services/MetricAlertService';

describe('Phase 11: Business Intelligence & Analytics', () => {
  const mockDb = {
    query: async (sql: string, params: any[]) => ({ rows: [] }),
    transaction: async (fn: Function) => fn(mockDb),
  };

  let dashboardService: DashboardService;
  let metricService: KPIMetricService;
  let financialService: FinancialAnalyticsService;
  let salesService: SalesAnalyticsService;
  let operationalService: OperationalAnalyticsService;
  let reportService: CustomReportService;
  let alertService: MetricAlertService;

  const organizationId = 'org-test-001';
  const userId = 'user-test-001';

  beforeEach(() => {
    dashboardService = new DashboardService(mockDb as any);
    metricService = new KPIMetricService(mockDb as any);
    financialService = new FinancialAnalyticsService(mockDb as any);
    salesService = new SalesAnalyticsService(mockDb as any);
    operationalService = new OperationalAnalyticsService(mockDb as any);
    reportService = new CustomReportService(mockDb as any);
    alertService = new MetricAlertService(mockDb as any);
  });

  describe('DashboardService', () => {
    it('should create a dashboard with valid configuration', async () => {
      const dashboard = await dashboardService.createDashboard(organizationId, {
        name: 'Executive Dashboard',
        description: 'Main business dashboard',
        type: 'financial',
        layout: { columns: 12, rowHeight: 60 },
        widgets: [],
        filters: [],
      }, userId);

      expect(dashboard).toBeDefined();
      expect(dashboard.name).toBe('Executive Dashboard');
      expect(dashboard.type).toBe('financial');
      expect(dashboard.isDefault).toBe(false);
    });

    it('should require valid dashboard name', async () => {
      await expect(dashboardService.createDashboard(organizationId, {
        name: '',
        type: 'sales',
        layout: { columns: 12, rowHeight: 60 },
      }, userId)).rejects.toThrow('Dashboard name is required');
    });

    it('should validate layout columns (1-12)', async () => {
      await expect(dashboardService.createDashboard(organizationId, {
        name: 'Test',
        type: 'financial',
        layout: { columns: 15, rowHeight: 60 },
      }, userId)).rejects.toThrow('Layout columns must be between 1 and 12');
    });

    it('should support all dashboard types', async () => {
      const types = ['financial', 'sales', 'operations', 'custom'];
      for (const type of types) {
        const dashboard = await dashboardService.createDashboard(organizationId, {
          name: `${type} Dashboard`,
          type: type as any,
          layout: { columns: 12, rowHeight: 60 },
        }, userId);
        expect(dashboard.type).toBe(type);
      }
    });

    it('should set only one default dashboard per organization', async () => {
      const dashboard1 = await dashboardService.createDashboard(organizationId, {
        name: 'Dashboard 1',
        type: 'financial',
        layout: { columns: 12, rowHeight: 60 },
        isDefault: true,
      }, userId);

      const dashboard2 = await dashboardService.createDashboard(organizationId, {
        name: 'Dashboard 2',
        type: 'sales',
        layout: { columns: 12, rowHeight: 60 },
        isDefault: true,
      }, userId);

      expect(dashboard1.isDefault).toBe(false);
      expect(dashboard2.isDefault).toBe(true);
    });

    it('should retrieve default dashboard', async () => {
      await dashboardService.createDashboard(organizationId, {
        name: 'Default Dashboard',
        type: 'financial',
        layout: { columns: 12, rowHeight: 60 },
        isDefault: true,
      }, userId);

      const defaultDash = await dashboardService.getDefaultDashboard(organizationId);
      expect(defaultDash?.name).toBe('Default Dashboard');
    });

    it('should add widget to dashboard', async () => {
      const dashboard = await dashboardService.createDashboard(organizationId, {
        name: 'Widget Test',
        type: 'financial',
        layout: { columns: 12, rowHeight: 60 },
      }, userId);

      const widget = {
        id: 'widget-001',
        dashboardId: dashboard.id,
        type: 'kpi' as const,
        title: 'Revenue',
        metric: 'total_revenue',
        position: { x: 0, y: 0, w: 6, h: 2 },
        configuration: {},
        dataSource: 'real_time' as const,
      };

      const updated = await dashboardService.addWidget(organizationId, dashboard.id, widget);
      expect(updated.widgets).toHaveLength(1);
      expect(updated.widgets[0].title).toBe('Revenue');
    });

    it('should clone dashboard', async () => {
      const original = await dashboardService.createDashboard(organizationId, {
        name: 'Original',
        type: 'financial',
        layout: { columns: 12, rowHeight: 60 },
      }, userId);

      const cloned = await dashboardService.cloneDashboard(organizationId, original.id, 'Cloned Dashboard', userId);
      expect(cloned.name).toBe('Cloned Dashboard');
      expect(cloned.type).toBe(original.type);
      expect(cloned.id).not.toBe(original.id);
    });
  });

  describe('KPIMetricService', () => {
    it('should create KPI metric with valid configuration', async () => {
      const metric = await metricService.createMetric(organizationId, {
        key: 'mrr',
        name: 'Monthly Recurring Revenue',
        category: 'financial',
        description: 'Monthly recurring revenue',
        unit: 'currency',
        formula: 'SUM(subscriptions.amount)',
        refreshInterval: 3600,
      });

      expect(metric.key).toBe('mrr');
      expect(metric.category).toBe('financial');
      expect(metric.unit).toBe('currency');
    });

    it('should require metric key and name', async () => {
      await expect(metricService.createMetric(organizationId, {
        key: '',
        name: 'Test',
        category: 'financial',
        description: 'Test',
        unit: 'currency',
        formula: 'test',
        refreshInterval: 3600,
      })).rejects.toThrow('Metric key is required');
    });

    it('should enforce minimum refresh interval', async () => {
      await expect(metricService.createMetric(organizationId, {
        key: 'test_metric',
        name: 'Test',
        category: 'financial',
        description: 'Test',
        unit: 'currency',
        formula: 'test',
        refreshInterval: 30,
      })).rejects.toThrow('Refresh interval must be at least 60 seconds');
    });

    it('should record data points for metric', async () => {
      const metric = await metricService.createMetric(organizationId, {
        key: 'revenue',
        name: 'Total Revenue',
        category: 'financial',
        description: 'Total revenue',
        unit: 'currency',
        formula: 'SUM(invoices.amount)',
        refreshInterval: 3600,
      });

      const updated = await metricService.recordDataPoint(organizationId, metric.id, 50000, 55000);
      expect(updated.historicalData).toHaveLength(1);
      expect(updated.historicalData[0].value).toBe(50000);
      expect(updated.historicalData[0].target).toBe(55000);
    });

    it('should retrieve metric history', async () => {
      const metric = await metricService.createMetric(organizationId, {
        key: 'churn_rate',
        name: 'Churn Rate',
        category: 'subscription',
        description: 'Monthly churn rate',
        unit: 'percent',
        formula: 'COUNT(canceled) / COUNT(active)',
        refreshInterval: 86400,
      });

      await metricService.recordDataPoint(organizationId, metric.id, 2.5);
      await metricService.recordDataPoint(organizationId, metric.id, 2.8);

      const history = await metricService.getMetricHistory(organizationId, metric.id, 1);
      expect(history.length).toBeGreaterThan(0);
    });

    it('should calculate metric trend', async () => {
      const metric = await metricService.createMetric(organizationId, {
        key: 'conversion_rate',
        name: 'Conversion Rate',
        category: 'sales',
        description: 'Sales conversion rate',
        unit: 'percent',
        formula: 'COUNT(won) / COUNT(opportunities)',
        refreshInterval: 3600,
      });

      // Add historical data points
      for (let i = 0; i < 5; i++) {
        await metricService.recordDataPoint(organizationId, metric.id, 50 + (i * 5));
      }

      const trend = await metricService.getMetricTrend(organizationId, metric.id, 30);
      expect(trend.current).toBeGreaterThan(trend.previous);
      expect(trend.trend).toBe('up');
    });

    it('should forecast metric values', async () => {
      const metric = await metricService.createMetric(organizationId, {
        key: 'customer_count',
        name: 'Customer Count',
        category: 'customer',
        description: 'Total customer count',
        unit: 'count',
        formula: 'COUNT(customers)',
        refreshInterval: 86400,
      });

      // Add more historical data for forecast
      for (let i = 0; i < 90; i++) {
        await metricService.recordDataPoint(organizationId, metric.id, 100 + (i * 2));
      }

      const forecast = await metricService.getMetricsForecast(organizationId, metric.id, 30);
      expect(forecast.length).toBe(30);
      expect(forecast[0].value).toBeGreaterThan(0);
    });
  });

  describe('FinancialAnalyticsService', () => {
    it('should calculate financial metrics', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const metrics = await financialService.calculateFinancialMetrics(
        organizationId,
        'monthly',
        startDate,
        endDate
      );

      expect(metrics).toBeDefined();
      expect(metrics.totalRevenue).toBeGreaterThan(0);
      expect(metrics.grossMargin).toBeGreaterThanOrEqual(0);
      expect(metrics.operatingMargin).toBeGreaterThanOrEqual(0);
    });

    it('should validate date range', async () => {
      const startDate = new Date('2024-02-01');
      const endDate = new Date('2024-01-01');

      await expect(financialService.calculateFinancialMetrics(
        organizationId,
        'monthly',
        startDate,
        endDate
      )).rejects.toThrow('Start date must be before end date');
    });

    it('should provide cash flow analysis', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const cashFlow = await financialService.getCashFlowAnalysis(organizationId, startDate, endDate);
      expect(cashFlow.netCashFlow).toBe(cashFlow.inflows - cashFlow.outflows);
    });

    it('should provide profitability analysis', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const profit = await financialService.getProfitabilityAnalysis(organizationId, startDate, endDate);
      expect(profit.netProfit).toBeLessThanOrEqual(profit.grossProfit);
      expect(profit.netMargin).toBeGreaterThanOrEqual(0);
    });

    it('should provide tax analysis with Egyptian VAT', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const tax = await financialService.getTaxAnalysis(organizationId, startDate, endDate);
      expect(tax.vat).toBeCloseTo((50000 * 0.14), 0);
      expect(tax.effectiveTaxRate).toBeGreaterThan(0);
    });
  });

  describe('SalesAnalyticsService', () => {
    it('should calculate sales metrics', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const metrics = await salesService.calculateSalesMetrics(
        organizationId,
        'monthly',
        startDate,
        endDate
      );

      expect(metrics.totalProposals).toBeGreaterThan(0);
      expect(metrics.winRate).toBeGreaterThanOrEqual(0);
      expect(metrics.winRate).toBeLessThanOrEqual(100);
    });

    it('should provide pipeline analysis', async () => {
      const pipeline = await salesService.getPipelineAnalysis(organizationId);
      expect(pipeline.stageBreakdown).toBeDefined();
      expect(pipeline.timeInStage).toBeDefined();
      expect(pipeline.forecastedClosures).toBeGreaterThanOrEqual(0);
    });

    it('should provide customer segmentation', async () => {
      const segmentation = await salesService.getCustomerSegmentation(organizationId);
      expect(segmentation.bySize).toBeDefined();
      expect(segmentation.byIndustry).toBeDefined();
      expect(segmentation.byRegion).toBeDefined();
    });

    it('should provide forecast accuracy', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const accuracy = await salesService.getForecastAccuracy(organizationId, startDate, endDate);
      expect(accuracy.accuracy).toBeGreaterThanOrEqual(0);
      expect(accuracy.accuracy).toBeLessThanOrEqual(100);
    });
  });

  describe('OperationalAnalyticsService', () => {
    it('should calculate operational metrics', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const metrics = await operationalService.calculateOperationalMetrics(
        organizationId,
        'monthly',
        startDate,
        endDate
      );

      expect(metrics.completionRate).toBeGreaterThanOrEqual(0);
      expect(metrics.avgProjectDuration).toBeGreaterThanOrEqual(0);
      expect(metrics.onTimeDeliveryRate).toBeGreaterThanOrEqual(0);
    });

    it('should provide project efficiency metrics', async () => {
      const efficiency = await operationalService.getProjectEfficiency(organizationId);
      expect(efficiency.avgCostPerProject).toBeGreaterThan(0);
      expect(efficiency.avgRevenuePerProject).toBeGreaterThan(0);
      expect(efficiency.projectProfitMargin).toBeGreaterThanOrEqual(0);
    });

    it('should identify bottlenecks', async () => {
      const bottlenecks = await operationalService.getBottlenecks(organizationId);
      expect(bottlenecks.processBottlenecks).toBeDefined();
      expect(bottlenecks.resourceBottlenecks).toBeDefined();
      expect(bottlenecks.skillGaps).toBeDefined();
    });

    it('should provide risk assessment', async () => {
      const risks = await operationalService.getRiskAssessment(organizationId);
      expect(risks.scheduleRisks).toBeDefined();
      expect(risks.resourceRisks).toBeDefined();
      expect(risks.technicalRisks).toBeDefined();
    });
  });

  describe('CustomReportService', () => {
    it('should create custom report', async () => {
      const report = await reportService.createReport(organizationId, {
        name: 'Monthly Sales Report',
        description: 'Sales metrics for the month',
        template: 'sales',
        metrics: ['total_proposals', 'win_rate', 'avg_deal_size'],
        visualization: 'chart',
        chartType: 'bar',
      }, userId);

      expect(report.name).toBe('Monthly Sales Report');
      expect(report.template).toBe('sales');
      expect(report.visualization).toBe('chart');
    });

    it('should require at least one metric', async () => {
      await expect(reportService.createReport(organizationId, {
        name: 'Empty Report',
        template: 'blank',
        metrics: [],
        visualization: 'table',
      }, userId)).rejects.toThrow('At least one metric is required');
    });

    it('should schedule report delivery', async () => {
      const report = await reportService.createReport(organizationId, {
        name: 'Scheduled Report',
        template: 'financial',
        metrics: ['total_revenue', 'net_profit'],
        visualization: 'table',
      }, userId);

      const scheduled = await reportService.scheduleReport(organizationId, report.id, {
        frequency: 'monthly',
        recipients: ['cfo@example.com', 'coo@example.com'],
        format: 'pdf',
      });

      expect(scheduled.isScheduled).toBe(true);
      expect(scheduled.schedule?.frequency).toBe('monthly');
      expect(scheduled.schedule?.recipients).toHaveLength(2);
    });

    it('should export report to multiple formats', async () => {
      const report = await reportService.createReport(organizationId, {
        name: 'Export Test',
        template: 'financial',
        metrics: ['total_revenue'],
        visualization: 'table',
      }, userId);

      const formats = ['pdf', 'excel', 'csv', 'json'];
      for (const format of formats) {
        const exported = await reportService.exportReport(organizationId, report.id, format as any);
        expect(exported.format).toBe(format);
        expect(exported.fileName).toContain('Export_Test');
      }
    });

    it('should duplicate report', async () => {
      const original = await reportService.createReport(organizationId, {
        name: 'Original Report',
        template: 'sales',
        metrics: ['total_proposals', 'win_rate'],
        visualization: 'chart',
        chartType: 'pie',
      }, userId);

      const duplicate = await reportService.duplicateReport(organizationId, original.id, 'Duplicated Report', userId);
      expect(duplicate.name).toBe('Duplicated Report');
      expect(duplicate.template).toBe(original.template);
      expect(duplicate.metrics).toEqual(original.metrics);
    });
  });

  describe('MetricAlertService', () => {
    it('should create metric alert', async () => {
      const alert = await alertService.createAlert(organizationId, {
        metricKey: 'churn_rate',
        type: 'threshold',
        condition: 'exceeds',
        value: 5,
        notificationChannels: ['email', 'webhook'],
        recipients: ['alerts@example.com'],
      });

      expect(alert.metricKey).toBe('churn_rate');
      expect(alert.enabled).toBe(true);
      expect(alert.notificationChannels).toContain('email');
    });

    it('should require notification channels and recipients', async () => {
      await expect(alertService.createAlert(organizationId, {
        metricKey: 'test',
        type: 'threshold',
        condition: 'exceeds',
        value: 100,
        notificationChannels: [],
        recipients: [],
      })).rejects.toThrow('At least one notification channel is required');
    });

    it('should toggle alert enabled status', async () => {
      const alert = await alertService.createAlert(organizationId, {
        metricKey: 'revenue',
        type: 'threshold',
        condition: 'falls_below',
        value: 40000,
        notificationChannels: ['email'],
        recipients: ['cfo@example.com'],
      });

      expect(alert.enabled).toBe(true);

      const toggled = await alertService.toggleAlert(organizationId, alert.id);
      expect(toggled.enabled).toBe(false);
    });

    it('should check alert trigger conditions', async () => {
      const alert = await alertService.createAlert(organizationId, {
        metricKey: 'conversion_rate',
        type: 'threshold',
        condition: 'falls_below',
        value: 50,
        notificationChannels: ['webhook'],
        recipients: ['webhook@example.com'],
      });

      const checkPass = await alertService.checkAlert(organizationId, 'conversion_rate', 55);
      expect(checkPass.triggered).toBe(false);

      const checkFail = await alertService.checkAlert(organizationId, 'conversion_rate', 45);
      expect(checkFail.triggered).toBe(true);
      expect(checkFail.alert?.id).toBe(alert.id);
    });

    it('should support bulk alert operations', async () => {
      const alert1 = await alertService.createAlert(organizationId, {
        metricKey: 'metric1',
        type: 'threshold',
        condition: 'exceeds',
        value: 100,
        notificationChannels: ['email'],
        recipients: ['user@example.com'],
      });

      const alert2 = await alertService.createAlert(organizationId, {
        metricKey: 'metric2',
        type: 'threshold',
        condition: 'exceeds',
        value: 200,
        notificationChannels: ['email'],
        recipients: ['user@example.com'],
      });

      const disabled = await alertService.bulkDisableAlerts(organizationId, [alert1.id, alert2.id]);
      expect(disabled).toHaveLength(2);
      expect(disabled.every(a => !a.enabled)).toBe(true);
    });

    it('should retrieve recently triggered alerts', async () => {
      const alert = await alertService.createAlert(organizationId, {
        metricKey: 'test_metric',
        type: 'threshold',
        condition: 'exceeds',
        value: 100,
        notificationChannels: ['email'],
        recipients: ['user@example.com'],
      });

      await alertService.checkAlert(organizationId, 'test_metric', 150);

      const recent = await alertService.getRecentlyTriggeredAlerts(organizationId, 1);
      expect(recent.length).toBeGreaterThan(0);
      expect(recent[0].lastTriggered).toBeDefined();
    });
  });

  describe('Organization Isolation', () => {
    const otherOrgId = 'org-other-001';

    it('should isolate dashboards by organization', async () => {
      const dashboard1 = await dashboardService.createDashboard(organizationId, {
        name: 'Org 1 Dashboard',
        type: 'financial',
        layout: { columns: 12, rowHeight: 60 },
      }, userId);

      const dashboard2 = await dashboardService.createDashboard(otherOrgId, {
        name: 'Org 2 Dashboard',
        type: 'sales',
        layout: { columns: 12, rowHeight: 60 },
      }, userId);

      const org1Dashboards = await dashboardService.getOrganizationDashboards(organizationId);
      const hasOwn = org1Dashboards.items.some(d => d.id === dashboard1.id);
      const hasOther = org1Dashboards.items.some(d => d.id === dashboard2.id);

      expect(hasOwn).toBe(true);
      expect(hasOther).toBe(false);
    });

    it('should isolate metrics by organization', async () => {
      const metric1 = await metricService.createMetric(organizationId, {
        key: 'metric1',
        name: 'Org 1 Metric',
        category: 'financial',
        description: 'Test',
        unit: 'currency',
        formula: 'test',
        refreshInterval: 3600,
      });

      const metric2 = await metricService.createMetric(otherOrgId, {
        key: 'metric2',
        name: 'Org 2 Metric',
        category: 'sales',
        description: 'Test',
        unit: 'currency',
        formula: 'test',
        refreshInterval: 3600,
      });

      const org1Metrics = await metricService.getOrganizationMetrics(organizationId);
      const hasOwn = org1Metrics.items.some(m => m.id === metric1.id);
      const hasOther = org1Metrics.items.some(m => m.id === metric2.id);

      expect(hasOwn).toBe(true);
      expect(hasOther).toBe(false);
    });

    it('should isolate alerts by organization', async () => {
      const alert1 = await alertService.createAlert(organizationId, {
        metricKey: 'metric1',
        type: 'threshold',
        condition: 'exceeds',
        value: 100,
        notificationChannels: ['email'],
        recipients: ['user@example.com'],
      });

      const alert2 = await alertService.createAlert(otherOrgId, {
        metricKey: 'metric2',
        type: 'threshold',
        condition: 'exceeds',
        value: 200,
        notificationChannels: ['email'],
        recipients: ['user@example.com'],
      });

      const org1Alerts = await alertService.getOrganizationAlerts(organizationId);
      const hasOwn = org1Alerts.items.some(a => a.id === alert1.id);
      const hasOther = org1Alerts.items.some(a => a.id === alert2.id);

      expect(hasOwn).toBe(true);
      expect(hasOther).toBe(false);
    });
  });

  describe('Integration Scenarios', () => {
    it('should support end-to-end BI workflow', async () => {
      // 1. Create KPI metrics
      const revenueMetric = await metricService.createMetric(organizationId, {
        key: 'revenue',
        name: 'Total Revenue',
        category: 'financial',
        description: 'Monthly revenue',
        unit: 'currency',
        formula: 'SUM(invoices.amount)',
        refreshInterval: 3600,
      });

      // 2. Record metric data
      await metricService.recordDataPoint(organizationId, revenueMetric.id, 50000);
      
      // 3. Create alert
      const alert = await alertService.createAlert(organizationId, {
        metricKey: 'revenue',
        type: 'threshold',
        condition: 'falls_below',
        value: 40000,
        notificationChannels: ['email', 'webhook'],
        recipients: ['cfo@example.com'],
      });

      // 4. Create dashboard
      const dashboard = await dashboardService.createDashboard(organizationId, {
        name: 'Financial Dashboard',
        type: 'financial',
        layout: { columns: 12, rowHeight: 60 },
        isDefault: true,
      }, userId);

      // 5. Add widget to dashboard
      const widget = {
        id: 'widget-revenue',
        dashboardId: dashboard.id,
        type: 'kpi' as const,
        title: 'Revenue',
        metric: 'revenue',
        position: { x: 0, y: 0, w: 6, h: 2 },
        configuration: { color: 'green' },
        dataSource: 'real_time' as const,
      };

      const dashboardWithWidget = await dashboardService.addWidget(organizationId, dashboard.id, widget);

      // 6. Create custom report
      const report = await reportService.createReport(organizationId, {
        name: 'Monthly Financial Report',
        template: 'financial',
        metrics: ['revenue', 'profit_margin'],
        visualization: 'chart',
        chartType: 'line',
      }, userId);

      expect(revenueMetric).toBeDefined();
      expect(alert).toBeDefined();
      expect(dashboardWithWidget.widgets).toHaveLength(1);
      expect(report).toBeDefined();
    });

    it('should support multi-metric analysis', async () => {
      // Create multiple related metrics
      const metrics = await Promise.all([
        metricService.createMetric(organizationId, {
          key: 'mrr',
          name: 'MRR',
          category: 'financial',
          description: 'Monthly recurring revenue',
          unit: 'currency',
          formula: 'SUM(subscriptions.amount)',
          refreshInterval: 3600,
        }),
        metricService.createMetric(organizationId, {
          key: 'churn',
          name: 'Churn Rate',
          category: 'subscription',
          description: 'Monthly churn rate',
          unit: 'percent',
          formula: 'COUNT(canceled) / COUNT(active)',
          refreshInterval: 86400,
        }),
      ]);

      // Create comparative report
      const report = await reportService.createReport(organizationId, {
        name: 'Subscription Health Report',
        template: 'custom',
        metrics: metrics.map(m => m.key),
        visualization: 'hybrid',
      }, userId);

      expect(report.metrics).toHaveLength(2);
      expect(report.visualization).toBe('hybrid');
    });
  });
});
