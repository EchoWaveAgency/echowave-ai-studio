import { v4 as uuidv4 } from 'uuid';
import {
  PaymentRecord,
  PaymentMethod,
  PaymentGatewayConfig,
  PaymentReconciliation,
  WebhookSubscription,
  WebhookEvent,
  WebhookLog,
  PaymentStatus,
  PaymentGatewayType,
  WebhookEventType,
} from '../models';

export class PaymentService {
  private paymentStorage = new Map<string, PaymentRecord>();
  private methodStorage = new Map<string, PaymentMethod>();
  private gatewayConfigStorage = new Map<string, PaymentGatewayConfig>();
  private reconciliationStorage = new Map<string, PaymentReconciliation>();
  private webhookSubscriptionStorage = new Map<string, WebhookSubscription>();
  private webhookEventStorage = new Map<string, WebhookEvent>();
  private webhookLogStorage = new Map<string, WebhookLog>();

  createPayment(
    organizationId: string,
    amount: number,
    currency: string,
    gatewayType: PaymentGatewayType,
    externalTransactionId: string,
    description: string,
    documentId?: string,
    invoiceId?: string,
    paymentMethodId?: string,
    metadata?: Record<string, any>
  ): PaymentRecord {
    const paymentId = uuidv4();
    const payment: PaymentRecord = {
      id: paymentId,
      organizationId,
      documentId,
      invoiceId,
      amount,
      currency,
      gatewayType,
      status: PaymentStatus.PENDING,
      externalTransactionId,
      paymentMethodId,
      description,
      metadata: metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.paymentStorage.set(paymentId, payment);
    return payment;
  }

  getPaymentById(organizationId: string, paymentId: string): PaymentRecord | null {
    const payment = this.paymentStorage.get(paymentId);
    if (!payment || payment.organizationId !== organizationId) {
      return null;
    }
    return payment;
  }

  getOrganizationPayments(
    organizationId: string,
    limit: number = 50,
    offset: number = 0
  ): PaymentRecord[] {
    return Array.from(this.paymentStorage.values())
      .filter((p) => p.organizationId === organizationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  getPaymentsByStatus(
    organizationId: string,
    status: PaymentStatus,
    limit: number = 50,
    offset: number = 0
  ): PaymentRecord[] {
    return Array.from(this.paymentStorage.values())
      .filter((p) => p.organizationId === organizationId && p.status === status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  authorizePayment(organizationId: string, paymentId: string): PaymentRecord | null {
    const payment = this.paymentStorage.get(paymentId);
    if (!payment || payment.organizationId !== organizationId) {
      return null;
    }

    payment.status = PaymentStatus.AUTHORIZED;
    payment.authorizedAt = new Date();
    payment.updatedAt = new Date();
    this.paymentStorage.set(paymentId, payment);

    return payment;
  }

  capturePayment(organizationId: string, paymentId: string): PaymentRecord | null {
    const payment = this.paymentStorage.get(paymentId);
    if (!payment || payment.organizationId !== organizationId) {
      return null;
    }

    payment.status = PaymentStatus.CAPTURED;
    payment.capturedAt = new Date();
    payment.updatedAt = new Date();
    this.paymentStorage.set(paymentId, payment);

    return payment;
  }

  refundPayment(organizationId: string, paymentId: string): PaymentRecord | null {
    const payment = this.paymentStorage.get(paymentId);
    if (!payment || payment.organizationId !== organizationId) {
      return null;
    }

    payment.status = PaymentStatus.REFUNDED;
    payment.refundedAt = new Date();
    payment.updatedAt = new Date();
    this.paymentStorage.set(paymentId, payment);

    return payment;
  }

  failPayment(
    organizationId: string,
    paymentId: string,
    failureReason: string
  ): PaymentRecord | null {
    const payment = this.paymentStorage.get(paymentId);
    if (!payment || payment.organizationId !== organizationId) {
      return null;
    }

    payment.status = PaymentStatus.FAILED;
    payment.failureReason = failureReason;
    payment.failedAt = new Date();
    payment.updatedAt = new Date();
    this.paymentStorage.set(paymentId, payment);

    return payment;
  }

  addPaymentMethod(
    organizationId: string,
    methodType: 'CARD' | 'BANK_TRANSFER' | 'MOBILE_WALLET' | 'CASH',
    displayName: string,
    last4Digits?: string,
    expiryDate?: Date,
    cardBrand?: string
  ): PaymentMethod {
    const methodId = uuidv4();
    const method: PaymentMethod = {
      id: methodId,
      organizationId,
      methodType,
      displayName,
      last4Digits,
      expiryDate,
      cardBrand,
      isDefault: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.methodStorage.set(methodId, method);
    return method;
  }

  getPaymentMethodById(organizationId: string, methodId: string): PaymentMethod | null {
    const method = this.methodStorage.get(methodId);
    if (!method || method.organizationId !== organizationId) {
      return null;
    }
    return method;
  }

  getOrganizationPaymentMethods(
    organizationId: string,
    limit: number = 20,
    offset: number = 0
  ): PaymentMethod[] {
    return Array.from(this.methodStorage.values())
      .filter((m) => m.organizationId === organizationId && m.isActive)
      .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0))
      .slice(offset, offset + limit);
  }

  setDefaultPaymentMethod(organizationId: string, methodId: string): PaymentMethod | null {
    const method = this.methodStorage.get(methodId);
    if (!method || method.organizationId !== organizationId) {
      return null;
    }

    // Unset previous default
    Array.from(this.methodStorage.values())
      .filter((m) => m.organizationId === organizationId && m.isDefault)
      .forEach((m) => {
        m.isDefault = false;
        this.methodStorage.set(m.id, m);
      });

    // Set new default
    method.isDefault = true;
    method.updatedAt = new Date();
    this.methodStorage.set(methodId, method);

    return method;
  }

  deactivatePaymentMethod(organizationId: string, methodId: string): boolean {
    const method = this.methodStorage.get(methodId);
    if (!method || method.organizationId !== organizationId) {
      return false;
    }

    method.isActive = false;
    method.updatedAt = new Date();
    this.methodStorage.set(methodId, method);

    return true;
  }

  configureGateway(
    organizationId: string,
    gatewayType: PaymentGatewayType,
    apiKey: string,
    supportedCurrencies: string[],
    supportedMethods: string[],
    apiSecret?: string,
    webhookSecret?: string
  ): PaymentGatewayConfig {
    const configId = uuidv4();
    const config: PaymentGatewayConfig = {
      id: configId,
      organizationId,
      gatewayType,
      apiKey,
      apiSecret,
      webhookSecret,
      isActive: true,
      supportedCurrencies,
      supportedMethods,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.gatewayConfigStorage.set(configId, config);
    return config;
  }

  getGatewayConfig(
    organizationId: string,
    gatewayType: PaymentGatewayType
  ): PaymentGatewayConfig | null {
    const configs = Array.from(this.gatewayConfigStorage.values()).filter(
      (c) => c.organizationId === organizationId && c.gatewayType === gatewayType && c.isActive
    );
    return configs.length > 0 ? configs[0] : null;
  }

  updateGatewayConfig(
    organizationId: string,
    configId: string,
    apiKey: string,
    supportedCurrencies: string[]
  ): PaymentGatewayConfig | null {
    const config = this.gatewayConfigStorage.get(configId);
    if (!config || config.organizationId !== organizationId) {
      return null;
    }

    config.apiKey = apiKey;
    config.supportedCurrencies = supportedCurrencies;
    config.updatedAt = new Date();
    this.gatewayConfigStorage.set(configId, config);

    return config;
  }

  createReconciliation(
    organizationId: string,
    statementDate: Date,
    gatewayType: PaymentGatewayType
  ): PaymentReconciliation {
    const reconciliationId = uuidv4();
    const reconciliation: PaymentReconciliation = {
      id: reconciliationId,
      organizationId,
      statementDate,
      gatewayType,
      totalTransactions: 0,
      totalAmount: 0,
      reconciled: 0,
      discrepancies: 0,
      status: 'PENDING',
      createdAt: new Date(),
    };

    this.reconciliationStorage.set(reconciliationId, reconciliation);
    return reconciliation;
  }

  getReconciliationById(organizationId: string, reconciliationId: string): PaymentReconciliation | null {
    const reconciliation = this.reconciliationStorage.get(reconciliationId);
    if (!reconciliation || reconciliation.organizationId !== organizationId) {
      return null;
    }
    return reconciliation;
  }

  completeReconciliation(
    organizationId: string,
    reconciliationId: string,
    reconciled: number,
    discrepancies: number
  ): PaymentReconciliation | null {
    const reconciliation = this.reconciliationStorage.get(reconciliationId);
    if (!reconciliation || reconciliation.organizationId !== organizationId) {
      return null;
    }

    reconciliation.status = 'COMPLETED';
    reconciliation.reconciled = reconciled;
    reconciliation.discrepancies = discrepancies;
    reconciliation.completedAt = new Date();
    this.reconciliationStorage.set(reconciliationId, reconciliation);

    return reconciliation;
  }

  subscribeToWebhook(
    organizationId: string,
    eventType: WebhookEventType,
    targetUrl: string,
    maxRetries: number = 5
  ): WebhookSubscription {
    const subscriptionId = uuidv4();
    const subscription: WebhookSubscription = {
      id: subscriptionId,
      organizationId,
      eventType,
      targetUrl,
      isActive: true,
      retryCount: 0,
      maxRetries,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.webhookSubscriptionStorage.set(subscriptionId, subscription);
    return subscription;
  }

  getWebhookSubscriptions(
    organizationId: string,
    limit: number = 20,
    offset: number = 0
  ): WebhookSubscription[] {
    return Array.from(this.webhookSubscriptionStorage.values())
      .filter((s) => s.organizationId === organizationId && s.isActive)
      .slice(offset, offset + limit);
  }

  createWebhookEvent(
    organizationId: string,
    subscriptionId: string,
    eventType: WebhookEventType,
    payload: Record<string, any>
  ): WebhookEvent {
    const eventId = uuidv4();
    const event: WebhookEvent = {
      id: eventId,
      organizationId,
      subscriptionId,
      eventType,
      payload,
      status: 'PENDING',
      retryCount: 0,
      createdAt: new Date(),
    };

    this.webhookEventStorage.set(eventId, event);
    return event;
  }

  getWebhookEvents(
    organizationId: string,
    limit: number = 50,
    offset: number = 0
  ): WebhookEvent[] {
    return Array.from(this.webhookEventStorage.values())
      .filter((e) => e.organizationId === organizationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  updateWebhookEventStatus(
    organizationId: string,
    eventId: string,
    status: 'PENDING' | 'SENT' | 'FAILED' | 'DELIVERED',
    retryCount?: number
  ): WebhookEvent | null {
    const event = this.webhookEventStorage.get(eventId);
    if (!event || event.organizationId !== organizationId) {
      return null;
    }

    event.status = status;
    if (retryCount !== undefined) {
      event.retryCount = retryCount;
    }

    if (status === 'DELIVERED') {
      event.sentAt = new Date();
    } else if (status === 'FAILED') {
      event.nextRetryAt = new Date(Date.now() + 3600000);
    }

    this.webhookEventStorage.set(eventId, event);
    return event;
  }

  logWebhookAttempt(
    organizationId: string,
    eventId: string,
    subscriptionId: string,
    targetUrl: string,
    statusCode: number,
    responseBody: string
  ): WebhookLog {
    const logId = uuidv4();
    const log: WebhookLog = {
      id: logId,
      organizationId,
      eventId,
      subscriptionId,
      targetUrl,
      method: 'POST',
      statusCode,
      responseBody,
      sentAt: new Date(),
    };

    this.webhookLogStorage.set(logId, log);
    return log;
  }

  getWebhookLogs(
    organizationId: string,
    eventId: string,
    limit: number = 50,
    offset: number = 0
  ): WebhookLog[] {
    return Array.from(this.webhookLogStorage.values())
      .filter((l) => l.organizationId === organizationId && l.eventId === eventId)
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
      .slice(offset, offset + limit);
  }

  getPaymentStats(organizationId: string): {
    totalPayments: number;
    totalAmount: number;
    successfulPayments: number;
    failedPayments: number;
    averagePaymentAmount: number;
  } {
    const payments = Array.from(this.paymentStorage.values()).filter(
      (p) => p.organizationId === organizationId
    );

    const successfulPayments = payments.filter(
      (p) => p.status === PaymentStatus.CAPTURED || p.status === PaymentStatus.AUTHORIZED
    ).length;
    const failedPayments = payments.filter((p) => p.status === PaymentStatus.FAILED).length;
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const averageAmount = payments.length > 0 ? totalAmount / payments.length : 0;

    return {
      totalPayments: payments.length,
      totalAmount,
      successfulPayments,
      failedPayments,
      averagePaymentAmount: Math.round(averageAmount * 100) / 100,
    };
  }

  getReconciliationReport(
    organizationId: string,
    limit: number = 20,
    offset: number = 0
  ): PaymentReconciliation[] {
    return Array.from(this.reconciliationStorage.values())
      .filter((r) => r.organizationId === organizationId)
      .sort((a, b) => b.statementDate.getTime() - a.statementDate.getTime())
      .slice(offset, offset + limit);
  }
}
