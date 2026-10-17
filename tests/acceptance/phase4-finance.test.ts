import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { accountingService } from '../../domains/finance/services/AccountingService';
import { paymentService } from '../../domains/finance/services/PaymentService';
import { taxService } from '../../domains/finance/services/TaxService';

const testOrgId = 'org-test-123';
const testUserId = 'user-test-789';

describe('Phase 4: Accounting & Egyptian Tax', () => {
  let accountId: string;
  let journalEntryId: string;
  let paymentSourceId: string;
  let paymentId: string;
  let legalEntityId: string;
  let taxInvoiceId: string;

  describe('Chart of Accounts', () => {
    it('should create a new account', async () => {
      const account = await accountingService.createAccount(testOrgId, {
        accountNumber: '1000',
        name: 'Cash',
        type: 'asset',
      });

      expect(account.id).toBeDefined();
      expect(account.accountNumber).toBe('1000');
      expect(account.type).toBe('asset');
      expect(account.status).toBe('active');
      accountId = account.id;
    });

    it('should prevent duplicate account numbers within organization', async () => {
      try {
        await accountingService.createAccount(testOrgId, {
          accountNumber: '1000',
          name: 'Another Cash Account',
          type: 'asset',
        });
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('already exists');
      }
    });

    it('should validate account type', async () => {
      try {
        await accountingService.createAccount(testOrgId, {
          accountNumber: '1001',
          name: 'Bank Account',
          type: 'invalid-type' as any,
        });
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('Invalid');
      }
    });

    it('should retrieve account by ID', async () => {
      const account = await accountingService.getAccountById(accountId, testOrgId);
      expect(account.id).toBe(accountId);
      expect(account.accountNumber).toBe('1000');
    });

    it('should retrieve chart of accounts', async () => {
      await accountingService.createAccount(testOrgId, {
        accountNumber: '4000',
        name: 'Service Revenue',
        type: 'revenue',
      });

      const accounts = await accountingService.getChartOfAccounts(testOrgId);
      expect(accounts.length).toBeGreaterThanOrEqual(2);
      expect(accounts.every(a => a.status === 'active')).toBe(true);
    });

    it('should filter accounts by type', async () => {
      const assets = await accountingService.getAccountsByType(testOrgId, 'asset');
      expect(assets.length).toBeGreaterThan(0);
      expect(assets.every(a => a.type === 'asset')).toBe(true);
    });
  });

  describe('Journal Entries & Double-Entry Bookkeeping', () => {
    it('should create a balanced journal entry', async () => {
      const entry = await accountingService.createJournalEntry(
        testOrgId,
        {
          entryDate: '2026-10-17',
          description: 'Deposit cash into bank',
          lines: [
            {
              accountId: accountId,
              debitAmount: 1000,
              lineOrder: 1,
            },
            {
              accountId: accountId,
              creditAmount: 1000,
              lineOrder: 2,
            },
          ],
        },
        testUserId
      );

      expect(entry.id).toBeDefined();
      expect(entry.status).toBe('draft');
      expect(entry.lines.length).toBe(2);
      journalEntryId = entry.id;
    });

    it('should require minimum 2 lines', async () => {
      try {
        await accountingService.createJournalEntry(
          testOrgId,
          {
            entryDate: '2026-10-17',
            description: 'Invalid entry',
            lines: [
              {
                accountId: accountId,
                debitAmount: 100,
                lineOrder: 1,
              },
            ],
          },
          testUserId
        );
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('At least 2');
      }
    });

    it('should enforce double-entry principle (debits = credits)', async () => {
      try {
        await accountingService.createJournalEntry(
          testOrgId,
          {
            entryDate: '2026-10-17',
            description: 'Unbalanced entry',
            lines: [
              {
                accountId: accountId,
                debitAmount: 1000,
                lineOrder: 1,
              },
              {
                accountId: accountId,
                creditAmount: 900,
                lineOrder: 2,
              },
            ],
          },
          testUserId
        );
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('balance');
      }
    });

    it('should prevent line with both debit and credit', async () => {
      try {
        await accountingService.createJournalEntry(
          testOrgId,
          {
            entryDate: '2026-10-17',
            description: 'Invalid line',
            lines: [
              {
                accountId: accountId,
                debitAmount: 500,
                creditAmount: 500,
                lineOrder: 1,
              },
              {
                accountId: accountId,
                creditAmount: 500,
                lineOrder: 2,
              },
            ],
          },
          testUserId
        );
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('cannot have both');
      }
    });

    it('should retrieve journal entry with all lines', async () => {
      const entry = await accountingService.getJournalEntryById(journalEntryId, testOrgId);
      expect(entry.id).toBe(journalEntryId);
      expect(entry.lines.length).toBe(2);
      expect(entry.lines[0].lineOrder).toBe(1);
    });

    it('should post journal entry from draft to posted', async () => {
      const posted = await accountingService.postJournalEntry(journalEntryId, testOrgId, testUserId);
      expect(posted.status).toBe('posted');
      expect(posted.postedBy).toBe(testUserId);
      expect(posted.postedAt).toBeDefined();
    });

    it('should prevent posting already posted entry', async () => {
      try {
        await accountingService.postJournalEntry(journalEntryId, testOrgId, testUserId);
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('already posted');
      }
    });

    it('should retrieve entries by date range', async () => {
      const result = await accountingService.getJournalEntriesByDate(
        testOrgId,
        '2026-10-01',
        '2026-10-31',
        50,
        0
      );
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Trial Balance & Financial Reporting', () => {
    it('should calculate trial balance with posted entries', async () => {
      const trialBalance = await accountingService.calculateTrialBalance(testOrgId);
      expect(trialBalance.entries).toBeDefined();
      expect(trialBalance.totalDebits).toBeDefined();
      expect(trialBalance.totalCredits).toBeDefined();
      expect(Math.abs(trialBalance.totalDebits - trialBalance.totalCredits)).toBeLessThan(0.01);
    });

    it('should show zero balance for draft entries in trial balance', async () => {
      const draftEntry = await accountingService.createJournalEntry(
        testOrgId,
        {
          entryDate: '2026-10-17',
          description: 'Draft entry',
          lines: [
            {
              accountId: accountId,
              debitAmount: 5000,
              lineOrder: 1,
            },
            {
              accountId: accountId,
              creditAmount: 5000,
              lineOrder: 2,
            },
          ],
        },
        testUserId
      );

      const trialBalance1 = await accountingService.calculateTrialBalance(testOrgId);
      const beforePosting = trialBalance1.totalDebits;

      await accountingService.postJournalEntry(draftEntry.id, testOrgId, testUserId);
      const trialBalance2 = await accountingService.calculateTrialBalance(testOrgId);
      const afterPosting = trialBalance2.totalDebits;

      expect(afterPosting).toBeGreaterThan(beforePosting);
    });
  });

  describe('Payment Sources & Tracking', () => {
    it('should create a payment source', async () => {
      const source = await paymentService.createPaymentSource(testOrgId, {
        name: 'Main Bank Account',
        type: 'bank',
        accountNumber: '1234567890',
        initialBalance: 50000,
        currency: 'EGP',
      });

      expect(source.id).toBeDefined();
      expect(source.type).toBe('bank');
      expect(source.balance).toBe(50000);
      expect(source.status).toBe('active');
      paymentSourceId = source.id;
    });

    it('should validate payment source type', async () => {
      try {
        await paymentService.createPaymentSource(testOrgId, {
          name: 'Invalid Source',
          type: 'invalid' as any,
          currency: 'EGP',
        });
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('Invalid');
      }
    });

    it('should retrieve payment source by ID', async () => {
      const source = await paymentService.getPaymentSourceById(paymentSourceId, testOrgId);
      expect(source.id).toBe(paymentSourceId);
      expect(source.name).toBe('Main Bank Account');
    });

    it('should list organization payment sources', async () => {
      const sources = await paymentService.getOrganizationPaymentSources(testOrgId);
      expect(sources.length).toBeGreaterThan(0);
      expect(sources.every(s => s.status === 'active')).toBe(true);
    });
  });

  describe('Payment Lifecycle', () => {
    it('should create a payment in reported status', async () => {
      const payment = await paymentService.createPayment(
        testOrgId,
        {
          amount: 10000,
          currency: 'EGP',
          paymentMethod: 'bank_transfer',
          paymentSourceId,
          referenceNumber: 'TXN-001-2026-10-17',
        },
        testUserId
      );

      expect(payment.id).toBeDefined();
      expect(payment.status).toBe('reported');
      expect(payment.amount).toBe(10000);
      expect(payment.reportedBy).toBe(testUserId);
      paymentId = payment.id;
    });

    it('should verify payment', async () => {
      const verified = await paymentService.verifyPayment(paymentId, testOrgId, testUserId);
      expect(verified.status).toBe('verification_pending');
      expect(verified.verifiedBy).toBe(testUserId);
    });

    it('should reconcile payment', async () => {
      const reconciled = await paymentService.reconcilePayment(
        paymentId,
        testOrgId,
        'Matched against bank statement',
        testUserId
      );
      expect(reconciled.status).toBe('reconciled');
      expect(reconciled.reconciliationNotes).toContain('Matched');
    });

    it('should retrieve payment by ID', async () => {
      const payment = await paymentService.getPaymentById(paymentId, testOrgId);
      expect(payment.id).toBe(paymentId);
      expect(payment.status).toBe('reconciled');
    });

    it('should filter payments by status', async () => {
      const result = await paymentService.getOrganizationPayments(
        testOrgId,
        { status: 'reconciled' }
      );
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items.every(p => p.status === 'reconciled')).toBe(true);
    });

    it('should filter payments by method', async () => {
      const result = await paymentService.getOrganizationPayments(
        testOrgId,
        { paymentMethod: 'bank_transfer' }
      );
      expect(result.items.length).toBeGreaterThan(0);
    });
  });

  describe('Legal Entities & Egyptian Tax', () => {
    it('should create a legal entity', async () => {
      const entity = await taxService.createLegalEntity(testOrgId, {
        name: 'ECHOWAVE Agency LLC',
        countryCode: 'EG',
      });

      expect(entity.id).toBeDefined();
      expect(entity.name).toBe('ECHOWAVE Agency LLC');
      expect(entity.countryCode).toBe('EG');
      expect(entity.status).toBe('pending');
      legalEntityId = entity.id;
    });

    it('should update legal entity with registration details', async () => {
      const updated = await taxService.updateLegalEntity(legalEntityId, testOrgId, {
        registrationNumber: 'REG-2024-001',
        taxNumber: 'TAX-EG-12345',
        status: 'active',
        registrationDate: '2024-01-15',
      });

      expect(updated.status).toBe('active');
      expect(updated.taxNumber).toBe('TAX-EG-12345');
      expect(updated.registrationNumber).toBe('REG-2024-001');
    });

    it('should retrieve legal entity by ID', async () => {
      const entity = await taxService.getLegalEntityById(legalEntityId, testOrgId);
      expect(entity.id).toBe(legalEntityId);
      expect(entity.status).toBe('active');
    });

    it('should list organization legal entities', async () => {
      const entities = await taxService.getOrganizationLegalEntities(testOrgId);
      expect(entities.length).toBeGreaterThan(0);
    });

    it('should filter active legal entities only', async () => {
      const active = await taxService.getOrganizationLegalEntities(testOrgId, true);
      expect(active.every(e => e.status === 'active')).toBe(true);
    });
  });

  describe('Tax Invoices & Egyptian Compliance', () => {
    it('should create a tax invoice', async () => {
      const invoice = await taxService.issueTaxInvoice(
        testOrgId,
        legalEntityId,
        {
          issueDate: '2026-10-17',
          dueDate: '2026-11-17',
        },
        testUserId
      );

      expect(invoice.id).toBeDefined();
      expect(invoice.status).toBe('draft');
      expect(invoice.invoiceNumber).toMatch(/^2026-10-/);
      expect(invoice.taxNumber).toBeDefined();
      taxInvoiceId = invoice.id;
    });

    it('should prevent creating invoice for inactive entity', async () => {
      const inactiveEntity = await taxService.createLegalEntity(testOrgId, {
        name: 'Inactive Entity',
        countryCode: 'EG',
      });

      try {
        await taxService.issueTaxInvoice(
          testOrgId,
          inactiveEntity.id,
          {
            issueDate: '2026-10-17',
            dueDate: '2026-11-17',
          },
          testUserId
        );
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('not active');
      }
    });

    it('should update invoice amounts before issuing', async () => {
      const updated = await taxService.updateTaxInvoiceAmounts(
        taxInvoiceId,
        testOrgId,
        10000,
        1500
      );

      expect(updated.totalBeforeTax).toBe(10000);
      expect(updated.taxAmount).toBe(1500);
      expect(updated.totalAfterTax).toBe(11500);
    });

    it('should prevent issuing invoice with zero total', async () => {
      const emptyInvoice = await taxService.issueTaxInvoice(
        testOrgId,
        legalEntityId,
        {
          issueDate: '2026-10-18',
          dueDate: '2026-11-18',
        },
        testUserId
      );

      try {
        await taxService.issueTaxInvoice_Finalize(emptyInvoice.id, testOrgId);
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('greater than zero');
      }
    });

    it('should issue (finalize) tax invoice', async () => {
      const issued = await taxService.issueTaxInvoice_Finalize(taxInvoiceId, testOrgId);
      expect(issued.status).toBe('issued');
      expect(issued.sentAt).toBeDefined();
    });

    it('should prevent re-issuing already issued invoice', async () => {
      try {
        await taxService.issueTaxInvoice_Finalize(taxInvoiceId, testOrgId);
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('draft');
      }
    });

    it('should record payment on issued invoice', async () => {
      const paid = await taxService.recordTaxInvoicePayment(taxInvoiceId, testOrgId);
      expect(paid.status).toBe('paid');
      expect(paid.paidAt).toBeDefined();
    });

    it('should retrieve tax invoice by ID', async () => {
      const invoice = await taxService.getTaxInvoiceById(taxInvoiceId, testOrgId);
      expect(invoice.id).toBe(taxInvoiceId);
      expect(invoice.status).toBe('paid');
    });

    it('should list tax invoices for legal entity', async () => {
      const result = await taxService.getTaxInvoicesByEntity(legalEntityId, testOrgId);
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items.every(inv => inv.legalEntityId === legalEntityId)).toBe(true);
    });
  });

  describe('Organization Isolation', () => {
    it('should enforce org isolation on account retrieval', async () => {
      try {
        await accountingService.getAccountById(accountId, 'wrong-org-id');
        expect.fail('Should have thrown not found error');
      } catch (error: any) {
        expect(error.message).toContain('not found');
      }
    });

    it('should enforce org isolation on journal entries', async () => {
      try {
        await accountingService.getJournalEntryById(journalEntryId, 'wrong-org-id');
        expect.fail('Should have thrown not found error');
      } catch (error: any) {
        expect(error.message).toContain('not found');
      }
    });

    it('should enforce org isolation on payments', async () => {
      try {
        await paymentService.getPaymentById(paymentId, 'wrong-org-id');
        expect.fail('Should have thrown not found error');
      } catch (error: any) {
        expect(error.message).toContain('not found');
      }
    });

    it('should enforce org isolation on tax invoices', async () => {
      try {
        await taxService.getTaxInvoiceById(taxInvoiceId, 'wrong-org-id');
        expect.fail('Should have thrown not found error');
      } catch (error: any) {
        expect(error.message).toContain('not found');
      }
    });
  });
});
