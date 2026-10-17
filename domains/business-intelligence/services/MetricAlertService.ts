import { MetricAlert, ALERT_TYPES } from '../models';

export class MetricAlertService {
  private alerts: Map<string, MetricAlert> = new Map();

  constructor(private db: any) {}

  async createAlert(organizationId: string, input: {
    metricKey: string;
    type: typeof ALERT_TYPES[number];
    condition: 'exceeds' | 'falls_below' | 'increases_by' | 'decreases_by';
    value: number;
    notificationChannels: ('email' | 'sms' | 'in_app' | 'webhook')[];
    recipients: string[];
  }): Promise<MetricAlert> {
    if (!input.metricKey || input.metricKey.trim().length === 0) {
      throw new Error('Metric key is required');
    }

    if (!ALERT_TYPES.includes(input.type)) {
      throw new Error(`Invalid alert type: ${input.type}`);
    }

    if (!Array.isArray(input.notificationChannels) || input.notificationChannels.length === 0) {
      throw new Error('At least one notification channel is required');
    }

    if (!Array.isArray(input.recipients) || input.recipients.length === 0) {
      throw new Error('At least one recipient is required');
    }

    const alert: MetricAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      metricKey: input.metricKey,
      type: input.type,
      condition: input.condition,
      value: input.value,
      enabled: true,
      notificationChannels: input.notificationChannels,
      recipients: input.recipients,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.alerts.set(alert.id, alert);
    return alert;
  }

