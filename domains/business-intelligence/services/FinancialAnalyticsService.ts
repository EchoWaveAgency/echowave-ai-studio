import { FinancialMetrics, PERIOD_TYPES } from '../models';

export class FinancialAnalyticsService {
  private metrics: Map<string, FinancialMetrics> = new Map();

  constructor(private db: any) {}

  async calculateFinancialMetrics(organizationId: string, period: typeof PERIOD_TYPES[number], startDate: Date, endDate: Date): Promise<FinancialMetrics> {
    // Validate date range
    if (startDate >= endDate) {
      throw new Error('Start date must be before end date');
    }

    const metric: FinancialMetrics = {
      id: `fm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      period,
      startDate,
      endDate,
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      grossMargin: 0,
      operatingMargin: 0,
      revenueByCategory: {},
      expensesByCategory: {},
      paymentStatus: { paid: 0, pending: 0, overdue: 0 },
      invoiceMetrics: { count: 0, avgAmount: 0, avgPaymentTime: 0 },
      subscriptionMetrics: { mrr: 0, arr: 0, churnRate: 0 },
    };

    // Mock calculation - in real scenario, query from database
    metric.totalRevenue = await this.calculateTotalRevenue(organizationId, startDate, endDate);
    metric.totalExpenses = await this.calculateTotalExpenses(organizationId, startDate, endDate);
    metric.netProfit = metric.totalRevenue - metric.totalExpenses;
    metric.grossMargin = metric.totalRevenue > 0 ? ((metric.totalRevenue - metric.totalExpenses) / metric.totalRevenue) * 100 : 0;
    metric.operatingMargin = metric.totalRevenue > 0 ? (metric.netProfit / metric.totalRevenue) * 100 : 0;

    metric.revenueByCategory = await this.getRevenueByCategory(organizationId, startDate, endDate);
    metric.expensesByCategory = await this.getExpensesByCategory(organizationId, startDate, endDate);
    metric.paymentStatus = await this.getPaymentStatus(organizationId, startDate, endDate);
    metric.invoiceMetrics = await this.getInvoiceMetrics(organizationId, startDate, endDate);
    metric.subscriptionMetrics = await this.getSubscriptionMetrics(organizationId, startDate, endDate);

    this.metrics.set(metric.id, metric);
    return metric;
  }

  private async calculateTotalRevenue(organizationId: string, startDate: Date, endDate: Date): Promise<number> {
    // Query invoices paid and due in range
    // For now, return mock data
    return 50000;
  }

  private async calculateTotalExpenses(organizationId: string, startDate: Date, endDate: Date): Promise<number> {
    // Query expenses in range
    return 20000;
  }

  private async getRevenueByCategory(organizationId: string, startDate: Date, endDate: Date): Promise<Record<string, number>> {
    return {
      'Services': 30000,
      'Subscriptions': 15000,
      'Products': 5000,
    };
  }

  private async getExpensesByCategory(organizationId: string, startDate: Date, endDate: Date): Promise<Record<string, number>> {
    return {
      'Payroll': 12000,
      'Operations': 5000,
      'Marketing': 3000,
    };
  }

  private async getPaymentStatus(organizationId: string, startDate: Date, endDate: Date): Promise<{ paid: number; pending: number; overdue: number }> {
    return { paid: 30000, pending: 15000, overdue: 5000 };
  }

  private async getInvoiceMetrics(organizationId: string, startDate: Date, endDate: Date): Promise<{ count: number; avgAmount: number; avgPaymentTime: number }> {
    return { count: 45, avgAmount: 1222.22, avgPaymentTime: 15 };
  }

  private async getSubscriptionMetrics(organizationId: string, startDate: Date, endDate: Date): Promise<{ mrr: number; arr: number; churnRate: number }> {
    const mrr = 5000;
    return { mrr, arr: mrr * 12, churnRate: 2.5 };
  }

  async getMetricById(organizationId: string, metricId: string): Promise<FinancialMetrics> {
    const metric = this.metrics.get(metricId);
    if (!metric || metric.organizationId !== organizationId) {
      throw new Error('Financial metrics not found');
    }
    return metric;
  }

  async getOrganizationMetrics(organizationId: string, limit: number = 50, offset: number = 0): Promise<{ items: FinancialMetrics[]; total: number }> {
    const metrics = Array.from(this.metrics.values())
      .filter(m => m.organizationId === organizationId)
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

    return {
      items: metrics.slice(offset, offset + limit),
      total: metrics.length,
    };
  }

  async getMetricsByPeriod(organizationId: string, period: typeof PERIOD_TYPES[number], limit: number = 50, offset: number = 0): Promise<{ items: FinancialMetrics[]; total: number }> {
    const metrics = Array.from(this.metrics.values())
      .filter(m => m.organizationId === organizationId && m.period === period)
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

    return {
      items: metrics.slice(offset, offset + limit),
      total: metrics.length,
    };
  }

  async getLatestMetrics(organizationId: string): Promise<FinancialMetrics | null> {
    const metrics = Array.from(this.metrics.values())
      .filter(m => m.organizationId === organizationId)
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

    return metrics.length > 0 ? metrics[0] : null;
  }

  async compareMetrics(organizationId: string, metric1Id: string, metric2Id: string): Promise<{
    revenueChange: number;
    profitChange: number;
    marginChange: number;
  }> {
    const m1 = await this.getMetricById(organizationId, metric1Id);
    const m2 = await this.getMetricById(organizationId, metric2Id);

    return {
      revenueChange: m2.totalRevenue - m1.totalRevenue,
      profitChange: m2.netProfit - m1.netProfit,
      marginChange: m2.grossMargin - m1.grossMargin,
    };
  }

  async getCashFlowAnalysis(organizationId: string, startDate: Date, endDate: Date): Promise<{
    inflows: number;
    outflows: number;
    netCashFlow: number;
    operatingCashFlow: number;
    investingCashFlow: number;
    financingCashFlow: number;
  }> {
    return {
      inflows: 50000,
      outflows: 20000,
      netCashFlow: 30000,
      operatingCashFlow: 35000,
      investingCashFlow: -3000,
      financingCashFlow: -2000,
    };
  }

  async getProfitabilityAnalysis(organizationId: string, startDate: Date, endDate: Date): Promise<{
    grossProfit: number;
    grossProfitMargin: number;
    operatingProfit: number;
    operatingMargin: number;
    netProfit: number;
    netMargin: number;
    roi: number;
  }> {
    const revenue = 50000;
    const cogs = 15000;
    const expenses = 20000;

    const grossProfit = revenue - cogs;
    const operatingProfit = grossProfit - expenses;

    return {
      grossProfit,
      grossProfitMargin: (grossProfit / revenue) * 100,
      operatingProfit,
      operatingMargin: (operatingProfit / revenue) * 100,
      netProfit: operatingProfit,
      netMargin: (operatingProfit / revenue) * 100,
      roi: ((operatingProfit) / revenue) * 100,
    };
  }

  async getRevenueRecognition(organizationId: string, startDate: Date, endDate: Date): Promise<{
    recognizedRevenue: number;
    deferredRevenue: number;
    recognitionRate: number;
  }> {
    return {
      recognizedRevenue: 45000,
      deferredRevenue: 5000,
      recognitionRate: 90,
    };
  }

  async getTaxAnalysis(organizationId: string, startDate: Date, endDate: Date): Promise<{
    taxableIncome: number;
    estimatedTax: number;
    effectiveTaxRate: number;
    vat: number;
  }> {
    const taxableIncome = 30000;
    const estimatedTax = taxableIncome * 0.2;
    const vat = 50000 * 0.14; // 14% VAT on revenue

    return {
      taxableIncome,
      estimatedTax,
      effectiveTaxRate: (estimatedTax / taxableIncome) * 100,
      vat,
    };
  }

  async delete(organizationId: string, metricId: string): Promise<void> {
    const metric = await this.getMetricById(organizationId, metricId);
    this.metrics.delete(metricId);
  }
}
