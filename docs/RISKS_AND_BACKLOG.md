# ECHOWAVE ECOSYSTEM — Risk Register & Feature Backlog

**Version**: 1.0  
**Date**: 2026-10-16  
**Status**: Phase 0

---

## Risk Register

### Critical Risks (Must Mitigate Before Phase 1)

#### R1: Egyptian Entity Registration Not Complete
| Factor | Detail |
|--------|--------|
| **Description** | Company registration in Egypt not finalized; tax ID and official status unknown |
| **Impact** | Cannot issue tax invoices; legal liability if documents claimed as official |
| **Probability** | High (stated as "in progress") |
| **Mitigation** | Mark as "pending" status; disable tax document generation; require legal sign-off before activation |
| **Owner** | Product owner + legal team |
| **By When** | Before Phase 5 (Finance go-live) |

#### R2: Floot Account Not Verified
| Factor | Detail |
|--------|--------|
| **Description** | New Floot account status unknown; project creation, API limits, mobile builds untested |
| **Impact** | Can't deploy Phase 0 foundation; delays all development |
| **Probability** | Medium (account exists, unclear if ready) |
| **Mitigation** | Verify account access immediately; test project creation, database, endpoints, mobile builds |
| **Owner** | Claude + product owner |
| **By When** | Week 1 of Phase 0 |

#### R3: GitHub Organization Access
| Factor | Detail |
|--------|--------|
| **Description** | GitHub org exists but unclear if user has push/admin rights; repo creation, secrets management |
| **Impact** | Can't push code; can't set up CI/CD; can't protect main branch |
| **Probability** | Low (org exists, likely has access) |
| **Mitigation** | Verify push permission; create fresh repo; set up branch protection rules |
| **Owner** | Claude + product owner |
| **By When** | Week 1 of Phase 0 |

#### R4: Data Migration Ethics
| Factor | Detail |
|--------|--------|
| **Description** | Old database has client data, projects, financial records; unclear legal right to copy |
| **Impact** | GDPR/privacy violation if data copied without consent; operational disruption if no historical context |
| **Probability** | Medium (depends on data lineage) |
| **Mitigation** | Audit old DB for client PII; ask owner which clients approved migration; start fresh if unclear |
| **Owner** | Product owner + legal team |
| **By When** | Before Phase 1 data import |

#### R5: Communications Providers Not Integrated
| Factor | Detail |
|--------|--------|
| **Description** | Voice, WhatsApp, Telegram APIs not connected; no real numbers, keys, or accounts provisioned |
| **Impact** | Can't test live comms; can't launch Phase 5 without provider setup |
| **Probability** | High (mentioned as "test mode only") |
| **Mitigation** | Build test mode in code; mock provider responses; document real integration steps; gate behind feature flags |
| **Owner** | Communications architect |
| **By When** | Before Phase 5 go-live |

#### R6: AI Agent Quality in Arabic
| Factor | Detail |
|--------|--------|
| **Description** | Claude model works well in English; no Arabic training guarantee; hallucinations possible |
| **Impact** | Poor customer experience; brand damage; compliance issues if AI gives wrong legal advice |
| **Probability** | Medium (depends on prompt + guardrails) |
| **Mitigation** | Build evaluation dataset (Arab-native linguists); gate AI features behind human approval; disable risky outputs |
| **Owner** | AI architect |
| **By When** | Before Phase 5 (Horus go-live) |

#### R7: Financial Data Integrity
| Factor | Detail |
|--------|--------|
| **Description** | Currency conversion, rounding, decimal precision errors could cause reconciliation failures |
| **Impact** | Accounting errors; audit failures; loss of customer trust |
| **Probability** | Medium (easy to get wrong) |
| **Mitigation** | Use Postgres NUMERIC type; test edge cases (small amounts, high currencies, 3-decimal); journal entry validation |
| **Owner** | Data architect + finance lead |
| **By When** | Before Phase 4 (Finance go-live) |

### High-Priority Risks

#### R8: Scope Creep
| Factor | Detail |
| **Description** | Five products + 23 modules + AI + mobile = massive scope; easy to over-commit |
| **Probability** | High |
| **Mitigation** | Strict phase gates; defer Phase 2+ features to later; say "no" to unplanned requests |

