import { describe, it, expect, beforeEach } from 'vitest';
import { DashboardService } from '../../domains/analytics/services/DashboardService';
import { ReportService } from '../../domains/analytics/services/ReportService';
import { MetricsService } from '../../domains/analytics/services/MetricsService';
import { PredictiveAnalyticsService } from '../../domains/analytics/services/PredictiveAnalyticsService';
import { AnalyticsEventService } from '../../domains/analytics/services/AnalyticsEventService';

describe('Phase 13: Advanced Analytics & Business Intelligence', () => {
  let dashboardService: DashboardService;
  let reportService: ReportService;
  let metricsService: MetricsService;
  let predictiveService: PredictiveAnalyticsService;
  let eventService: AnalyticsEventService;

  const org_id = 'org_test_123';
  const user_id = 'user_test_456';

  beforeEach(() => {
    dashboardService = new DashboardService();
    reportService = new ReportService();
    metricsService = new MetricsService();
    predictiveService = new PredictiveAnalyticsService();
    eventService = new AnalyticsEventService();
  });

  describe('DashboardService', () => {
    it('should create a dashboard', () => {
      const dashboard = dashboardService.createDashboard(
        org_id,
        'Executive Dashboard',
        'Company-wide KPIs',
        'executive',
        user_id
      );

      expect(dashboard.id).toBeDefined();
      expect(dashboard.organization_id).toBe(org_id);
      expect(dashboard.name).toBe('Executive Dashboard');
      expect(dashboard.type).toBe('executive');
      expect(dashboard.created_by).toBe(user_id);
    });

    it('should throw error if dashboard name is empty', () => {
      expect(() => {
        dashboardService.createDashboard(org_id, '', 'Description', 'executive', user_id);
      }).toThrow('Dashboard name is required');
    });

    it('should retrieve dashboard by ID', () => {
      const dashboard = dashboardService.createDashboard(
        org_id,
        'Test Dashboard',
        'Description',
        'sales',
        user_id
      );

      const retrieved = dashboardService.getDashboardById(org_id, dashboard.id);
      expect(retrieved).toEqual(dashboard);
    });

    it('should return null for non-existent dashboard', () => {
      const retrieved = dashboardService.getDashboardById(org_id, 'nonexistent');
      expect(retrieved).toBeNull();
    });

    it('should enforce organization isolation', () => {
      const dashboard = dashboardService.createDashboard(
        org_id,
        'Private Dashboard',
        'Description',
        'finance',
        user_id
      );

      const other_org_result = dashboardService.getDashboardById('other_org', dashboard.id);
      expect(other_org_result).toBeNull();
    });

    it('should get organization dashboards', () => {
      dashboardService.createDashboard(org_id, 'Dashboard 1', 'Desc', 'executive', user_id);
      dashboardService.createDashboard(org_id, 'Dashboard 2', 'Desc', 'sales', user_id);
      dashboardService.createDashboard(org_id, 'Dashboard 3', 'Desc', 'finance', user_id);

      const dashboards = dashboardService.getOrganizationDashboards(org_id);
      expect(dashboards.length).toBe(3);
    });

    it('should filter dashboards by type', () => {
      dashboardService.createDashboard(org_id, 'Dashboard 1', 'Desc', 'executive', user_id);
      dashboardService.createDashboard(org_id, 'Dashboard 2', 'Desc', 'sales', user_id);
      dashboardService.createDashboard(org_id, 'Dashboard 3', 'Desc', 'finance', user_id);

      const salesDashboards = dashboardService.getOrganizationDashboards(org_id, 'sales');
      expect(salesDashboards.length).toBe(1);
      expect(salesDashboards[0].type).toBe('sales');
    });

    it('should update dashboard', () => {
      const dashboard = dashboardService.createDashboard(org_id, 'Original', 'Desc', 'executive', user_id);

      const updated = dashboardService.updateDashboard(org_id, dashboard.id, {
        name: 'Updated Dashboard',
        description: 'Updated description'
      });

      expect(updated?.name).toBe('Updated Dashboard');
      expect(updated?.description).toBe('Updated description');
      expect(updated?.updated_at.getTime()).toBeGreaterThan(dashboard.created_at.getTime());
    });

    it('should delete dashboard', () => {
      const dashboard = dashboardService.createDashboard(org_id, 'To Delete', 'Desc', 'executive', user_id);

      const deleted = dashboardService.deleteDashboard(org_id, dashboard.id);
      expect(deleted).toBe(true);

      const retrieved = dashboardService.getDashboardById(org_id, dashboard.id);
      expect(retrieved).toBeNull();
    });

    it('should add widget to dashboard', () => {
      const dashboard = dashboardService.createDashboard(org_id, 'Dashboard', 'Desc', 'executive', user_id);

      const widget = dashboardService.addWidget(
        org_id,
        dashboard.id,
        'Revenue Chart',
        'chart',
        'datasource_1',
        { chart_type: 'line' }
      );

      expect(widget).toBeDefined();
      expect(widget?.title).toBe('Revenue Chart');
      expect(widget?.type).toBe('chart');
    });

    it('should remove widget from dashboard', () => {
      const dashboard = dashboardService.createDashboard(org_id, 'Dashboard', 'Desc', 'executive', user_id);
      const widget = dashboardService.addWidget(
        org_id,
        dashboard.id,
        'Widget',
        'metric',
        'datasource_1',
        {}
      );

      expect(widget).toBeDefined();
      const removed = dashboardService.removeWidget(org_id, dashboard.id, widget!.id);
      expect(removed).toBe(true);
    });

    it('should add filter to widget', () => {
      const dashboard = dashboardService.createDashboard(org_id, 'Dashboard', 'Desc', 'executive', user_id);
      const widget = dashboardService.addWidget(
        org_id,
        dashboard.id,
        'Widget',
        'table',
        'datasource_1',
        {}
      );

      const filtered = dashboardService.addFilterToWidget(org_id, dashboard.id, widget!.id, {
        field: 'status',
        operator: 'eq',
        value: 'completed'
      });

      expect(filtered?.filters.length).toBe(1);
      expect(filtered?.filters[0].field).toBe('status');
    });

    it('should publish dashboard', () => {
      const dashboard = dashboardService.createDashboard(org_id, 'Dashboard', 'Desc', 'executive', user_id);

      const published = dashboardService.publishDashboard(org_id, dashboard.id);
      expect(published?.is_public).toBe(true);
    });

    it('should unpublish dashboard', () => {
      const dashboard = dashboardService.createDashboard(org_id, 'Dashboard', 'Desc', 'executive', user_id);
      dashboardService.publishDashboard(org_id, dashboard.id);

      const unpublished = dashboardService.unpublishDashboard(org_id, dashboard.id);
      expect(unpublished?.is_public).toBe(false);
    });

    it('should get dashboard metrics', () => {
      const dashboard = dashboardService.createDashboard(org_id, 'Dashboard', 'Desc', 'executive', user_id);
      dashboardService.addWidget(org_id, dashboard.id, 'Widget 1', 'chart', 'datasource_1', {});
      dashboardService.addWidget(org_id, dashboard.id, 'Widget 2', 'metric', 'datasource_2', {});

      const metrics = dashboardService.getDashboardMetrics(org_id, dashboard.id);
      expect(metrics.widget_count).toBe(2);
      expect(metrics.data_sources.size).toBe(2);
    });
  });

  describe('ReportService', () => {
    it('should create a report', () => {
      const report = reportService.createReport(
        org_id,
        'Monthly Report',
        'Monthly performance',
        'operational',
        user_id
      );

      expect(report.id).toBeDefined();
      expect(report.name).toBe('Monthly Report');
      expect(report.type).toBe('operational');
    });

    it('should throw error if report name is empty', () => {
      expect(() => {
        reportService.createReport(org_id, '', 'Description', 'operational', user_id);
      }).toThrow('Report name is required');
    });

    it('should retrieve report by ID', () => {
      const report = reportService.createReport(org_id, 'Test Report', 'Desc', 'financial', user_id);

      const retrieved = reportService.getReportById(org_id, report.id);
      expect(retrieved).toEqual(report);
    });

    it('should enforce organization isolation for reports', () => {
      const report = reportService.createReport(org_id, 'Private Report', 'Desc', 'sales', user_id);

      const other_org_result = reportService.getReportById('other_org', report.id);
      expect(other_org_result).toBeNull();
    });

    it('should add section to report', () => {
      const report = reportService.createReport(org_id, 'Report', 'Desc', 'operational', user_id);

      const section = reportService.addSection(org_id, report.id, 'Executive Summary', 'High-level overview');
      expect(section).toBeDefined();
      expect(section?.title).toBe('Executive Summary');
    });

    it('should set report schedule', () => {
      const report = reportService.createReport(org_id, 'Report', 'Desc', 'operational', user_id);

      const scheduled = reportService.setReportSchedule(org_id, report.id, {
        enabled: true,
        frequency: 'monthly',
        time_of_day: '09:00'
      });

      expect(scheduled?.schedule.enabled).toBe(true);
      expect(scheduled?.schedule.frequency).toBe('monthly');
      expect(scheduled?.schedule.next_run).toBeDefined();
    });

    it('should add recipient to report', () => {
      const report = reportService.createReport(org_id, 'Report', 'Desc', 'operational', user_id);

      const updated = reportService.addRecipient(org_id, report.id, 'user@example.com');
      expect(updated?.recipients.includes('user@example.com')).toBe(true);
    });

    it('should remove recipient from report', () => {
      const report = reportService.createReport(org_id, 'Report', 'Desc', 'operational', user_id);
      reportService.addRecipient(org_id, report.id, 'user@example.com');

      const updated = reportService.removeRecipient(org_id, report.id, 'user@example.com');
      expect(updated?.recipients.includes('user@example.com')).toBe(false);
    });

    it('should generate report', () => {
      const report = reportService.createReport(org_id, 'Report', 'Desc', 'operational', user_id);
      reportService.addRecipient(org_id, report.id, 'user1@example.com');
      reportService.addRecipient(org_id, report.id, 'user2@example.com');

      const generated = reportService.generateReport(org_id, report.id);
      expect(generated?.recipient_count).toBe(2);
      expect(generated?.generated_at).toBeDefined();
    });

    it('should delete report', () => {
      const report = reportService.createReport(org_id, 'To Delete', 'Desc', 'operational', user_id);

      const deleted = reportService.deleteReport(org_id, report.id);
      expect(deleted).toBe(true);

      const retrieved = reportService.getReportById(org_id, report.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('MetricsService', () => {
    it('should create a metric', () => {
      const metric = metricsService.createMetric(
        org_id,
        'Monthly Revenue',
        'Total monthly revenue',
        'SUM(amount) WHERE status = "completed"',
        'datasource_1',
        'sum'
      );

      expect(metric.id).toBeDefined();
      expect(metric.name).toBe('Monthly Revenue');
      expect(metric.aggregation).toBe('sum');
    });

    it('should throw error if metric name or formula is missing', () => {
      expect(() => {
        metricsService.createMetric(org_id, '', 'Desc', 'formula', 'datasource_1', 'sum');
      }).toThrow('Metric name and formula are required');
    });

    it('should create KPI', () => {
      const metric = metricsService.createMetric(
        org_id,
        'Revenue',
        'Desc',
        'SUM(amount)',
        'datasource_1',
        'sum'
      );

      const kpi = metricsService.createKPI(org_id, metric.id, 'Monthly Revenue Target', 'Desc', 100000, 'monthly');
      expect(kpi).toBeDefined();
      expect(kpi?.target_value).toBe(100000);
      expect(kpi?.status).toBe('on_track');
    });

    it('should update KPI value and status', () => {
      const metric = metricsService.createMetric(
        org_id,
        'Revenue',
        'Desc',
        'SUM(amount)',
        'datasource_1',
        'sum'
      );

      const kpi = metricsService.createKPI(org_id, metric.id, 'Target', 'Desc', 100000, 'monthly')!;
      const updated = metricsService.updateKPIValue(org_id, kpi.id, 95000);

      expect(updated?.current_value).toBe(95000);
      expect(updated?.change_percentage).toBe(-100); // First update from 0
      expect(updated?.status).toBe('on_track');
    });

    it('should mark KPI as at_risk when below 90% of target', () => {
      const metric = metricsService.createMetric(
        org_id,
        'Revenue',
        'Desc',
        'SUM(amount)',
        'datasource_1',
        'sum'
      );

      const kpi = metricsService.createKPI(org_id, metric.id, 'Target', 'Desc', 100000, 'monthly')!;
      const updated = metricsService.updateKPIValue(org_id, kpi.id, 75000);

      expect(updated?.status).toBe('at_risk');
    });

    it('should mark KPI as off_track when below 70% of target', () => {
      const metric = metricsService.createMetric(
        org_id,
        'Revenue',
        'Desc',
        'SUM(amount)',
        'datasource_1',
        'sum'
      );

      const kpi = metricsService.createKPI(org_id, metric.id, 'Target', 'Desc', 100000, 'monthly')!;
      const updated = metricsService.updateKPIValue(org_id, kpi.id, 60000);

      expect(updated?.status).toBe('off_track');
    });

    it('should set metric thresholds', () => {
      const metric = metricsService.createMetric(
        org_id,
        'Revenue',
        'Desc',
        'SUM(amount)',
        'datasource_1',
        'sum'
      );

      const updated = metricsService.setMetricThresholds(org_id, metric.id, 100000, 80000, 50000);
      expect(updated?.target_value).toBe(100000);
      expect(updated?.warning_threshold).toBe(80000);
      expect(updated?.critical_threshold).toBe(50000);
    });

    it('should get KPI summary', () => {
      const metric = metricsService.createMetric(
        org_id,
        'Revenue',
        'Desc',
        'SUM(amount)',
        'datasource_1',
        'sum'
      );

      const kpi1 = metricsService.createKPI(org_id, metric.id, 'KPI 1', 'Desc', 100000, 'monthly')!;
      const kpi2 = metricsService.createKPI(org_id, metric.id, 'KPI 2', 'Desc', 100000, 'monthly')!;
      const kpi3 = metricsService.createKPI(org_id, metric.id, 'KPI 3', 'Desc', 100000, 'monthly')!;

      metricsService.updateKPIValue(org_id, kpi1.id, 95000);
      metricsService.updateKPIValue(org_id, kpi2.id, 75000);
      metricsService.updateKPIValue(org_id, kpi3.id, 60000);

      const summary = metricsService.getKPISummary(org_id);
      expect(summary.total_kpis).toBe(3);
      expect(summary.on_track).toBe(1);
      expect(summary.at_risk).toBe(1);
      expect(summary.off_track).toBe(1);
    });

    it('should get KPIs trending up', () => {
      const metric = metricsService.createMetric(
        org_id,
        'Revenue',
        'Desc',
        'SUM(amount)',
        'datasource_1',
        'sum'
      );

      const kpi1 = metricsService.createKPI(org_id, metric.id, 'KPI 1', 'Desc', 100000, 'monthly')!;
      const kpi2 = metricsService.createKPI(org_id, metric.id, 'KPI 2', 'Desc', 100000, 'monthly')!;

      metricsService.updateKPIValue(org_id, kpi1.id, 95000);
      metricsService.updateKPIValue(org_id, kpi1.id, 105000);
      metricsService.updateKPIValue(org_id, kpi2.id, 90000);

      const trending = metricsService.getKPIsTrendingUp(org_id);
      expect(trending.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('PredictiveAnalyticsService', () => {
    it('should create a predictive metric', () => {
      const metric = predictiveService.createPredictiveMetric(
        org_id,
        'Revenue Forecast',
        'Q4 revenue projection',
        'time_series',
        'datasource_1',
        12,
        6
      );

      expect(metric.id).toBeDefined();
      expect(metric.model_type).toBe('time_series');
      expect(metric.forecast_periods).toBe(6);
    });

    it('should throw error for invalid forecast periods', () => {
      expect(() => {
        predictiveService.createPredictiveMetric(org_id, 'Metric', 'Desc', 'linear_regression', 'datasource_1', 12, 0);
      }).toThrow('Forecast periods must be between 1 and 36');
    });

    it('should train predictive model', () => {
      const metric = predictiveService.createPredictiveMetric(
        org_id,
        'Metric',
        'Desc',
        'linear_regression',
        'datasource_1',
        12,
        6
      );

      const historical_data = Array.from({ length: 12 }, (_, i) => ({
        period: new Date(2025, i, 1),
        value: 50000 + i * 5000
      }));

      const trained = predictiveService.trainModel(org_id, metric.id, historical_data);
      expect(trained?.accuracy_score).toBeGreaterThan(0);
      expect(trained?.predictions.length).toBe(6);
    });

    it('should throw error if insufficient historical data', () => {
      const metric = predictiveService.createPredictiveMetric(
        org_id,
        'Metric',
        'Desc',
        'linear_regression',
        'datasource_1',
        12,
        6
      );

      expect(() => {
        predictiveService.trainModel(org_id, metric.id, [{ period: new Date(), value: 100 }]);
      }).toThrow('At least 2 historical data points required for training');
    });

    it('should get predictions', () => {
      const metric = predictiveService.createPredictiveMetric(
        org_id,
        'Metric',
        'Desc',
        'time_series',
        'datasource_1',
        12,
        6
      );

      const historical_data = Array.from({ length: 12 }, (_, i) => ({
        period: new Date(2025, i, 1),
        value: 50000 + i * 5000
      }));

      predictiveService.trainModel(org_id, metric.id, historical_data);
      const predictions = predictiveService.getPredictions(org_id, metric.id, 3);

      expect(predictions.length).toBeLessThanOrEqual(3);
      predictions.forEach(p => {
        expect(p.predicted_value).toBeGreaterThan(0);
        expect(p.confidence).toBeGreaterThan(0);
        expect(p.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should get model accuracy score', () => {
      const metric = predictiveService.createPredictiveMetric(
        org_id,
        'Metric',
        'Desc',
        'linear_regression',
        'datasource_1',
        12,
        6
      );

      const historical_data = Array.from({ length: 12 }, (_, i) => ({
        period: new Date(2025, i, 1),
        value: 50000 + i * 5000
      }));

      predictiveService.trainModel(org_id, metric.id, historical_data);
      const accuracy = predictiveService.getForecastAccuracy(org_id, metric.id);

      expect(accuracy).toBeGreaterThanOrEqual(0);
      expect(accuracy).toBeLessThanOrEqual(100);
    });
  });

  describe('AnalyticsEventService', () => {
    it('should track an event', () => {
      const event = eventService.trackEvent(
        org_id,
        'lead_created',
        'lead',
        'lead_123',
        user_id,
        { source: 'website' }
      );

      expect(event.id).toBeDefined();
      expect(event.event_type).toBe('lead_created');
      expect(event.entity_type).toBe('lead');
      expect(event.properties.source).toBe('website');
    });

    it('should throw error if required fields are missing', () => {
      expect(() => {
        eventService.trackEvent(org_id, '', 'lead', 'lead_123');
      }).toThrow('event_type, entity_type, and entity_id are required');
    });

    it('should get events by type', () => {
      eventService.trackEvent(org_id, 'lead_created', 'lead', 'lead_1', user_id);
      eventService.trackEvent(org_id, 'lead_created', 'lead', 'lead_2', user_id);
      eventService.trackEvent(org_id, 'proposal_sent', 'proposal', 'prop_1', user_id);

      const lead_events = eventService.getEventsByType(org_id, 'lead_created');
      expect(lead_events.length).toBe(2);
    });

    it('should get events by entity', () => {
      eventService.trackEvent(org_id, 'proposal_created', 'proposal', 'prop_123', user_id);
      eventService.trackEvent(org_id, 'proposal_sent', 'proposal', 'prop_123', user_id);
      eventService.trackEvent(org_id, 'proposal_approved', 'proposal', 'prop_123', user_id);

      const prop_events = eventService.getEventsByEntity(org_id, 'proposal', 'prop_123');
      expect(prop_events.length).toBe(3);
    });

    it('should create a funnel', () => {
      eventService.trackEvent(org_id, 'lead_created', 'lead', 'lead_1', user_id);
      eventService.trackEvent(org_id, 'proposal_sent', 'proposal', 'prop_1', 'user_2');
      eventService.trackEvent(org_id, 'proposal_signed', 'proposal', 'prop_1', 'user_3');

      const funnel = eventService.createFunnel(org_id, 'Sales Funnel', 'Lead to Close', [
        { name: 'Lead Created', event_type: 'lead_created' },
        { name: 'Proposal Sent', event_type: 'proposal_sent' },
        { name: 'Proposal Signed', event_type: 'proposal_signed' }
      ]);

      expect(funnel.id).toBeDefined();
      expect(funnel.steps.length).toBe(3);
      expect(funnel.conversion_rate).toBeDefined();
    });

    it('should throw error if funnel has less than 2 steps', () => {
      expect(() => {
        eventService.createFunnel(org_id, 'Funnel', 'Desc', [
          { name: 'Step 1', event_type: 'event_1' }
        ]);
      }).toThrow('Funnel name and at least 2 steps are required');
    });

    it('should create a cohort', () => {
      const cohort = eventService.createCohort(org_id, 'Premium Users', 'Users with high LTV', {
        and_conditions: [
          { field: 'account_value', operator: 'gt', value: 50000 }
        ]
      });

      expect(cohort.id).toBeDefined();
      expect(cohort.name).toBe('Premium Users');
      expect(cohort.member_count).toBeGreaterThanOrEqual(0);
    });

    it('should delete cohort', () => {
      const cohort = eventService.createCohort(org_id, 'Cohort', 'Desc', {});

      const deleted = eventService.deleteCohort(org_id, cohort.id);
      expect(deleted).toBe(true);

      const retrieved = eventService.getCohortById(org_id, cohort.id);
      expect(retrieved).toBeNull();
    });

    it('should enforce organization isolation for events', () => {
      eventService.trackEvent(org_id, 'event_type', 'entity', 'entity_id', user_id);

      const org1_events = eventService.getEventsByType(org_id, 'event_type');
      const org2_events = eventService.getEventsByType('other_org', 'event_type');

      expect(org1_events.length).toBeGreaterThan(0);
      expect(org2_events.length).toBe(0);
    });

    it('should get event summary', () => {
      eventService.trackEvent(org_id, 'event1', 'entity', 'e1', 'user_1');
      eventService.trackEvent(org_id, 'event2', 'entity', 'e2', 'user_2');
      eventService.trackEvent(org_id, 'event1', 'entity', 'e3', 'user_1');

      const summary = eventService.getEventSummary(org_id);
      expect(summary.total_events).toBe(3);
      expect(summary.unique_users).toBe(2);
      expect(summary.unique_event_types).toBe(2);
    });
  });

  describe('Organization Isolation', () => {
    it('should not leak dashboards between organizations', () => {
      const dash1 = dashboardService.createDashboard(org_id, 'Dash1', 'Desc', 'executive', user_id);
      const dash2 = dashboardService.createDashboard('other_org', 'Dash2', 'Desc', 'executive', user_id);

      const org1_dashes = dashboardService.getOrganizationDashboards(org_id);
      expect(org1_dashes.every(d => d.organization_id === org_id)).toBe(true);
    });

    it('should not leak metrics between organizations', () => {
      const m1 = metricsService.createMetric(
        org_id,
        'Metric1',
        'Desc',
        'formula',
        'datasource_1',
        'sum'
      );

      const m2 = metricsService.createMetric(
        'other_org',
        'Metric2',
        'Desc',
        'formula',
        'datasource_1',
        'sum'
      );

      const org1_metrics = metricsService.getOrganizationMetrics(org_id);
      expect(org1_metrics.every(m => m.organization_id === org_id)).toBe(true);
      expect(org1_metrics.some(m => m.id === m2.id)).toBe(false);
    });
  });

  describe('Integration Scenarios', () => {
    it('should create complete dashboard with multiple widgets and filters', () => {
      const dashboard = dashboardService.createDashboard(
        org_id,
        'Sales Dashboard',
        'Sales metrics and KPIs',
        'sales',
        user_id
      );

      const widget1 = dashboardService.addWidget(
        org_id,
        dashboard.id,
        'Revenue Chart',
        'chart',
        'datasource_sales',
        { chart_type: 'line' }
      );

      const widget2 = dashboardService.addWidget(
        org_id,
        dashboard.id,
        'Pipeline Gauge',
        'gauge',
        'datasource_crm',
        {}
      );

      dashboardService.addFilterToWidget(org_id, dashboard.id, widget1!.id, {
        field: 'status',
        operator: 'eq',
        value: 'closed_won'
      });

      dashboardService.publishDashboard(org_id, dashboard.id);

      const final = dashboardService.getDashboardById(org_id, dashboard.id);
      expect(final?.widgets.length).toBe(2);
      expect(final?.is_public).toBe(true);
    });

    it('should create scheduled report with recipients', () => {
      const report = reportService.createReport(
        org_id,
        'Monthly Business Review',
        'Executive summary report',
        'operational',
        user_id
      );

      reportService.addSection(org_id, report.id, 'Summary', 'Key metrics summary');
      reportService.addSection(org_id, report.id, 'Details', 'Detailed breakdown');

      reportService.addRecipient(org_id, report.id, 'exec1@company.com');
      reportService.addRecipient(org_id, report.id, 'exec2@company.com');
      reportService.addRecipient(org_id, report.id, 'cfo@company.com');

      reportService.setReportSchedule(org_id, report.id, {
        enabled: true,
        frequency: 'monthly',
        day_of_month: 1,
        time_of_day: '09:00',
        timezone: 'UTC'
      });

      const generated = reportService.generateReport(org_id, report.id);
      expect(generated?.recipient_count).toBe(3);
    });

    it('should create metrics, KPIs, and track progress', () => {
      const rev_metric = metricsService.createMetric(
        org_id,
        'Monthly Revenue',
        'Total revenue',
        'SUM(amount)',
        'datasource_finance',
        'sum'
      );

      const kpi = metricsService.createKPI(org_id, rev_metric.id, 'Q4 Revenue Target', 'Desc', 500000, 'quarterly')!;

      // Simulate weekly updates
      metricsService.updateKPIValue(org_id, kpi.id, 100000); // Week 1
      metricsService.updateKPIValue(org_id, kpi.id, 215000); // Week 2
      metricsService.updateKPIValue(org_id, kpi.id, 350000); // Week 3
      const final = metricsService.updateKPIValue(org_id, kpi.id, 480000); // Week 4

      expect(final?.status).toBe('on_track');
      expect(final?.change_percentage).toBeGreaterThan(0);
    });
  });
});
