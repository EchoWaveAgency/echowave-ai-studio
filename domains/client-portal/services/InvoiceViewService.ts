import { v4 as uuidv4 } from 'uuid';

export interface ClientInvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ClientInvoicePaymentMethod {
  id: string;
  type: 'bank_transfer' | 'credit_card' | 'check' | 'cash';
  displayName: string;
  accountNumber?: string;
  bankName?: string;
  cardLastFour?: string;
  instructions?: string;
}

export interface ClientInvoiceView {
  id: string;
  organizationId: string;
  clientAccountId: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  lineItems: ClientInvoiceLineItem[];
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';
  paymentMethods: ClientInvoicePaymentMethod[];
  notes?: string;
  viewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class InvoiceViewService {
  private invoiceStorage = new Map<string, ClientInvoiceView>();
  private paymentMethodStorage = new Map<string, ClientInvoicePaymentMethod>();

  createInvoiceView(
    organizationId: string,
    clientAccountId: string,
    invoiceNumber: string,
    invoiceDate: Date,
    dueDate: Date,
    lineItems: ClientInvoiceLineItem[],
    paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue',
    paymentMethods: ClientInvoicePaymentMethod[],
    notes?: string
  ): ClientInvoiceView {
    if (!invoiceNumber || invoiceNumber.trim().length === 0) {
      throw new Error('Invoice number is required');
    }

    if (lineItems.length === 0) {
      throw new Error('At least one line item is required');
    }

    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const tax = Math.round(subtotal * 0.15 * 100) / 100;
    const discount = 0;
    const total = subtotal + tax - discount;

    const invoice: ClientInvoiceView = {
      id: uuidv4(),
      organizationId,
      clientAccountId,
      invoiceNumber,
      invoiceDate,
      dueDate,
      subtotal,
      tax,
      discount,
      total,
      lineItems,
      paymentStatus,
      paymentMethods,
      notes: notes || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.invoiceStorage.set(invoice.id, invoice);
    return invoice;
  }

  getClientInvoiceView(
    organizationId: string,
    clientAccountId: string,
    invoiceId: string
  ): ClientInvoiceView | null {
    const invoice = this.invoiceStorage.get(invoiceId);
    if (!invoice || invoice.organizationId !== organizationId || invoice.clientAccountId !== clientAccountId) {
      return null;
    }
    return invoice;
  }

  getClientInvoices(
    organizationId: string,
    clientAccountId: string,
    paymentStatus?: 'pending' | 'partial' | 'paid' | 'overdue',
    limit: number = 20,
    offset: number = 0
  ): ClientInvoiceView[] {
    let invoices = Array.from(this.invoiceStorage.values()).filter(
      (inv) =>
        inv.organizationId === organizationId &&
        inv.clientAccountId === clientAccountId
    );

    if (paymentStatus) {
      invoices = invoices.filter((inv) => inv.paymentStatus === paymentStatus);
    }

    return invoices
      .sort((a, b) => b.invoiceDate.getTime() - a.invoiceDate.getTime())
      .slice(offset, offset + limit);
  }

  markInvoiceAsViewed(
    organizationId: string,
    clientAccountId: string,
    invoiceId: string
  ): ClientInvoiceView | null {
    const invoice = this.invoiceStorage.get(invoiceId);
    if (!invoice || invoice.organizationId !== organizationId || invoice.clientAccountId !== clientAccountId) {
      return null;
    }

    invoice.viewedAt = new Date();
    invoice.updatedAt = new Date();
    this.invoiceStorage.set(invoiceId, invoice);

    return invoice;
  }

  updatePaymentStatus(
    organizationId: string,
    clientAccountId: string,
    invoiceId: string,
    paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue'
  ): ClientInvoiceView | null {
    const invoice = this.invoiceStorage.get(invoiceId);
    if (!invoice || invoice.organizationId !== organizationId || invoice.clientAccountId !== clientAccountId) {
      return null;
    }

    invoice.paymentStatus = paymentStatus;
    invoice.updatedAt = new Date();
    this.invoiceStorage.set(invoiceId, invoice);

    return invoice;
  }

  getInvoicePaymentMethods(
    organizationId: string,
    clientAccountId: string,
    invoiceId: string
  ): ClientInvoicePaymentMethod[] {
    const invoice = this.invoiceStorage.get(invoiceId);
    if (!invoice || invoice.organizationId !== organizationId || invoice.clientAccountId !== clientAccountId) {
      return [];
    }

    return invoice.paymentMethods;
  }

  addPaymentMethod(
    organizationId: string,
    clientAccountId: string,
    invoiceId: string,
    paymentMethod: ClientInvoicePaymentMethod
  ): ClientInvoiceView | null {
    const invoice = this.invoiceStorage.get(invoiceId);
    if (!invoice || invoice.organizationId !== organizationId || invoice.clientAccountId !== clientAccountId) {
      return null;
    }

    invoice.paymentMethods.push(paymentMethod);
    invoice.updatedAt = new Date();
    this.invoiceStorage.set(invoiceId, invoice);

    return invoice;
  }

  validatePaymentMethod(
    organizationId: string,
    paymentMethod: ClientInvoicePaymentMethod
  ): boolean {
    if (!paymentMethod || !paymentMethod.type) {
      return false;
    }

    const validTypes = ['bank_transfer', 'credit_card', 'check', 'cash'];
    if (!validTypes.includes(paymentMethod.type)) {
      return false;
    }

    if (paymentMethod.type === 'bank_transfer') {
      if (!paymentMethod.bankName || !paymentMethod.accountNumber) {
        return false;
      }
    }

    if (paymentMethod.type === 'credit_card') {
      if (!paymentMethod.cardLastFour || paymentMethod.cardLastFour.length !== 4) {
        return false;
      }
    }

    return true;
  }

  getOverdueInvoices(
    organizationId: string,
    clientAccountId: string,
    limit: number = 20,
    offset: number = 0
  ): ClientInvoiceView[] {
    const now = new Date();
    return Array.from(this.invoiceStorage.values())
      .filter(
        (inv) =>
          inv.organizationId === organizationId &&
          inv.clientAccountId === clientAccountId &&
          inv.paymentStatus !== 'paid' &&
          inv.dueDate < now
      )
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
      .slice(offset, offset + limit);
  }

  getUpcomingInvoices(
    organizationId: string,
    clientAccountId: string,
    daysAhead: number = 30,
    limit: number = 20,
    offset: number = 0
  ): ClientInvoiceView[] {
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    return Array.from(this.invoiceStorage.values())
      .filter(
        (inv) =>
          inv.organizationId === organizationId &&
          inv.clientAccountId === clientAccountId &&
          inv.paymentStatus !== 'paid' &&
          inv.dueDate >= now &&
          inv.dueDate <= futureDate
      )
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
      .slice(offset, offset + limit);
  }

  getInvoiceTotal(
    organizationId: string,
    clientAccountId: string,
    invoiceId: string
  ): number | null {
    const invoice = this.invoiceStorage.get(invoiceId);
    if (!invoice || invoice.organizationId !== organizationId || invoice.clientAccountId !== clientAccountId) {
      return null;
    }

    return invoice.total;
  }

  getClientInvoiceSummary(
    organizationId: string,
    clientAccountId: string
  ): {
    totalInvoices: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
  } {
    const invoices = Array.from(this.invoiceStorage.values()).filter(
      (inv) =>
        inv.organizationId === organizationId &&
        inv.clientAccountId === clientAccountId
    );

    const now = new Date();

    return {
      totalInvoices: invoices.length,
      totalAmount: Math.round(invoices.reduce((sum, inv) => sum + inv.total, 0) * 100) / 100,
      paidAmount: Math.round(invoices
        .filter((inv) => inv.paymentStatus === 'paid')
        .reduce((sum, inv) => sum + inv.total, 0) * 100) / 100,
      pendingAmount: Math.round(invoices
        .filter((inv) => inv.paymentStatus === 'pending' || inv.paymentStatus === 'partial')
        .reduce((sum, inv) => sum + inv.total, 0) * 100) / 100,
      overdueAmount: Math.round(invoices
        .filter((inv) => inv.paymentStatus === 'pending' && inv.dueDate < now)
        .reduce((sum, inv) => sum + inv.total, 0) * 100) / 100,
    };
  }

  deleteInvoice(organizationId: string, clientAccountId: string, invoiceId: string): boolean {
    const invoice = this.invoiceStorage.get(invoiceId);
    if (!invoice || invoice.organizationId !== organizationId || invoice.clientAccountId !== clientAccountId) {
      return false;
    }

    this.invoiceStorage.delete(invoiceId);
    return true;
  }
}