#### R9: Floot Vendor Lock-In
| Factor | Detail |
| **Description** | All code in Floot; hard to export or migrate to another platform |
| **Probability** | Medium |
| **Mitigation** | Store code in GitHub; design schema to be portable; test export mechanism early |

#### R10: Team Capacity
| Factor | Detail |
| **Description** | One AI engineer (Claude) building an entire ecosystem; no human team to handoff to |
| **Probability** | High |
| **Mitigation** | Document heavily; prioritize quality over speed; ensure human developer can understand codebase after Claude |

---

## Feature Backlog (Phases 0-7)

### PHASE 0 — Foundation & Architecture

**Goal**: Set up infrastructure, establish patterns, build core identity system.  
**Timeline**: 2 weeks  
**Definition of Done**: Auth working, design system in place, first domain CRUD complete.

#### Phase 0 Backlog

| ID | Feature | Size | Priority | Notes |
|----|---------|------|----------|-------|
| P0-001 | GitHub repo + CI/CD pipeline | M | P0 | Lint, test, security scan on every push |
| P0-002 | Floot project setup + database | M | P0 | PostgreSQL schema v1, migrations tooling |
| P0-003 | CLAUDE.md + project conventions | S | P0 | Branch naming, commit style, approval gates |
| P0-004 | Authentication system (Floot integration) | M | P0 | Login, session, JWT, MFA structure |
| P0-005 | RBAC authorization engine | M | P0 | Role assignment, permission checks, org isolation |
| P0-006 | Design system tokens + components | M | P0 | Colors, typography, buttons, forms, responsive |
| P0-007 | Users domain (CRUD + org mgmt) | M | P0 | Create user, assign role, manage organization |
| P0-008 | Audit logging foundation | S | P0 | Capture sensitive operations, replay capability |
| P0-009 | Error handling + observability | S | P0 | Structured logs, error codes, Sentry ready |
| P0-010 | Database backup & recovery script | S | P0 | Automated backup, test rollback procedure |

**Acceptance Criteria**:
- ✅ User can register, login, logout
- ✅ Admin can create organization and invite users
- ✅ RBAC enforced: Client user cannot see Finance data
- ✅ Design system covers >80% of UI patterns
- ✅ Audit log records all user auth events
- ✅ Backup runs daily; recovery tested
- ✅ All P0 tests passing; no TypeScript errors; lint clean

**Estimated Hours**: 80-100  
**Status**: In planning

---

### PHASE 1 — Website + CRM

**Goal**: Public website with lead capture; CRM to track prospects and clients.  
**Timeline**: 3 weeks  
**Depends on**: Phase 0 complete

#### Phase 1 Backlog

| ID | Feature | Size | Priority | Notes |
|----|---------|------|----------|-------|
| P1-001 | Public website homepage + nav | L | P0 | Bilingual, hero, services, CTA, footer |
| P1-002 | Service pages (6 services) | L | P0 | Details, deliverables, case studies, CTA |
| P1-003 | Case studies / Portfolio | M | P0 | Searchable, filterable by category |
| P1-004 | Contact form → CRM lead | M | P0 | Validation, spam prevention, auto-response |
| P1-005 | Request proposal flow | M | P0 | Form → opportunity in CRM |
| P1-006 | CRM clients domain (CRUD) | M | P0 | Create client, contacts, notes, history |
| P1-007 | Leads domain (CRUD + pipeline) | M | P0 | New → Contacted → Qualified → Proposal → Won |
| P1-008 | Opportunities domain (CRUD) | S | P0 | Link to client, value, stage, assign to sales |
| P1-009 | Activity log (calls, emails, notes) | M | P0 | Timeline view, full-text search |
| P1-010 | CRM dashboard for sales team | M | P0 | Pipeline view, hot leads, overdue follow-ups |
| P1-011 | Email integration (forward to CRM) | M | P1 | Parse emails, create activities |
| P1-012 | CSV import / export clients | S | P1 | From old system or spreadsheet |

**Acceptance Criteria**:
- ✅ Website SEO optimized (Lighthouse >90)
- ✅ Lead form → CRM with <1s latency
- ✅ Sales can view full pipeline in dashboard
- ✅ Client isolation enforced (user A can't see client B's data)
- ✅ Bilingual content all pages
- ✅ Mobile responsive (Bootstrap test on 5 devices)

