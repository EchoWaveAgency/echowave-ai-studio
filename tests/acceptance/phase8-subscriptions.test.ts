import { describe, it, expect, beforeAll } from 'vitest';
import { subscriptionPlanService } from '../../domains/subscriptions/services/SubscriptionPlanService';
import { customerSubscriptionService } from '../../domains/subscriptions/services/CustomerSubscriptionService';
import { invoiceService } from '../../domains/subscriptions/services/InvoiceService';
import { paymentService } from '../../domains/subscriptions/services/PaymentService';
import { ValidationError, NotFoundError } from '../../platform/errors/errors';

const testOrgId = 'test-org-phase8-' + Date.now();
const testCustomerId = 'customer-' + Date.now();
const testUserId = 'user-' + Date.now();

describe('Phase 8: Subscriptions & Billing', () => {
  describe('Subscription Plan Service', () => {
    it('should create a subscription plan', async () => {
      const plan = await subscriptionPlanService.createPlan(testOrgId, {
        name: 'Basic Plan',
        description: 'Basic monthly plan',
        type: 'monthly',
        currency: 'EGP',
        basePrice: 99,
        features: ['feature1', 'feature2'],
        maxUsers: 5,
      });

      expect(plan).toBeDefined();
      expect(plan.name).toBe('Basic Plan');
      expect(plan.type).toBe('monthly');
      expect(plan.status).toBe('draft');
      expect(plan.base_price).toBe(99);
    });

    it('should reject plan without name', async () => {
      try {
        await subscriptionPlanService.createPlan(testOrgId, {
          name: '',
          type: 'monthly',
          currency: 'EGP',
          basePrice: 99,
        });
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
      }
    });

    it('should validate discount percentage range', async () => {
      try {
        await subscriptionPlanService.createPlan(testOrgId, {
          name: 'Invalid Discount Plan',
          type: 'monthly',
          currency: 'EGP',
          basePrice: 99,
          discountPercentage: 150,
        });
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
      }
    });

    it('should get plan by ID', async () => {
      const plan = await subscriptionPlanService.createPlan(testOrgId, {
        name: 'Premium Plan',
        type: 'monthly',
        currency: 'EGP',
        basePrice: 199,
      });

      const retrieved = await subscriptionPlanService.getPlanById(plan.id, testOrgId);
      expect(retrieved.id).toBe(plan.id);
      expect(retrieved.name).toBe('Premium Plan');
    });

    it('should not allow plan access across organizations', async () => {
      const plan = await subscriptionPlanService.createPlan(testOrgId, {
        name: 'Org Specific Plan',
        type: 'monthly',
        currency: 'EGP',
        basePrice: 99,
      });

      try {
        await subscriptionPlanService.getPlanById(plan.id, 'different-org');
        expect.fail('Should have thrown NotFoundError');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
      }
    });

    it('should activate plan', async () => {
      const plan = await subscriptionPlanService.createPlan(testOrgId, {
        name: 'Activation Test Plan',
        type: 'monthly',
        currency: 'EGP',
        basePrice: 99,
      });

      const activated = await subscriptionPlanService.activatePlan(plan.id, testOrgId);
      expect(activated.status).toBe('active');
    });

    it('should list organization plans', async () => {
      for (let i = 0; i < 3; i++) {
        await subscriptionPlanService.createPlan(testOrgId, {
          name: `Plan ${i}`,
          type: 'monthly',
          currency: 'EGP',
          basePrice: 99 + i * 50,
        });
      }

      const result = await subscriptionPlanService.getOrganizationPlans(testOrgId, 50, 0);
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
    });

    it('should get only active plans', async () => {
      const plan = await subscriptionPlanService.createPlan(testOrgId, {
        name: 'Active Plans Test',
        type: 'monthly',
        currency: 'EGP',
        basePrice: 99,
      });

      await subscriptionPlanService.activatePlan(plan.id, testOrgId);
      const activePlans = await subscriptionPlanService.getActivePlans(testOrgId);

      expect(activePlans.some((p) => p.id === plan.id)).toBe(true);
      expect(activePlans.every((p) => p.status === 'active')).toBe(true);
    });
  });

  describe('Customer Subscription Service', () => {
    let testPlanId: string;

    beforeAll(async () => {
      const plan = await subscriptionPlanService.createPlan(testOrgId, {
        name: 'Subscription Test Plan',
        type: 'monthly',
        currency: 'EGP',
        basePrice: 99,
        discountPercentage: 10,
      });
      testPlanId = plan.id;
      await subscriptionPlanService.activatePlan(plan.id, testOrgId);
    });

    it('should create customer subscription', async () => {
      const subscription = await customerSubscriptionService.createSubscription(testOrgId, {
        customerId: testCustomerId,
        planId: testPlanId,
        billingCycle: 'monthly',
        autoRenew: true,
      });

      expect(subscription).toBeDefined();
      expect(subscription.customer_id).toBe(testCustomerId);
      expect(subscription.status).toBe('active');
      expect(subscription.auto_renew).toBe(true);
    });

    it('should reject subscription without customer', async () => {
      try {
        await customerSubscriptionService.createSubscription(testOrgId, {
          customerId: '',
          planId: testPlanId,
          billingCycle: 'monthly',
        });
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
      }
    });

    it('should get subscription by ID', async () => {
      const subscription = await customerSubscriptionService.createSubscription(testOrgId, {
        customerId: 'customer-2-' + Date.now(),
        planId: testPlanId,
        billingCycle: 'monthly',
      });

      const retrieved = await customerSubscriptionService.getSubscriptionById(subscription.id, testOrgId);
      expect(retrieved.id).toBe(subscription.id);
    });

    it('should pause subscription', async () => {
      const subscription = await customerSubscriptionService.createSubscription(testOrgId, {
        customerId: 'customer-3-' + Date.now(),
        planId: testPlanId,
        billingCycle: 'monthly',
      });

      const paused = await customerSubscriptionService.pauseSubscription(subscription.id, testOrgId);
      expect(paused.status).toBe('paused');
    });

    it('should resume subscription', async () => {
      const subscription = await customerSubscriptionService.createSubscription(testOrgId, {
        customerId: 'customer-4-' + Date.now(),
        planId: testPlanId,
        billingCycle: 'monthly',
      });

      await customerSubscriptionService.pauseSubscription(subscription.id, testOrgId);
      const resumed = await customerSubscriptionService.resumeSubscription(subscription.id, testOrgId);
      expect(resumed.status).toBe('active');
    });

    it('should cancel subscription with reason', async () => {
      const subscription = await customerSubscriptionService.createSubscription(testOrgId, {
        customerId: 'customer-5-' + Date.now(),
        planId: testPlanId,
        billingCycle: 'monthly',
      });

      const canceled = await customerSubscriptionService.cancelSubscription(subscription.id, testOrgId, 'Customer requested cancellation');
      expect(canceled.status).toBe('canceled');
      expect(canceled.cancel_reason).toBe('Customer requested cancellation');
    });

    it('should support different billing cycles', async () => {
      const cycles = ['monthly', 'quarterly', 'annual'];

      for (const cycle of cycles) {
        const subscription = await customerSubscriptionService.createSubscription(testOrgId, {
          customerId: `customer-cycle-${cycle}-${Date.now()}`,
          planId: testPlanId,
          billingCycle: cycle as any,
        });

        expect(subscription.billing_cycle).toBe(cycle);
      }
    });

    it('should calculate correct period end dates', async () => {
      const subscription = await customerSubscriptionService.createSubscription(testOrgId, {
        customerId: 'customer-period-' + Date.now(),
        planId: testPlanId,
        billingCycle: 'monthly',
      });

      const start = new Date(subscription.current_period_start);
      const end = new Date(subscription.current_period_end);
      const diffInMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

      expect(diffInMonths).toBe(1);
    });

    it('should apply discount to subscription price', async () => {
      const subscription = await customerSubscriptionService.createSubscription(testOrgId, {
        customerId: 'customer-discount-' + Date.now(),
        planId: testPlanId,
        billingCycle: 'monthly',
      });

      // Plan base price is 99 with 10% discount, so unit price should be 89.1
      expect(subscription.unit_price).toBeCloseTo(89.1, 1);
    });

    it('should get customer subscriptions', async () => {
      const customerId = 'customer-list-' + Date.now();

      for (let i = 0; i < 3; i++) {
        await customerSubscriptionService.createSubscription(testOrgId, {
          customerId,
          planId: testPlanId,
          billingCycle: 'monthly',
        });
      }

      const result = await customerSubscriptionService.getCustomerSubscriptions(testOrgId, customerId, 50, 0);
      expect(result.items.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Invoice Service', () => {
    let testSubscriptionId: string;

    beforeAll(async () => {
      const plan = await subscriptionPlanService.createPlan(testOrgId, {
        name: 'Invoice Test Plan',
        type: 'monthly',
        currency: 'EGP',
        basePrice: 100,
      });
      await subscriptionPlanService.activatePlan(plan.id, testOrgId);

      const sub = await customerSubscriptionService.createSubscription(testOrgId, {
        customerId: testCustomerId,
        planId: plan.id,
        billingCycle: 'monthly',
      });
      testSubscriptionId = sub.id;
    });

    it('should create invoice with tax calculation', async () => {
      const invoice = await invoiceService.createInvoice(testOrgId, {
        customerId: testCustomerId,
        subscriptionId: testSubscriptionId,
        items: [
          { description: 'Service', quantity: 1, unitPrice: 100, taxable: true },
          { description: 'Discount', quantity: 1, unitPrice: -10, taxable: false },
        ],
      });

      expect(invoice).toBeDefined();
      expect(invoice.status).toBe('draft');
      expect(invoice.subtotal).toBe(90);
      expect(invoice.tax_percentage).toBe(14); // Egyptian VAT
      expect(invoice.tax_amount).toBeCloseTo(12.6, 1); // 90 * 0.14
      expect(invoice.total_amount).toBeCloseTo(102.6, 1);
    });

    it('should reject invoice without items', async () => {
      try {
        await invoiceService.createInvoice(testOrgId, {
          customerId: testCustomerId,
          items: [],
        });
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
      }
    });

    it('should generate unique invoice number', async () => {
      const invoice1 = await invoiceService.createInvoice(testOrgId, {
        customerId: testCustomerId,
        items: [{ description: 'Item 1', quantity: 1, unitPrice: 50 }],
      });

      const invoice2 = await invoiceService.createInvoice(testOrgId, {
        customerId: 'customer-2-' + Date.now(),
        items: [{ description: 'Item 2', quantity: 1, unitPrice: 50 }],
      });

      expect(invoice1.invoice_number).not.toBe(invoice2.invoice_number);
    });

    it('should issue invoice', async () => {
      const invoice = await invoiceService.createInvoice(testOrgId, {
        customerId: testCustomerId,
        items: [{ description: 'Service', quantity: 1, unitPrice: 100 }],
      });

      const issued = await invoiceService.issueInvoice(invoice.id, testOrgId);
      expect(issued.status).toBe('issued');
    });

    it('should record payment and update invoice status', async () => {
      const invoice = await invoiceService.createInvoice(testOrgId, {
        customerId: testCustomerId,
        items: [{ description: 'Service', quantity: 1, unitPrice: 100 }],
      });

      await invoiceService.issueInvoice(invoice.id, testOrgId);
      const updated = await invoiceService.recordPayment(invoice.id, testOrgId, invoice.total_amount);

      expect(updated.status).toBe('paid');
      expect(updated.paid_amount).toBe(invoice.total_amount);
    });

    it('should mark invoice as partially paid', async () => {
      const invoice = await invoiceService.createInvoice(testOrgId, {
        customerId: testCustomerId,
        items: [{ description: 'Service', quantity: 1, unitPrice: 100 }],
      });

      await invoiceService.issueInvoice(invoice.id, testOrgId);
      const updated = await invoiceService.recordPayment(invoice.id, testOrgId, invoice.total_amount / 2);

      expect(updated.status).toBe('partially_paid');
      expect(updated.paid_amount).toBeCloseTo(invoice.total_amount / 2, 2);
    });

    it('should get customer invoices', async () => {
      for (let i = 0; i < 3; i++) {
        await invoiceService.createInvoice(testOrgId, {
          customerId: testCustomerId,
          items: [{ description: `Invoice ${i}`, quantity: 1, unitPrice: 100 }],
        });
      }

      const result = await invoiceService.getCustomerInvoices(testOrgId, testCustomerId, 50, 0);
      expect(result.items.length).toBeGreaterThanOrEqual(3);
    });

    it('should cancel invoice in draft status', async () => {
      const invoice = await invoiceService.createInvoice(testOrgId, {
        customerId: testCustomerId,
        items: [{ description: 'Service', quantity: 1, unitPrice: 100 }],
      });

      const canceled = await invoiceService.cancelInvoice(invoice.id, testOrgId);
      expect(canceled.status).toBe('canceled');
    });
  });

  describe('Payment Service', () => {
    let testInvoiceId: string;

    beforeAll(async () => {
      const invoice = await invoiceService.createInvoice(testOrgId, {
        customerId: testCustomerId,
        items: [{ description: 'Service', quantity: 1, unitPrice: 100 }],
      });
      testInvoiceId = invoice.id;
      await invoiceService.issueInvoice(invoice.id, testOrgId);
    });

    it('should record payment', async () => {
      const payment = await paymentService.recordPayment(testOrgId, {
        customerId: testCustomerId,
        invoiceId: testInvoiceId,
        amount: 50,
        paymentMethod: 'bank_transfer',
      });

      expect(payment).toBeDefined();
      expect(payment.status).toBe('pending');
      expect(payment.amount).toBe(50);
    });

    it('should reject overpayment', async () => {
      const invoice = await invoiceService.createInvoice(testOrgId, {
        customerId: 'customer-overpay-' + Date.now(),
        items: [{ description: 'Service', quantity: 1, unitPrice: 100 }],
      });

      try {
        await paymentService.recordPayment(testOrgId, {
          customerId: invoice.customer_id,
          invoiceId: invoice.id,
          amount: invoice.total_amount + 100,
          paymentMethod: 'credit_card',
        });
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
      }
    });

    it('should complete payment', async () => {
      const payment = await paymentService.recordPayment(testOrgId, {
        customerId: testCustomerId,
        invoiceId: testInvoiceId,
        amount: 50,
        paymentMethod: 'stripe',
        transactionId: 'txn_12345',
      });

      const completed = await paymentService.completePayment(payment.id, testOrgId);
      expect(completed.status).toBe('completed');
    });

    it('should fail payment with reason', async () => {
      const payment = await paymentService.recordPayment(testOrgId, {
        customerId: testCustomerId,
        invoiceId: testInvoiceId,
        amount: 25,
        paymentMethod: 'credit_card',
      });

      const failed = await paymentService.failPayment(payment.id, testOrgId, 'Insufficient funds');
      expect(failed.status).toBe('failed');
      expect(failed.failure_reason).toBe('Insufficient funds');
    });

    it('should refund completed payment', async () => {
      const invoice = await invoiceService.createInvoice(testOrgId, {
        customerId: 'customer-refund-' + Date.now(),
        items: [{ description: 'Service', quantity: 1, unitPrice: 100 }],
      });

      await invoiceService.issueInvoice(invoice.id, testOrgId);

      const payment = await paymentService.recordPayment(testOrgId, {
        customerId: invoice.customer_id,
        invoiceId: invoice.id,
        amount: 100,
        paymentMethod: 'credit_card',
      });

      await paymentService.completePayment(payment.id, testOrgId);
      const refunded = await paymentService.refundPayment(payment.id, testOrgId);

      expect(refunded.status).toBe('refunded');
    });

    it('should get payment summary', async () => {
      const summary = await paymentService.getPaymentSummary(testOrgId);

      expect(summary).toBeDefined();
      expect(summary.total_payments).toBeGreaterThanOrEqual(0);
      expect(summary.total_collected).toBeDefined();
    });
  });

  describe('Organization Isolation', () => {
    it('should not allow plan access across organizations', async () => {
      const otherOrgId = 'other-org-' + Date.now();
      const plan = await subscriptionPlanService.createPlan(testOrgId, {
        name: 'Isolation Test Plan',
        type: 'monthly',
        currency: 'EGP',
        basePrice: 99,
      });

      try {
        await subscriptionPlanService.getPlanById(plan.id, otherOrgId);
        expect.fail('Should have thrown NotFoundError');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
      }
    });

    it('should not allow subscription access across organizations', async () => {
      const otherOrgId = 'other-org-' + Date.now();
      const plan = await subscriptionPlanService.createPlan(testOrgId, {
        name: 'Subscription Isolation Plan',
        type: 'monthly',
        currency: 'EGP',
        basePrice: 99,
      });
      await subscriptionPlanService.activatePlan(plan.id, testOrgId);

      const subscription = await customerSubscriptionService.createSubscription(testOrgId, {
        customerId: 'customer-isolation-' + Date.now(),
        planId: plan.id,
        billingCycle: 'monthly',
      });

      try {
        await customerSubscriptionService.getSubscriptionById(subscription.id, otherOrgId);
        expect.fail('Should have thrown NotFoundError');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
      }
    });
  });

  describe('Egyptian Tax Compliance', () => {
    it('should apply 14% VAT to taxable items', async () => {
      const invoice = await invoiceService.createInvoice(testOrgId, {
        customerId: testCustomerId,
        items: [{ description: 'Taxable Item', quantity: 1, unitPrice: 100, taxable: true }],
      });

      expect(invoice.tax_percentage).toBe(14);
      expect(invoice.tax_amount).toBeCloseTo(14, 1);
    });

    it('should not apply VAT to non-taxable items', async () => {
      const invoice = await invoiceService.createInvoice(testOrgId, {
        customerId: testCustomerId,
        items: [{ description: 'Non-taxable Item', quantity: 1, unitPrice: 100, taxable: false }],
      });

      expect(invoice.tax_amount).toBe(0);
      expect(invoice.total_amount).toBe(100);
    });

    it('should handle mixed taxable and non-taxable items', async () => {
      const invoice = await invoiceService.createInvoice(testOrgId, {
        customerId: testCustomerId,
        items: [
          { description: 'Taxable', quantity: 1, unitPrice: 100, taxable: true },
          { description: 'Non-taxable', quantity: 1, unitPrice: 50, taxable: false },
        ],
      });

      expect(invoice.subtotal).toBe(150);
      expect(invoice.tax_amount).toBeCloseTo(14, 1); // Only 100 is taxed
      expect(invoice.total_amount).toBeCloseTo(164, 1);
    });
  });
});