  async getAlertById(organizationId: string, alertId: string): Promise<MetricAlert> {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.organizationId !== organizationId) {
      throw new Error('Alert not found');
    }
    return alert;
  }

  async getOrganizationAlerts(organizationId: string, limit: number = 50, offset: number = 0): Promise<{ items: MetricAlert[]; total: number }> {
    const alerts = Array.from(this.alerts.values())
      .filter(a => a.organizationId === organizationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      items: alerts.slice(offset, offset + limit),
      total: alerts.length,
    };
  }

  async getAlertsByMetric(organizationId: string, metricKey: string, limit: number = 50, offset: number = 0): Promise<{ items: MetricAlert[]; total: number }> {
    const alerts = Array.from(this.alerts.values())
      .filter(a => a.organizationId === organizationId && a.metricKey === metricKey)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      items: alerts.slice(offset, offset + limit),
      total: alerts.length,
    };
  }

  async getActiveAlerts(organizationId: string): Promise<MetricAlert[]> {
    return Array.from(this.alerts.values())
      .filter(a => a.organizationId === organizationId && a.enabled)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAlertsByType(organizationId: string, type: typeof ALERT_TYPES[number]): Promise<MetricAlert[]> {
    return Array.from(this.alerts.values())
      .filter(a => a.organizationId === organizationId && a.type === type)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateAlert(organizationId: string, alertId: string, updates: Partial<MetricAlert>): Promise<MetricAlert> {
    const alert = await this.getAlertById(organizationId, alertId);

    if (updates.value !== undefined) {
      if (updates.value <= 0) {
        throw new Error('Alert value must be positive');
      }
      alert.value = updates.value;
    }

    if (updates.condition !== undefined) {
      alert.condition = updates.condition;
    }

    if (updates.notificationChannels !== undefined) {
      if (!Array.isArray(updates.notificationChannels) || updates.notificationChannels.length === 0) {
        throw new Error('At least one notification channel is required');
      }
      alert.notificationChannels = updates.notificationChannels;
    }

    if (updates.recipients !== undefined) {
      if (!Array.isArray(updates.recipients) || updates.recipients.length === 0) {
        throw new Error('At least one recipient is required');
      }
      alert.recipients = updates.recipients;
    }

    alert.updatedAt = new Date();
    return alert;
  }

  async toggleAlert(organizationId: string, alertId: string): Promise<MetricAlert> {
    const alert = await this.getAlertById(organizationId, alertId);
    alert.enabled = !alert.enabled;
    alert.updatedAt = new Date();
    return alert;
  }

  async enableAlert(organizationId: string, alertId: string): Promise<MetricAlert> {
    const alert = await this.getAlertById(organizationId, alertId);
    alert.enabled = true;
    alert.updatedAt = new Date();
    return alert;
  }

  async disableAlert(organizationId: string, alertId: string): Promise<MetricAlert> {
    const alert = await this.getAlertById(organizationId, alertId);
    alert.enabled = false;
    alert.updatedAt = new Date();
    return alert;
  }

  async checkAlert(organizationId: string, metricKey: string, currentValue: number): Promise<{
    alert: MetricAlert | null;
    triggered: boolean;
    message: string;
  }> {
    const alerts = Array.from(this.alerts.values())
      .filter(a => a.organizationId === organizationId && a.metricKey === metricKey && a.enabled);

    for (const alert of alerts) {
      let triggered = false;

      if (alert.condition === 'exceeds' && currentValue > alert.value) {
        triggered = true;
      } else if (alert.condition === 'falls_below' && currentValue < alert.value) {
        triggered = true;
      } else if (alert.condition === 'increases_by' && currentValue > alert.value) {
        triggered = true;
      } else if (alert.condition === 'decreases_by' && currentValue < alert.value) {
        triggered = true;
      }

      if (triggered) {
        alert.lastTriggered = new Date();
        return {
          alert,
          triggered: true,
          message: `Alert triggered: ${metricKey} ${alert.condition} ${alert.value}. Current value: ${currentValue}`,
        };
      }
    }

    return {
      alert: null,
      triggered: false,
      message: '',
    };
  }

  async getTriggeredAlerts(organizationId: string, limit: number = 50, offset: number = 0): Promise<{ items: MetricAlert[]; total: number }> {
    const alerts = Array.from(this.alerts.values())
      .filter(a => a.organizationId === organizationId && a.lastTriggered !== undefined)
      .sort((a, b) => (b.lastTriggered?.getTime() || 0) - (a.lastTriggered?.getTime() || 0));

    return {
      items: alerts.slice(offset, offset + limit),
      total: alerts.length,
    };
  }

  async getRecentlyTriggeredAlerts(organizationId: string, hours: number = 24): Promise<MetricAlert[]> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    return Array.from(this.alerts.values())
      .filter(a => a.organizationId === organizationId && a.lastTriggered && a.lastTriggered > cutoffTime)
      .sort((a, b) => (b.lastTriggered?.getTime() || 0) - (a.lastTriggered?.getTime() || 0));
  }

  async deleteAlert(organizationId: string, alertId: string): Promise<void> {
    const alert = await this.getAlertById(organizationId, alertId);
    this.alerts.delete(alertId);
  }

  async bulkEnableAlerts(organizationId: string, alertIds: string[]): Promise<MetricAlert[]> {
    const updated: MetricAlert[] = [];

    for (const alertId of alertIds) {
      const alert = await this.getAlertById(organizationId, alertId);
      alert.enabled = true;
      alert.updatedAt = new Date();
      updated.push(alert);
    }

    return updated;
  }

  async bulkDisableAlerts(organizationId: string, alertIds: string[]): Promise<MetricAlert[]> {
    const updated: MetricAlert[] = [];

    for (const alertId of alertIds) {
      const alert = await this.getAlertById(organizationId, alertId);
      alert.enabled = false;
      alert.updatedAt = new Date();
      updated.push(alert);
    }

    return updated;
  }

  async getAlertStats(organizationId: string): Promise<{
    totalAlerts: number;
    enabledAlerts: number;
    disabledAlerts: number;
    triggeredInLast24h: number;
    alertsByType: Record<string, number>;
  }> {
    const allAlerts = Array.from(this.alerts.values()).filter(a => a.organizationId === organizationId);
    const cutoff24h = new Date();
    cutoff24h.setHours(cutoff24h.getHours() - 24);

    const byType: Record<string, number> = {};
    allAlerts.forEach(a => {
      byType[a.type] = (byType[a.type] || 0) + 1;
    });

    return {
      totalAlerts: allAlerts.length,
      enabledAlerts: allAlerts.filter(a => a.enabled).length,
      disabledAlerts: allAlerts.filter(a => !a.enabled).length,
      triggeredInLast24h: allAlerts.filter(a => a.lastTriggered && a.lastTriggered > cutoff24h).length,
      alertsByType: byType,
    };
  }
}