**Estimated Hours**: 120-150  
**Status**: Blocked on Phase 0

---

### PHASE 2 — Sales & Proposals

**Goal**: Generate proposals, manage approvals, convert to projects.  
**Timeline**: 2 weeks  
**Depends on**: Phase 1 complete

#### Phase 2 Backlog

| ID | Feature | Size | Priority | Notes |
|----|---------|------|----------|-------|
| P2-001 | Service catalog (CRUD) | S | P0 | Define services, pricing, units |
| P2-002 | Proposals domain (CRUD) | L | P0 | Template + draft + send + sign |
| P2-003 | Proposal versioning | M | P0 | Keep history, track changes, revert if needed |
| P2-004 | Proposal approval workflow | M | P0 | Route to legal, finance, sales for sign-off |
| P2-005 | Proposal → commercial document | M | P0 | Link to finance, generate PDF |
| P2-006 | E-signature integration (future) | M | P1 | DocuSign/similar when available |
| P2-007 | Proposal templates | M | P1 | Create reusable formats by service |
| P2-008 | Client portal (read-only proposals) | M | P1 | Client can view + accept proposal |
| P2-009 | Proposal to project conversion | M | P0 | Accept proposal → create project + tasks |

**Acceptance Criteria**:
- ✅ Proposal PDF generated correctly, bilingual option
- ✅ Approval workflow enforces role checks
- ✅ Approved proposal can't be edited (immutable)
- ✅ Proposal number unique per organization
- ✅ Client can review and approve in portal

**Estimated Hours**: 100-120

---

### PHASE 3 — Projects & Delivery

**Goal**: Manage project execution, tasks, deliverables, approvals.  
**Timeline**: 3 weeks  
**Depends on**: Phase 2 complete

#### Phase 3 Backlog

| ID | Feature | Size | Priority | Notes |
|----|---------|------|----------|-------|
| P3-001 | Projects domain (CRUD) | M | P0 | Create, phases, budget, timeline |
| P3-002 | Project phases (discovery, design, dev, qa, delivery) | M | P0 | Sequential or parallel, track progress |
| P3-003 | Tasks domain (CRUD + assignment) | M | P0 | Assign to team, priority, due date, status |
| P3-004 | Task dependencies & blocking | M | P1 | Can't close task until blocker resolved |
| P3-005 | Time tracking (optional) | S | P2 | Log hours, compare vs estimate |
| P3-006 | Deliverables (CRUD + approval) | M | P0 | File upload, client review, accept/reject |
| P3-007 | File versioning | M | P0 | Keep history, rollback to previous version |
| P3-008 | Project dashboard | M | P0 | Team view: assigned tasks, deadlines, status |
| P3-009 | Client portal (project status) | M | P0 | View timeline, deliverables, updates |
| P3-010 | Team collaboration (comments) | M | P1 | Thread on tasks, files, deliverables |

**Acceptance Criteria**:
- ✅ Task assignment triggers notifications
- ✅ Deliverable upload auto-updates project status
- ✅ Client sees only their project (isolation check)
- ✅ Gantt chart or timeline view works
- ✅ Team can see assigned tasks on mobile

**Estimated Hours**: 140-160

---

### PHASE 4 — Finance & Billing

**Goal**: Commercial documents, payments, accounting, subscriptions.  
**Timeline**: 3 weeks  
**Depends on**: Phase 2 + Phase 3 complete

#### Phase 4 Backlog

| ID | Feature | Size | Priority | Notes |
|----|---------|------|----------|-------|
| P4-001 | Legal entities (Egypt vs GB) | S | P0 | Entity status, registration readiness |
| P4-002 | Commercial documents (pre-tax) | M | P0 | Proposals, PDFs, numbering (PRE-000001) |
| P4-003 | Accounts domain (chart of accounts) | M | P0 | GL structure, account codes, types |
| P4-004 | Journal entry (CRUD + balanced) | M | P0 | Debit/credit, validation, posting |
| P4-005 | Payments (CRUD + reconciliation) | M | P0 | Record, verify, reconcile to bank |
| P4-006 | Payment sources (InstaPay, wallet, bank) | M | P0 | Track accounts, verify, balance |
| P4-007 | Subscriptions (recurring expenses) | M | P0 | Adobe, AWS, Vercel, renewals, reminders |
| P4-008 | Renewal reminders (scheduled) | S | P0 | Email alert 7 days before due |
| P4-009 | Financial reporting (P&L, balance sheet) | M | P1 | Month/year reports, drill-down |
| P4-010 | Reconciliation workflow | M | P0 | Match payments to bank statement |
| P4-011 | Egypt tax readiness (checklist) | S | P0 | Registration status, ETA configuration (disabled) |
| P4-012 | Audit trail on all financial ops | S | P0 | Who, when, what, approval state |

