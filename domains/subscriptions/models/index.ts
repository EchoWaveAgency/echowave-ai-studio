// Subscriptions Domain Models

// Subscription Plans
export interface SubscriptionPlan {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  type: 'monthly' | 'quarterly' | 'annual' | 'custom';
  currency: 'USD' | 'EGP';
  basePrice: number;
  discountPercentage?: number;
  features: string[]; // feature IDs
  maxUsers?: number;
  maxProjects?: number;
  maxStorage?: number; // in GB
  status: 'draft' | 'active' | 'archived';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlanCreateInput {
  name: string;
  description?: string;
  type: 'monthly' | 'quarterly' | 'annual' | 'custom';
  currency: 'USD' | 'EGP';
  basePrice: number;
  discountPercentage?: number;
  features?: string[];
  maxUsers?: number;
  maxProjects?: number;
  maxStorage?: number;
}

// Customer Subscriptions
export interface CustomerSubscription {
  id: string;
  organizationId: string;
  customerId: string;
  planId: string;
  status: 'active' | 'paused' | 'canceled' | 'past_due' | 'expired';
  billingCycle: 'monthly' | 'quarterly' | 'annual' | 'custom';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingDate?: string;
  autoRenew: boolean;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  paymentMethod?: string;
  canceledAt?: string;
  cancelReason?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerSubscriptionCreateInput {
  customerId: string;
  planId: string;
  billingCycle: 'monthly' | 'quarterly' | 'annual' | 'custom';
  autoRenew?: boolean;
  quantity?: number;
  paymentMethod?: string;
  metadata?: Record<string, any>;
}

// Invoices
export interface Invoice {
  id: string;
  organizationId: string;
  customerId: string;
  subscriptionId?: string;
  invoiceNumber: string;
  status: 'draft' | 'issued' | 'paid' | 'partially_paid' | 'overdue' | 'canceled';
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  currency: 'USD' | 'EGP';
  subtotal: number;
  taxAmount: number;
  taxPercentage: number;
  totalAmount: number;
  paidAmount: number;
  items: InvoiceItem[];
  notes?: string;
  paymentTerms?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  taxable: boolean;
}

export interface InvoiceCreateInput {
  customerId: string;
  subscriptionId?: string;
  issueDate?: string;
  dueDate?: string;
  items: InvoiceItemInput[];
  notes?: string;
  paymentTerms?: string;
  metadata?: Record<string, any>;
}

export interface InvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  taxable?: boolean;
}

// Payments
export interface Payment {
  id: string;
  organizationId: string;
  customerId: string;
  invoiceId: string;
  amount: number;
  currency: 'USD' | 'EGP';
  paymentMethod: 'credit_card' | 'bank_transfer' | 'check' | 'stripe' | 'custom';
  transactionId?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paidDate?: string;
  failureReason?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentCreateInput {
  customerId: string;
  invoiceId: string;
  amount: number;
  paymentMethod: 'credit_card' | 'bank_transfer' | 'check' | 'stripe' | 'custom';
  transactionId?: string;
  metadata?: Record<string, any>;
}

// Billing Cycles
export interface BillingCycle {
  id: string;
  organizationId: string;
  subscriptionId: string;
  cycleNumber: number;
  startDate: string;
  endDate: string;
  invoiceId?: string;
  status: 'pending' | 'billed' | 'paid' | 'failed' | 'canceled';
  amount: number;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Usage Tracking
export interface UsageRecord {
  id: string;
  organizationId: string;
  subscriptionId: string;
  metricType: string; // 'users', 'projects', 'storage', etc.
  value: number;
  recordedAt: string;
}

// Constants
export const PLAN_TYPES = ['monthly', 'quarterly', 'annual', 'custom'] as const;
export const SUBSCRIPTION_STATUSES = ['active', 'paused', 'canceled', 'past_due', 'expired'] as const;
export const INVOICE_STATUSES = ['draft', 'issued', 'paid', 'partially_paid', 'overdue', 'canceled'] as const;
export const PAYMENT_STATUSES = ['pending', 'completed', 'failed', 'refunded'] as const;
export const PAYMENT_METHODS = ['credit_card', 'bank_transfer', 'check', 'stripe', 'custom'] as const;
export const CURRENCIES = ['USD', 'EGP'] as const;
export const BILLING_CYCLES = ['monthly', 'quarterly', 'annual', 'custom'] as const;
