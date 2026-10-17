import { Report, ReportSection, ReportSchedule, ReportVisualization } from '../models/index.js';

export class ReportService {
  private reports: Map<string, Report> = new Map();
  private nextReportId = 1;

  createReport(
    organization_id: string,
    name: string,
    description: string,
    type: string,
    created_by: string
  ): Report {
    if (!name || name.trim().length === 0) {
      throw new Error('Report name is required');
    }

    const id = `report_${this.nextReportId++}`;
    const report: Report = {
      id,
      organization_id,
      name,
      description,
      type: type as 'operational' | 'financial' | 'sales' | 'project' | 'marketing' | 'custom',
      sections: [],
      schedule: {
        enabled: false,
        frequency: 'monthly'
      },
      recipients: [],
      created_by,
      updated_by: created_by,
      created_at: new Date(),
      updated_at: new Date()
    };

    this.reports.set(id, report);
    return report;
  }

  getReportById(organization_id: string, report_id: string): Report | null {
    const report = this.reports.get(report_id);
    if (!report || report.organization_id !== organization_id) {
      return null;
    }
    return report;
  }

  getOrganizationReports(organization_id: string, type?: string): Report[] {
    return Array.from(this.reports.values()).filter(r => {
      if (r.organization_id !== organization_id) return false;
      if (type && r.type !== type) return false;
      return true;
    });
  }

  updateReport(
    organization_id: string,
    report_id: string,
    updates: Partial<Report>
  ): Report | null {
    const report = this.getReportById(organization_id, report_id);
    if (!report) return null;

    const updated = {
      ...report,
      ...updates,
      id: report.id,
      organization_id: report.organization_id,
      created_by: report.created_by,
      updated_at: new Date()
    };

    this.reports.set(report_id, updated);
    return updated;
  }

  deleteReport(organization_id: string, report_id: string): boolean {
    const report = this.getReportById(organization_id, report_id);
    if (!report) return false;

    return this.reports.delete(report_id);
  }

  addSection(
    organization_id: string,
    report_id: string,
    title: string,
    description: string
  ): ReportSection | null {
    const report = this.getReportById(organization_id, report_id);
    if (!report) return null;

    const section: ReportSection = {
      id: `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      data_sources: [],
      visualizations: [],
      order: report.sections.length
    };

    report.sections.push(section);
    return section;
  }

  removeSection(organization_id: string, report_id: string, section_id: string): boolean {
    const report = this.getReportById(organization_id, report_id);
    if (!report) return false;

    const index = report.sections.findIndex(s => s.id === section_id);
    if (index === -1) return false;

    report.sections.splice(index, 1);
    return true;
  }

  addVisualizationToSection(
    organization_id: string,
    report_id: string,
    section_id: string,
    visualization: ReportVisualization
  ): ReportVisualization | null {
    const report = this.getReportById(organization_id, report_id);
    if (!report) return null;

    const section = report.sections.find(s => s.id === section_id);
    if (!section) return null;

    section.visualizations.push(visualization);
    return visualization;
  }

  removeVisualizationFromSection(
    organization_id: string,
    report_id: string,
    section_id: string,
    visualization_id: string
  ): boolean {
    const report = this.getReportById(organization_id, report_id);
    if (!report) return false;

    const section = report.sections.find(s => s.id === section_id);
    if (!section) return false;

    const index = section.visualizations.findIndex(v => v.id === visualization_id);
    if (index === -1) return false;

    section.visualizations.splice(index, 1);
    return true;
  }

  setReportSchedule(
    organization_id: string,
    report_id: string,
    schedule: Partial<ReportSchedule>
  ): Report | null {
    const report = this.getReportById(organization_id, report_id);
    if (!report) return null;

    report.schedule = { ...report.schedule, ...schedule };

    if (schedule.enabled && schedule.frequency) {
      const nextRun = this.calculateNextRunDate(schedule.frequency, schedule.time_of_day);
      report.schedule.next_run = nextRun;
    }

    report.updated_at = new Date();
    this.reports.set(report_id, report);
    return report;
  }

  addRecipient(organization_id: string, report_id: string, email: string): Report | null {
    const report = this.getReportById(organization_id, report_id);
    if (!report) return null;

    if (!report.recipients.includes(email)) {
      report.recipients.push(email);
      report.updated_at = new Date();
      this.reports.set(report_id, report);
    }

    return report;
  }

  removeRecipient(organization_id: string, report_id: string, email: string): Report | null {
    const report = this.getReportById(organization_id, report_id);
    if (!report) return null;

    report.recipients = report.recipients.filter(r => r !== email);
    report.updated_at = new Date();
    this.reports.set(report_id, report);
    return report;
  }

  generateReport(organization_id: string, report_id: string): {
    report: Report;
    generated_at: Date;
    recipient_count: number;
  } | null {
    const report = this.getReportById(organization_id, report_id);
    if (!report) return null;

    return {
      report,
      generated_at: new Date(),
      recipient_count: report.recipients.length
    };
  }

  getScheduledReports(organization_id: string): Report[] {
    return this.getOrganizationReports(organization_id).filter(r => r.schedule.enabled);
  }

  private calculateNextRunDate(frequency: string, time_of_day?: string): Date {
    const now = new Date();
    const next = new Date(now);

    const [hours, minutes] = (time_of_day || '09:00').split(':').map(Number);
    next.setHours(hours, minutes, 0, 0);

    switch (frequency) {
      case 'daily':
        if (next <= now) next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        if (next <= now) next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        if (next <= now) next.setMonth(next.getMonth() + 1);
        break;
      case 'quarterly':
        if (next <= now) next.setMonth(next.getMonth() + 3);
        break;
      case 'yearly':
        if (next <= now) next.setFullYear(next.getFullYear() + 1);
        break;
    }

    return next;
  }
}
