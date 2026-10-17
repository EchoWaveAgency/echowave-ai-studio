// Finance & Accounting Domain Models

// Journal Entry
export interface JournalEntry {
  id: string;
  organizationId: string;
  legalEntityId?: string;
  entryDate: string;
  description: string;
  reference?: string;
  status: 'draft' | 'posted';
  lines: JournalEntryLine[];
  postedBy?: string;
  postedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntryLine {
  id: string;
  journalEntryId: string;
  accountId: string;
  debitAmount?: number;
  creditAmount?: number;
  description?: string;
  lineOrder: number;
}

export interface JournalEntryCreateInput {
  legalEntityId?: string;
  entryDate: string;
  description: string;
  reference?: string;
  lines: JournalEntryLineInput[];
}

export interface JournalEntryLineInput {
  accountId: string;
  debitAmount?: number;
  creditAmount?: number;
  description?: string;
  lineOrder: number;
}

// Account (Chart of Accounts)
export interface Account {
  id: string;
  organizationId: string;
  accountNumber: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface AccountCreateInput {
  accountNumber: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
}

// Payment
export interface Payment {
  id: string;
  organizationId: string;
  documentId?: string;
  amount: number;
  currency: string;
  paymentMethod: 'bank_transfer' | 'instapay' | 'wallet' | 'cash' | 'card';
  paymentSourceId: string;
  status: 'reported' | 'verification_pending' | 'reconciled' | 'disputed' | 'reversed';
  referenceNumber: string;
  reportedBy: string;
  reportedAt: string;
  verifiedBy?: string;
  verifiedAt?: string;
  reconciliationNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentCreateInput {
  documentId?: string;
  amount: number;
  currency: string;
  paymentMethod: 'bank_transfer' | 'instapay' | 'wallet' | 'cash' | 'card';
  paymentSourceId: string;
  referenceNumber: string;
  reconciliationNotes?: string;
}

// Payment Source
export interface PaymentSource {
  id: string;
  organizationId: string;
  name: string;
  type: 'bank' | 'cash' | 'digital_wallet';
  accountNumber?: string;
  balance: number;
  currency: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface PaymentSourceCreateInput {
  name: string;
  type: 'bank' | 'cash' | 'digital_wallet';
  accountNumber?: string;
  initialBalance?: number;
  currency: string;
}

// Tax Invoice
export interface TaxInvoice {
  id: string;
  organizationId: string;
  legalEntityId: string;
  documentId: string;
  invoiceNumber: string;
  taxNumber: string;
  clientTaxNumber?: string;
  issueDate: string;
  dueDate: string;
  totalBeforeTax: number;
  taxAmount: number;
  totalAfterTax: number;
  currency: string;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  sentAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaxInvoiceCreateInput {
  documentId: string;
  clientTaxNumber?: string;
  issueDate: string;
  dueDate: string;
}

// Legal Entity (for tax purposes)
export interface LegalEntity {
  id: string;
  organizationId: string;
  name: string;
  registrationNumber?: string;
  taxNumber?: string;
  status: 'pending' | 'active' | 'inactive';
  registrationDate?: string;
  countryCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface LegalEntityCreateInput {
  name: string;
  countryCode: string;
}

// Constants
export const JOURNAL_ENTRY_STATUSES = ['draft', 'posted'] as const;
export const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'revenue', 'expense'] as const;
export const ACCOUNT_STATUSES = ['active', 'inactive'] as const;
export const PAYMENT_STATUSES = ['reported', 'verification_pending', 'reconciled', 'disputed', 'reversed'] as const;
export const PAYMENT_METHODS = ['bank_transfer', 'instapay', 'wallet', 'cash', 'card'] as const;
export const PAYMENT_SOURCE_TYPES = ['bank', 'cash', 'digital_wallet'] as const;
export const LEGAL_ENTITY_STATUSES = ['pending', 'active', 'inactive'] as const;
export const TAX_INVOICE_STATUSES = ['draft', 'issued', 'paid', 'cancelled'] as const;

// Default Chart of Accounts
export const DEFAULT_ACCOUNTS = [
  // Assets
  { accountNumber: '1000', name: 'Cash', type: 'asset' as const },
  { accountNumber: '1010', name: 'Bank Account', type: 'asset' as const },
  { accountNumber: '1200', name: 'Accounts Receivable', type: 'asset' as const },
  { accountNumber: '1500', name: 'Equipment', type: 'asset' as const },

  // Liabilities
  { accountNumber: '2000', name: 'Accounts Payable', type: 'liability' as const },
  { accountNumber: '2100', name: 'Sales Tax Payable', type: 'liability' as const },
  { accountNumber: '2200', name: 'Income Tax Payable', type: 'liability' as const },

  // Equity
  { accountNumber: '3000', name: 'Capital', type: 'equity' as const },
  { accountNumber: '3100', name: 'Retained Earnings', type: 'equity' as const },

  // Revenue
  { accountNumber: '4000', name: 'Service Revenue', type: 'revenue' as const },
  { accountNumber: '4100', name: 'Product Revenue', type: 'revenue' as const },

  // Expenses
  { accountNumber: '5000', name: 'Salaries Expense', type: 'expense' as const },
  { accountNumber: '5100', name: 'Rent Expense', type: 'expense' as const },
  { accountNumber: '5200', name: 'Utilities Expense', type: 'expense' as const },
  { accountNumber: '5300', name: 'Office Supplies', type: 'expense' as const },
];
