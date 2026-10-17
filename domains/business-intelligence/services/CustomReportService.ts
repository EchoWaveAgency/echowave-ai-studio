import { CustomReport, EXPORT_FORMATS } from '../models';

export class CustomReportService {
  private reports: Map<string, CustomReport> = new Map();

  constructor(private db: any) {}

  async createReport(organizationId: string, input: {
    name: string;
    description?: string;
    template: 'blank' | 'financial' | 'sales' | 'operational' | 'custom';
    metrics: string[];
    filters?: Record<string, any>;
    groupBy?: string;
    orderBy?: { field: string; order: 'asc' | 'desc' };
    visualization: 'table' | 'chart' | 'hybrid';
    chartType?: 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap';
    isScheduled?: boolean;
    schedule?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      recipients: string[];
      format: typeof EXPORT_FORMATS[number];
    };
  }, userId: string): Promise<CustomReport> {
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Report name is required');
    }

    if (!Array.isArray(input.metrics) || input.metrics.length === 0) {
      throw new Error('At least one metric is required');
    }

    if (input.visualization === 'chart' && !input.chartType) {
      throw new Error('Chart type is required for chart visualization');
    }

    const report: CustomReport = {
      id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      name: input.name,
      description: input.description,
      template: input.template,
      metrics: input.metrics,
      filters: input.filters || {},
      groupBy: input.groupBy,
      orderBy: input.orderBy,
      visualization: input.visualization,
      chartType: input.chartType,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isScheduled: input.isScheduled || false,
      schedule: input.schedule,
    };

    this.reports.set(report.id, report);
    return report;
  }

  async getReportById(organizationId: string, reportId: string): Promise<CustomReport> {
    const report = this.reports.get(reportId);
    if (!report || report.organizationId !== organizationId) {
      throw new Error('Report not found');
    }
    return report;
  }

  async getOrganizationReports(organizationId: string, limit: number = 50, offset: number = 0): Promise<{ items: CustomReport[]; total: number }> {
    const reports = Array.from(this.reports.values())
      .filter(r => r.organizationId === organizationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      items: reports.slice(offset, offset + limit),
      total: reports.length,
    };
  }

  async getReportsByTemplate(organizationId: string, template: string, limit: number = 50, offset: number = 0): Promise<{ items: CustomReport[]; total: number }> {
    const reports = Array.from(this.reports.values())
      .filter(r => r.organizationId === organizationId && r.template === template)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      items: reports.slice(offset, offset + limit),
      total: reports.length,
    };
  }

  async getScheduledReports(organizationId: string): Promise<CustomReport[]> {
    return Array.from(this.reports.values())
      .filter(r => r.organizationId === organizationId && r.isScheduled)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async updateReport(organizationId: string, reportId: string, updates: Partial<CustomReport>): Promise<CustomReport> {
    const report = await this.getReportById(organizationId, reportId);

    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length === 0) {
        throw new Error('Report name cannot be empty');
      }
      report.name = updates.name;
    }

    if (updates.description !== undefined) {
      report.description = updates.description;
    }

    if (updates.metrics !== undefined) {
      if (!Array.isArray(updates.metrics) || updates.metrics.length === 0) {
        throw new Error('At least one metric is required');
      }
      report.metrics = updates.metrics;
    }

    if (updates.filters !== undefined) {
      report.filters = updates.filters;
    }

    if (updates.groupBy !== undefined) {
      report.groupBy = updates.groupBy;
    }

    if (updates.orderBy !== undefined) {
      report.orderBy = updates.orderBy;
    }

    if (updates.visualization !== undefined) {
      if (updates.visualization === 'chart' && !updates.chartType) {
        throw new Error('Chart type is required for chart visualization');
      }
      report.visualization = updates.visualization;
    }

    if (updates.chartType !== undefined) {
      report.chartType = updates.chartType;
    }

    if (updates.schedule !== undefined) {
      report.schedule = updates.schedule;
    }

    report.updatedAt = new Date();
    return report;
  }

  async scheduleReport(organizationId: string, reportId: string, schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    format: typeof EXPORT_FORMATS[number];
  }): Promise<CustomReport> {
    const report = await this.getReportById(organizationId, reportId);
    report.isScheduled = true;
    report.schedule = schedule;
    report.updatedAt = new Date();
    return report;
  }

  async unscheduleReport(organizationId: string, reportId: string): Promise<CustomReport> {
    const report = await this.getReportById(organizationId, reportId);
    report.isScheduled = false;
    report.schedule = undefined;
    report.updatedAt = new Date();
    return report;
  }

  async generateReport(organizationId: string, reportId: string): Promise<{
    id: string;
    reportId: string;
    data: Record<string, any>;
    generatedAt: Date;
  }> {
    const report = await this.getReportById(organizationId, reportId);

    return {
      id: `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      reportId,
      data: {
        metrics: report.metrics,
        filters: report.filters,
        visualization: report.visualization,
        // Mock data generation
        rows: [
          { metric: report.metrics[0], value: 50000, target: 55000, variance: -8.3 },
          ...(report.metrics.slice(1).map((m, i) => ({
            metric: m,
            value: 40000 - (i * 5000),
            target: 45000 - (i * 5000),
            variance: -11,
          }))),
        ],
      },
      generatedAt: new Date(),
    };
  }

  async exportReport(organizationId: string, reportId: string, format: typeof EXPORT_FORMATS[number]): Promise<{
    id: string;
    reportId: string;
    format: typeof EXPORT_FORMATS[number];
    fileName: string;
    downloadUrl: string;
    expiresAt: Date;
  }> {
    const report = await this.getReportById(organizationId, reportId);

    const timestamp = new Date().toISOString().split('T')[0];
    const fileExtension = format === 'excel' ? 'xlsx' : format === 'csv' ? 'csv' : format;
    const fileName = `${report.name.replace(/\s+/g, '_')}_${timestamp}.${fileExtension}`;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return {
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      reportId,
      format,
      fileName,
      downloadUrl: `https://api.example.com/downloads/${Math.random().toString(36).substr(2, 9)}`,
      expiresAt,
    };
  }

  async duplicateReport(organizationId: string, reportId: string, newName: string, userId: string): Promise<CustomReport> {
    const original = await this.getReportById(organizationId, reportId);

    return this.createReport(organizationId, {
      name: newName,
      description: `Copy of ${original.name}`,
      template: original.template,
      metrics: [...original.metrics],
      filters: JSON.parse(JSON.stringify(original.filters)),
      groupBy: original.groupBy,
      orderBy: original.orderBy,
      visualization: original.visualization,
      chartType: original.chartType,
    }, userId);
  }

  async deleteReport(organizationId: string, reportId: string): Promise<void> {
    const report = await this.getReportById(organizationId, reportId);
    this.reports.delete(reportId);
  }

  async getReportStats(organizationId: string): Promise<{
    totalReports: number;
    scheduledReports: number;
    reportsByTemplate: Record<string, number>;
    reportsByVisualization: Record<string, number>;
  }> {
    const reports = Array.from(this.reports.values()).filter(r => r.organizationId === organizationId);

    const byTemplate: Record<string, number> = {};
    const byViz: Record<string, number> = {};

    reports.forEach(r => {
      byTemplate[r.template] = (byTemplate[r.template] || 0) + 1;
      byViz[r.visualization] = (byViz[r.visualization] || 0) + 1;
    });

    return {
      totalReports: reports.length,
      scheduledReports: reports.filter(r => r.isScheduled).length,
      reportsByTemplate: byTemplate,
      reportsByVisualization: byViz,
    };
  }
}