**Acceptance Criteria**:
- ✅ Journal entries balance (debit = credit)
- ✅ Payment REPORTED state separate from RECONCILED
- ✅ Subscription renewal triggers notification
- ✅ Financial report export to PDF
- ✅ No tax invoice issued before Egypt registration active
- ✅ Audit log covers every financial operation

**Estimated Hours**: 140-160

---

### PHASE 5 — HORUS AI + Communications

**Goal**: AI orchestrator, voice/WhatsApp/Telegram agents, communication workflows.  
**Timeline**: 4 weeks  
**Depends on**: Phase 4 complete

#### Phase 5 Backlog

| ID | Feature | Size | Priority | Notes |
|----|---------|------|----------|-------|
| P5-001 | Horus orchestrator (intent routing) | M | P0 | Route to domain agents, context management |
| P5-002 | Sales agent (prospect qualification) | M | P0 | findClient, checkOpportunity, draftProposal |
| P5-003 | Finance agent (cost tracking) | M | P0 | listExpenses, analyzeSpend, predictCash |
| P5-004 | Project agent (task status) | M | P0 | listTasks, updateTask, assignTask |
| P5-005 | Writer agent (content + scenarios) | M | P1 | Outline, draft, edit, export |
| P5-006 | Brand strategist agent | M | P1 | Analyze brand, recommend positioning |
| P5-007 | Voice inbound (test mode) | L | P1 | Mock calls, transcription, routing (no real calls) |
| P5-008 | Voice outbound (test mode) | L | P1 | Mock follow-up calls |
| P5-009 | WhatsApp integration (test mode) | M | P1 | Mock messages, webhook handling (no real messages) |
| P5-010 | Telegram bot (@HorusEchoWaveBot) | M | P0 | Status updates, internal alerts, team chat |
| P5-011 | Email agent | M | P1 | Receive, parse, forward to CRM |
| P5-012 | Agent audit logging | M | P0 | Every run, tools used, decision, approval |
| P5-013 | Approval gates (sensitive ops) | M | P0 | Human review before execute |
| P5-014 | Arabic language quality eval | M | P0 | Dataset + scoring, gate on low confidence |

**Acceptance Criteria**:
- ✅ Horus routes intent to correct agent 90% accuracy
- ✅ All agents test in isolated mode (no real customer impact)
- ✅ Agent runs logged with full trace
- ✅ High-risk actions blocked pending human approval
- ✅ Arabic evaluation dataset covering 50+ scenarios
- ✅ Test mode clearly marked (no accidental live calls)

**Estimated Hours**: 180-200

---

### PHASE 6 — Mobile Apps & Hardening

**Goal**: Android/iOS apps, notifications, security hardening, operational readiness.  
**Timeline**: 3 weeks  
**Depends on**: Phases 1-5 complete

#### Phase 6 Backlog

| ID | Feature | Size | Priority | Notes |
|----|---------|------|----------|-------|
| P6-001 | Mobile app (Admin role) | L | P0 | Dashboard, approvals, notifications |
| P6-002 | Mobile app (Team role) | L | P0 | Tasks, files, chat, time tracking |
| P6-003 | Mobile app (Client role) | M | P0 | Projects, deliverables, approvals |
| P6-004 | Push notifications | M | P0 | Task assigned, approval needed, deadline |
| P6-005 | Mobile offline mode (limited) | M | P1 | View cached data, sync when online |
| P6-006 | Camera + file upload | M | P0 | Photo capture, deliverable upload |
| P6-007 | Biometric auth (optional) | S | P2 | Fingerprint, face unlock |
| P6-008 | Horus conversational (mobile) | M | P1 | Chat interface, voice input |
| P6-009 | Security hardening | M | P0 | Penetration test, SAST, dependency audit |
| P6-010 | Performance testing | M | P0 | Load test, stress test, scalability |
| P6-011 | Backup + disaster recovery drill | M | P0 | Document & execute full recovery |
| P6-012 | Operations runbook | M | P0 | Monitoring, alerts, escalation, incident response |
| P6-013 | Team training | S | P0 | User guide, video walkthroughs |

