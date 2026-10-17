import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { metricService } from '../../domains/analytics/services/MetricService';
import { dashboardService } from '../../domains/analytics/services/DashboardService';
import { reportService } from '../../domains/analytics/services/ReportService';
import { analyticsEventService } from '../../domains/analytics/services/AnalyticsEventService';
import { queryService } from '../../domains/analytics/services/QueryService';
import { ValidationError, NotFoundError } from '../../platform/errors/errors';

const testOrgId = 'test-org-phase7-' + Date.now();
const testUserId = 'test-user-' + Date.now();

describe('Phase 7: Analytics & Reporting', () => {
  describe('Metrics Service', () => {
    it('should create a metric with valid input', async () => {
      const metric = await metricService.createMetric(testOrgId, {
        name: 'Total Sales',
        description: 'Total sales for the month',
        type: 'sum',
        category: 'sales',
        unit: 'USD',
        dataSource: 'sales_table',
        query: 'SELECT SUM(amount) FROM sales WHERE org_id = $1',
        refreshInterval: 'daily',
      });

      expect(metric).toBeDefined();
      expect(metric.name).toBe('Total Sales');
      expect(metric.type).toBe('sum');
      expect(metric.status).toBe('active');
      expect(metric.organization_id).toBe(testOrgId);
    });

    it('should reject metric without name', async () => {
      try {
        await metricService.createMetric(testOrgId, {
          name: '',
          type: 'sum',
          category: 'sales',
          dataSource: 'sales',
          query: 'SELECT * FROM sales',
          refreshInterval: 'daily',
        });
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
      }
    });

    it('should reject metric with invalid type', async () => {
      try {
        await metricService.createMetric(testOrgId, {
          name: 'Invalid Metric',
          type: 'invalid_type' as any,
          category: 'sales',
          dataSource: 'sales',
          query: 'SELECT * FROM sales',
          refreshInterval: 'daily',
        });
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
      }
    });

    it('should get metric by ID', async () => {
      const created = await metricService.createMetric(testOrgId, {
        name: 'Revenue Metric',
        type: 'sum',
        category: 'financial',
        dataSource: 'revenue',
        query: 'SELECT SUM(revenue) FROM transactions',
        refreshInterval: 'hourly',
      });

      const retrieved = await metricService.getMetricById(created.id, testOrgId);
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.name).toBe('Revenue Metric');
    });

    it('should not find metric from different org', async () => {
      const metric = await metricService.createMetric(testOrgId, {
        name: 'Org Specific Metric',
        type: 'count',
        category: 'sales',
        dataSource: 'sales',
        query: 'SELECT COUNT(*) FROM sales',
        refreshInterval: 'daily',
      });

      try {
        await metricService.getMetricById(metric.id, 'different-org-id');
        expect.fail('Should have thrown NotFoundError');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
      }
    });

    it('should list metrics with pagination', async () => {
      for (let i = 0; i < 5; i++) {
        await metricService.createMetric(testOrgId, {
          name: `Metric ${i}`,
          type: 'count',
          category: 'sales',
          dataSource: 'source',
          query: 'SELECT * FROM table',
          refreshInterval: 'daily',
        });
      }

      const result = await metricService.getOrganizationMetrics(testOrgId, 3, 0);
      expect(result.items.length).toBeLessThanOrEqual(3);
      expect(result.total).toBeGreaterThanOrEqual(5);
    });

    it('should filter metrics by category', async () => {
      await metricService.createMetric(testOrgId, {
        name: 'Marketing Metric',
        type: 'count',
        category: 'marketing',
        dataSource: 'source',
        query: 'SELECT * FROM table',
        refreshInterval: 'daily',
      });

      const result = await metricService.getMetricsByCategory(testOrgId, 'marketing', 50, 0);
      expect(result.items.some((m) => m.category === 'marketing')).toBe(true);
    });

    it('should update metric', async () => {
      const metric = await metricService.createMetric(testOrgId, {
        name: 'Original Name',
        type: 'sum',
        category: 'sales',
        dataSource: 'source',
        query: 'SELECT * FROM table',
        refreshInterval: 'daily',
      });

      const updated = await metricService.updateMetric(metric.id, testOrgId, {
        name: 'Updated Name',
        description: 'New description',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('New description');
    });

    it('should update metric status', async () => {
      const metric = await metricService.createMetric(testOrgId, {
        name: 'Status Test Metric',
        type: 'count',
        category: 'sales',
        dataSource: 'source',
        query: 'SELECT * FROM table',
        refreshInterval: 'daily',
      });

      const updated = await metricService.updateMetricStatus(metric.id, testOrgId, 'error', 'Query failed');
      expect(updated.status).toBe('error');
      expect(updated.last_error_message).toBe('Query failed');
    });

    it('should delete metric', async () => {
      const metric = await metricService.createMetric(testOrgId, {
        name: 'Metric to Delete',
        type: 'count',
        category: 'sales',
        dataSource: 'source',
        query: 'SELECT * FROM table',
        refreshInterval: 'daily',
      });

      await metricService.deleteMetric(metric.id, testOrgId);

      try {
        await metricService.getMetricById(metric.id, testOrgId);
        expect.fail('Should have thrown NotFoundError');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
      }
    });
  });

  describe('Dashboard Service', () => {
    let testMetricId: string;

    beforeAll(async () => {
      const metric = await metricService.createMetric(testOrgId, {
        name: 'Dashboard Test Metric',
        type: 'count',
        category: 'sales',
        dataSource: 'source',
        query: 'SELECT * FROM table',
        refreshInterval: 'daily',
      });
      testMetricId = metric.id;
    });

    it('should create a dashboard', async () => {
      const dashboard = await dashboardService.createDashboard(testOrgId, {
        name: 'Sales Dashboard',
        description: 'Main sales metrics',
        layout: 'grid',
        isPublic: false,
      });

      expect(dashboard).toBeDefined();
      expect(dashboard.name).toBe('Sales Dashboard');
      expect(dashboard.status).toBe('active');
    });

    it('should reject dashboard without name', async () => {
      try {
        await dashboardService.createDashboard(testOrgId, {
          name: '',
          layout: 'grid',
        });
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
      }
    });

    it('should get dashboard by ID', async () => {
      const dashboard = await dashboardService.createDashboard(testOrgId, {
        name: 'Dashboard to Retrieve',
        layout: 'custom',
      });

      const retrieved = await dashboardService.getDashboardById(dashboard.id, testOrgId);
      expect(retrieved.id).toBe(dashboard.id);
      expect(retrieved.name).toBe('Dashboard to Retrieve');
    });

    it('should add widget to dashboard', async () => {
      const dashboard = await dashboardService.createDashboard(testOrgId, {
        name: 'Widget Test Dashboard',
        layout: 'grid',
      });

      const widget = await dashboardService.addWidget(dashboard.id, testOrgId, testMetricId, {
        position: 1,
        width: 'medium',
        height: 'medium',
        chartType: 'bar',
        timeRange: 'month',
        refreshInterval: 'hourly',
      });

      expect(widget).toBeDefined();
      expect(widget.dashboard_id).toBe(dashboard.id);
      expect(widget.metric_id).toBe(testMetricId);
    });

    it('should update widget', async () => {
      const dashboard = await dashboardService.createDashboard(testOrgId, {
        name: 'Update Widget Dashboard',
        layout: 'grid',
      });

      const widget = await dashboardService.addWidget(dashboard.id, testOrgId, testMetricId, {
        position: 1,
        width: 'small',
        height: 'small',
        chartType: 'line',
        timeRange: 'week',
      });

      const updated = await dashboardService.updateWidget(dashboard.id, widget.id, testOrgId, {
        chartType: 'pie',
        width: 'large',
      });

      expect(updated.chart_type).toBe('pie');
      expect(updated.width).toBe('large');
    });

    it('should remove widget from dashboard', async () => {
      const dashboard = await dashboardService.createDashboard(testOrgId, {
        name: 'Remove Widget Dashboard',
        layout: 'grid',
      });

      const widget = await dashboardService.addWidget(dashboard.id, testOrgId, testMetricId, {
        position: 1,
        width: 'medium',
        height: 'medium',
        chartType: 'bar',
        timeRange: 'month',
      });

      await dashboardService.removeWidget(dashboard.id, widget.id, testOrgId);

      const retrieved = await dashboardService.getDashboardById(dashboard.id, testOrgId);
      expect(retrieved.widgets.some((w) => w.id === widget.id)).toBe(false);
    });

    it('should list dashboards with pagination', async () => {
      for (let i = 0; i < 3; i++) {
        await dashboardService.createDashboard(testOrgId, {
          name: `Dashboard ${i}`,
          layout: 'grid',
        });
      }

      const result = await dashboardService.getOrganizationDashboards(testOrgId, 2, 0);
      expect(result.items.length).toBeLessThanOrEqual(2);
      expect(result.total).toBeGreaterThanOrEqual(3);
    });

    it('should update dashboard', async () => {
      const dashboard = await dashboardService.createDashboard(testOrgId, {
        name: 'Original Dashboard',
        layout: 'grid',
        isPublic: false,
      });

      const updated = await dashboardService.updateDashboard(dashboard.id, testOrgId, {
        name: 'Updated Dashboard',
        isPublic: true,
      });

      expect(updated.name).toBe('Updated Dashboard');
      expect(updated.is_public).toBe(true);
    });

    it('should delete dashboard', async () => {
      const dashboard = await dashboardService.createDashboard(testOrgId, {
        name: 'Dashboard to Delete',
        layout: 'grid',
      });

      await dashboardService.deleteDashboard(dashboard.id, testOrgId);

      try {
        await dashboardService.getDashboardById(dashboard.id, testOrgId);
        expect.fail('Should have thrown NotFoundError');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
      }
    });
  });

  describe('Report Service', () => {
    it('should create a report', async () => {
      const report = await reportService.createReport(testOrgId, testUserId, {
        name: 'Monthly Report',
        type: 'summary',
        metrics: ['metric-1'],
        format: 'pdf',
        schedule: { frequency: 'monthly', dayOfMonth: 1, time: '09:00' },
        recipients: ['admin@example.com'],
      });

      expect(report).toBeDefined();
      expect(report.name).toBe('Monthly Report');
      expect(report.status).toBe('draft');
    });

    it('should reject report without metrics', async () => {
      try {
        await reportService.createReport(testOrgId, testUserId, {
          name: 'Invalid Report',
          type: 'summary',
          metrics: [],
          format: 'pdf',
          schedule: { frequency: 'daily' },
          recipients: ['user@example.com'],
        });
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
      }
    });

    it('should get report by ID', async () => {
      const report = await reportService.createReport(testOrgId, testUserId, {
        name: 'Report to Retrieve',
        type: 'detailed',
        metrics: ['metric-1'],
        format: 'csv',
        schedule: { frequency: 'weekly' },
        recipients: ['user@example.com'],
      });

      const retrieved = await reportService.getReportById(report.id, testOrgId);
      expect(retrieved.id).toBe(report.id);
    });

    it('should list reports by status', async () => {
      await reportService.createReport(testOrgId, testUserId, {
        name: 'Active Report',
        type: 'summary',
        metrics: ['metric-1'],
        format: 'pdf',
        schedule: { frequency: 'daily' },
        recipients: ['user@example.com'],
      });

      const result = await reportService.getReportsByStatus(testOrgId, 'draft', 50, 0);
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should activate report', async () => {
      const report = await reportService.createReport(testOrgId, testUserId, {
        name: 'Report to Activate',
        type: 'summary',
        metrics: ['metric-1'],
        format: 'pdf',
        schedule: { frequency: 'daily' },
        recipients: ['user@example.com'],
      });

      const activated = await reportService.activateReport(report.id, testOrgId);
      expect(activated.status).toBe('active');
    });

    it('should deactivate report', async () => {
      const report = await reportService.createReport(testOrgId, testUserId, {
        name: 'Report to Deactivate',
        type: 'summary',
        metrics: ['metric-1'],
        format: 'pdf',
        schedule: { frequency: 'daily' },
        recipients: ['user@example.com'],
      });

      await reportService.activateReport(report.id, testOrgId);
      const deactivated = await reportService.deactivateReport(report.id, testOrgId);
      expect(deactivated.status).toBe('inactive');
    });

    it('should update report schedule', async () => {
      const report = await reportService.createReport(testOrgId, testUserId, {
        name: 'Report with Schedule',
        type: 'summary',
        metrics: ['metric-1'],
        format: 'pdf',
        schedule: { frequency: 'daily' },
        recipients: ['user@example.com'],
      });

      const updated = await reportService.updateReportSchedule(report.id, testOrgId, {
        frequency: 'weekly',
        dayOfWeek: 1,
        time: '10:00',
      });

      expect(updated.schedule.frequency).toBe('weekly');
    });

    it('should delete report', async () => {
      const report = await reportService.createReport(testOrgId, testUserId, {
        name: 'Report to Delete',
        type: 'summary',
        metrics: ['metric-1'],
        format: 'pdf',
        schedule: { frequency: 'daily' },
        recipients: ['user@example.com'],
      });

      await reportService.deleteReport(report.id, testOrgId);

      try {
        await reportService.getReportById(report.id, testOrgId);
        expect.fail('Should have thrown NotFoundError');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
      }
    });
  });

  describe('Analytics Event Service', () => {
    it('should track an analytics event', async () => {
      const event = await analyticsEventService.trackEvent(
        testOrgId,
        {
          eventType: 'user_signup',
          category: 'user',
          action: 'signup',
          label: 'premium_plan',
          value: 99,
          properties: { plan: 'premium' },
        },
        testUserId
      );

      expect(event).toBeDefined();
      expect(event.event_type).toBe('user_signup');
      expect(event.organization_id).toBe(testOrgId);
    });

    it('should reject event without event type', async () => {
      try {
        await analyticsEventService.trackEvent(
          testOrgId,
          {
            eventType: '',
            category: 'user',
            action: 'signup',
          },
          testUserId
        );
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
      }
    });

    it('should get events by type', async () => {
      await analyticsEventService.trackEvent(testOrgId, {
        eventType: 'page_view',
        category: 'page',
        action: 'view',
      });

      const result = await analyticsEventService.getEventsByType(testOrgId, 'page_view', 50, 0);
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should get events by category', async () => {
      await analyticsEventService.trackEvent(testOrgId, {
        eventType: 'form_submit',
        category: 'form',
        action: 'submit',
      });

      const result = await analyticsEventService.getEventsByCategory(testOrgId, 'form', 50, 0);
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should get events by user', async () => {
      const userId = 'analytics-user-' + Date.now();
      await analyticsEventService.trackEvent(
        testOrgId,
        {
          eventType: 'login',
          category: 'auth',
          action: 'login',
        },
        userId
      );

      const result = await analyticsEventService.getEventsByUser(testOrgId, userId, 50, 0);
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should get events by contact', async () => {
      const contactId = 'contact-' + Date.now();
      await analyticsEventService.trackEvent(
        testOrgId,
        {
          eventType: 'contact_message',
          category: 'contact',
          action: 'message',
        },
        undefined,
        contactId
      );

      const result = await analyticsEventService.getEventsByContact(testOrgId, contactId, 50, 0);
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should get event summary by date range', async () => {
      await analyticsEventService.trackEvent(testOrgId, {
        eventType: 'summary_test',
        category: 'test',
        action: 'test',
      });

      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();
      const summary = await analyticsEventService.getEventSummary(testOrgId, startDate, endDate);

      expect(typeof summary).toBe('object');
    });
  });

  describe('Query Service', () => {
    it('should execute a valid SELECT query', async () => {
      const result = await queryService.executeQuery(testOrgId, testUserId, 'SELECT 1 as result', 30000);

      expect(result).toBeDefined();
      expect(result.result.length).toBeGreaterThan(0);
      expect(result.executionTimeMs).toBeGreaterThan(0);
    });

    it('should reject DROP queries', async () => {
      try {
        await queryService.executeQuery(testOrgId, testUserId, 'DROP TABLE users', 30000);
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
      }
    });

    it('should reject DELETE queries', async () => {
      try {
        await queryService.executeQuery(testOrgId, testUserId, 'DELETE FROM users WHERE id = 1', 30000);
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
      }
    });

    it('should reject TRUNCATE queries', async () => {
      try {
        await queryService.executeQuery(testOrgId, testUserId, 'TRUNCATE TABLE users', 30000);
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
      }
    });

    it('should validate query without executing', async () => {
      const isValid = await queryService.validateQuery('SELECT * FROM users');
      expect(isValid).toBe(true);

      const isInvalid = await queryService.validateQuery('DROP TABLE users');
      expect(isInvalid).toBe(false);
    });

    it('should get query logs', async () => {
      await queryService.executeQuery(testOrgId, testUserId, 'SELECT 2 as result');

      const result = await queryService.getQueryLog(testOrgId, 50, 0);
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should get query statistics', async () => {
      await queryService.executeQuery(testOrgId, testUserId, 'SELECT 3 as result');

      const stats = await queryService.getQueryStats(testOrgId);
      expect(stats.total_queries).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Organization Isolation', () => {
    it('should not allow metric access across organizations', async () => {
      const otherOrgId = 'other-org-' + Date.now();
      const metric = await metricService.createMetric(testOrgId, {
        name: 'Isolated Metric',
        type: 'count',
        category: 'sales',
        dataSource: 'source',
        query: 'SELECT * FROM table',
        refreshInterval: 'daily',
      });

      try {
        await metricService.getMetricById(metric.id, otherOrgId);
        expect.fail('Should have thrown NotFoundError');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
      }
    });

    it('should not allow dashboard access across organizations', async () => {
      const otherOrgId = 'other-org-' + Date.now();
      const dashboard = await dashboardService.createDashboard(testOrgId, {
        name: 'Isolated Dashboard',
        layout: 'grid',
      });

      try {
        await dashboardService.getDashboardById(dashboard.id, otherOrgId);
        expect.fail('Should have thrown NotFoundError');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
      }
    });

    it('should filter events by organization', async () => {
      const otherOrgId = 'other-org-' + Date.now();

      await analyticsEventService.trackEvent(testOrgId, {
        eventType: 'isolation_test',
        category: 'test',
        action: 'test',
      });

      await analyticsEventService.trackEvent(otherOrgId, {
        eventType: 'isolation_test',
        category: 'test',
        action: 'test',
      });

      const testOrgResult = await analyticsEventService.getOrganizationEvents(testOrgId, 100, 0);
      const otherOrgResult = await analyticsEventService.getOrganizationEvents(otherOrgId, 100, 0);

      expect(testOrgResult.items.every((e) => e.organization_id === testOrgId)).toBe(true);
      expect(otherOrgResult.items.every((e) => e.organization_id === otherOrgId)).toBe(true);
    });
  });
});
