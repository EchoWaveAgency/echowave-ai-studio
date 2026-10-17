// CRM Domain Models
// Leads, Contacts, Opportunities

export interface Lead {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  serviceInterest?: string;
  status: 'new' | 'contacted' | 'qualified' | 'rejected';
  source: 'website' | 'referral' | 'email' | 'phone' | 'other';
  score?: number;
  notes?: string;
  contactId?: string;
  opportunityId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastContactedAt?: Date;
}

export interface Contact {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  notes?: string;
  consentMarketing: boolean;
  consentPhone: boolean;
  consentEmail: boolean;
  communicationHistory?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Opportunity {
  id: string;
  organizationId: string;
  leadId: string;
  title: string;
  description?: string;
  value?: number;
  currency: string;
  stage: 'prospect' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  expectedCloseDate?: Date;
  probability?: number;
  closedDate?: Date;
  closedReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OpportunityHistory {
  id: string;
  opportunityId: string;
  stage: string;
  changedAt: Date;
  changedBy?: string;
  notes?: string;
  createdAt: Date;
}

export interface Communication {
  id: string;
  organizationId: string;
  contactId: string;
  type: 'email' | 'phone' | 'sms' | 'whatsapp' | 'in_person' | 'note';
  subject?: string;
  body?: string;
  direction: 'inbound' | 'outbound';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'logged';
  createdAt: Date;
  updatedAt: Date;
}

export type LeadCreateInput = Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'lastContactedAt'> & {
  name: string;
  email: string;
};

export type ContactCreateInput = Omit<Contact, 'id' | 'createdAt' | 'updatedAt'> & {
  firstName: string;
  lastName: string;
};

export type OpportunityCreateInput = Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt' | 'closedDate'>;

export const LEAD_SOURCES = {
  website: 'website',
  referral: 'referral',
  email: 'email',
  phone: 'phone',
  other: 'other',
} as const;

export const LEAD_STATUSES = {
  new: 'new',
  contacted: 'contacted',
  qualified: 'qualified',
  rejected: 'rejected',
} as const;

export const OPPORTUNITY_STAGES = {
  prospect: 'prospect',
  qualified: 'qualified',
  proposal: 'proposal',
  negotiation: 'negotiation',
  closed_won: 'closed_won',
  closed_lost: 'closed_lost',
} as const;

export type LeadStatus = (typeof LEAD_STATUSES)[keyof typeof LEAD_STATUSES];
export type LeadSource = (typeof LEAD_SOURCES)[keyof typeof LEAD_SOURCES];
export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[keyof typeof OPPORTUNITY_STAGES];