**Acceptance Criteria**:
- ✅ App stores ready (Google Play, Apple App Store)
- ✅ App passes security review (no PII logged, secure storage)
- ✅ P95 latency <1s on mobile network
- ✅ Works offline for cached data
- ✅ Notifications arrive within 30s
- ✅ Recovery from backup tested and documented

**Estimated Hours**: 120-150

---

### PHASE 7 — Advanced Intelligence & Scale

**Goal**: Advanced AI, marketing analytics, production optimization, scale readiness.  
**Timeline**: 4+ weeks  
**Depends on**: Phases 1-6 complete

#### Phase 7 Backlog

| ID | Feature | Size | Priority | Notes |
|----|---------|------|----------|-------|
| P7-001 | Writer OS (script generation) | L | P0 | Outline, write, edit, version, export |
| P7-002 | Branding studio (brand analysis) | M | P1 | Audit brand, recommend strategy, guidelines |
| P7-003 | Marketing intelligence | M | P1 | Campaign analytics, ROI tracking, attribution |
| P7-004 | Production workflow optimization | M | P1 | Auto-route tasks, predict duration, bottleneck detection |
| P7-005 | Advanced forecasting (ML) | M | P2 | Revenue forecast, churn prediction, resource planning |
| P7-006 | Marketplace for integrations | M | P2 | Third-party apps, API-first extensions |
| P7-007 | White-label portal (optional) | M | P2 | Custom domains, branding for clients |
| P7-008 | Real-time collaboration (sockets) | M | P2 | Multiple users edit simultaneously |
| P7-009 | Media CDN + optimization | M | P1 | Lazy loading, responsive images, compression |
| P7-010 | Global scale (multi-region) | L | P2 | Replicas, failover, latency optimization |

**Acceptance Criteria**:
- ✅ Writer Agent produces script outlines in Arabic + English
- ✅ Marketing dashboard tracks campaign ROI
- ✅ Forecast accuracy >85% on historical data
- ✅ Sub-second page load time globally

**Estimated Hours**: 200+ (ongoing)

---

## Timeline Overview

```
Week 1-2:   Phase 0 (Foundation)
  ├─ GitHub repo
  ├─ Floot project
  ├─ Auth system
  ├─ Design system
  └─ First domain CRUD

Week 3-5:   Phase 1 (Website + CRM)
  ├─ Public website
  ├─ Lead capture
  └─ CRM dashboard

Week 6-7:   Phase 2 (Sales)
  ├─ Proposals
  ├─ Approvals
  └─ Versioning

Week 8-10:  Phase 3 (Projects)
  ├─ Project mgmt
  ├─ Tasks
  └─ Deliverables

Week 11-13: Phase 4 (Finance)
  ├─ Commercial docs
  ├─ Accounting
  └─ Subscriptions

Week 14-17: Phase 5 (HORUS)
  ├─ AI agents
  ├─ Comms channels
  └─ Approvals

Week 18-20: Phase 6 (Mobile)
  ├─ Apps (iOS/Android)
  ├─ Security hardening
  └─ Go-live preparation

Week 21+:   Phase 7 (Advanced)
  ├─ Advanced AI
  ├─ Analytics
  └─ Scale

Total: ~5 months to Phase 6 MVP
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Code Quality** | TypeScript strict, >80% test coverage | npm test, lint |
| **Security** | 0 critical/high vulns open | Dependency audit + SAST |
| **Performance** | P95 <1s API, <2s page load | APM monitoring |
| **Reliability** | 99.5% uptime (Phase 6+) | Heartbeat monitoring |
| **Compliance** | 100% audit trail on sensitive ops | Audit log review |
| **User Adoption** | Team using system daily by Phase 3 | Usage metrics |

---

