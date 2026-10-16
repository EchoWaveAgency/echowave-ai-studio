# ECHOWAVE ECOSYSTEM — Roadmap (Phase 0-7)

**Timeline**: ~5 months to Phase 6 MVP  
**Status**: Phase 0 (Complete) → Phase 1 (Ready to start)

---

## Phase 0: Foundation (2 weeks) — ✅ COMPLETE

**Objective**: Establish architectural base, conventions, and core platform utilities.

### Deliverables
- ✅ CLAUDE.md (project conventions, branch naming, commit format, testing standards)
- ✅ ADR.md (10 architectural decisions)
- ✅ DATA_MODEL.md (PostgreSQL schema with 80+ tables across 10 domains)
- ✅ RISKS_AND_BACKLOG.md (risk register and feature backlog)
- ✅ GitHub repository with CI/CD workflows (lint, test, security)
- ✅ Platform modules: database connection, logging, error handling, RBAC, authorization
- ✅ Design system: color tokens, typography scales, spacing system, Button component
- ✅ Identity domain: User/Organization/Role models, UserService, OrganizationService
- ✅ Database migration system with Phase 0 schema (identity/legal domains)
- ✅ Validation utilities (email, password strength, slug, UUID, phone)
- ✅ Test infrastructure (Vitest with 80% coverage thresholds)

### Gate Criteria — ALL MET ✅
- [x] Architecture documented and approved
- [x] Database schema finalized
- [x] GitHub repo initialized with CI/CD
- [x] Auth + org isolation working and tested
- [x] Design system in place
- [x] CLAUDE.md followed in first PR

### Blockers (External)
- Floot project creation and database initialization
- GitHub Actions CI/CD pipeline execution

---

## Phase 1: Lead Capture & CRM (3 weeks) — 🚧 READY

**Objective**: Public website with lead capture form; CRM for lead/contact/opportunity tracking.

### Epics
1. **Public Website (1 week)**
   - Marketing pages (home, services, portfolio)
   - Lead capture form (name, email, phone, message, service interest)
   - Email notification on lead submission
   - Form validation + CAPTCHA

2. **Lead Management (1 week)**
   - Store leads in CRM (leads table)
   - Lead detail view, status workflow (new → contacted → qualified → rejected)
   - Bulk import leads (CSV)
   - Lead search + filters

3. **Contact Management (1 week)**
   - Contact CRUD (name, email, phone, address, notes)
   - Attach contacts to leads/organizations
   - Contact communication history
   - Contact consent tracking (marketing, phone, email)

### Estimated Hours: 80-100  
### Acceptance Criteria: 50+ tests passing

### Deliverables
- [ ] website/pages/index.tsx (home page with lead form)
- [ ] website/components/LeadForm.tsx
- [ ] domains/crm/models (Lead, Contact, Opportunity)
- [ ] domains/crm/services (LeadService, ContactService)
- [ ] API endpoints: POST /api/v1/leads, GET /api/v1/leads, etc.
- [ ] E2E tests for lead capture flow
- [ ] OpenAPI documentation for CRM endpoints

### Phase Gate → Phase 2
- [ ] Public website + lead CRM integration complete and tested
- [ ] 50+ acceptance tests passing
- [ ] No critical security issues open
- [ ] Backup/recovery procedure documented and tested
- [ ] Team trained on deployment process

---

## Phase 2: Sales & Proposals (2 weeks) — 📋 PLANNED

**Objective**: Sales proposal creation, versioning, approval workflow.

### Epics
1. **Service Catalog (3 days)**
   - Create service packages (name, description, price, hours)
   - Service line items (template for proposals)

2. **Proposal Management (1 week)**
   - Create proposal from service catalog
   - Manual line items (custom services, discounts)
   - Proposal versioning (immutable history)
   - PDF export
   - Client-facing proposal link (view-only portal)

3. **Approvals (3 days)**
   - Internal approval gate (finance, legal)
   - Approval audit trail
   - Proposal lock after approval (no edits allowed)

### Estimated Hours: 60-80  
### Acceptance Criteria: All proposals versioned, no updates to approved docs

### Deliverables
- [ ] domains/sales/models (ServiceCatalog, Proposal, ProposalVersion, ProposalApproval)
- [ ] domains/sales/services (ProposalService, ServiceCatalogService)
- [ ] API endpoints: POST/GET /api/v1/proposals, etc.
- [ ] PDF generation endpoint
- [ ] Client portal (view-only proposals)

---

## Phase 3: Project Management (3 weeks) — 📅 PLANNED

**Objective**: Delivery tracking (projects, phases, tasks, deliverables).

### Epics
1. **Project Setup (1 week)**
   - Create project with client
   - Project phases (planning, design, development, launch)
   - Project status workflow (planning → in_progress → completed → archived)

2. **Task Management (1 week)**
   - Create tasks in project phases
   - Task assignments (team members)
   - Task dependencies
   - Progress tracking (% complete, hours)

3. **Deliverables (1 week)**
   - Track deliverable submission/approval
   - File versioning for deliverables
   - Approval workflow (team lead → client)

### Estimated Hours: 90-110

### Deliverables
- [ ] domains/delivery/models (Project, ProjectPhase, Task, Deliverable)
- [ ] domains/delivery/services (ProjectService, TaskService, DeliverableService)
- [ ] API endpoints: POST/GET /api/v1/projects, etc.
- [ ] Business OS dashboard (projects, tasks, timeline view)

---

## Phase 4: Accounting & Egyptian Tax (3 weeks) — 💰 PLANNED

**Objective**: Financial tracking with Egyptian tax readiness.

### Epics
1. **Accounting (1 week)**
   - Journal entries (balanced debit/credit)
   - Account chart (assets, liabilities, equity, revenue, expense)
   - Trial balance report
   - Financial statements (P&L, balance sheet)

2. **Payments (1 week)**
   - Payment recording (amount, date, method, reference)
   - Payment reconciliation (reported → verified → reconciled)
   - Payment status workflow
   - Bank/cash account tracking

3. **Egyptian Tax Readiness (1 week)**
   - Legal entity registration tracking (pending → active)
   - Tax invoice generation (only when active)
   - Tax number assignment
   - Compliance task tracking

### Estimated Hours: 100-120

### Deliverables
- [ ] domains/finance/models (JournalEntry, Account, Payment, TaxInvoice)
- [ ] domains/finance/services (AccountingService, PaymentService, TaxService)
- [ ] API endpoints: POST /api/v1/journals, POST /api/v1/payments, etc.
- [ ] Finance dashboard (P&L, account balances, payment reconciliation)

---

## Phase 5: AI & Orchestration (4 weeks) — 🤖 PLANNED

**Objective**: HORUS Orchestrator with domain-specific agents.

### Epics
1. **Orchestrator Framework (1 week)**
   - Agent definition (routing, tools, permissions)
   - Tool registry (domain-specific tools)
   - Approval gate system for sensitive operations
   - Evaluation dataset for quality assurance

2. **Domain Agents (3 weeks)**
   - **Sales Agent**: Create proposal, qualify lead, send follow-up
   - **Finance Agent**: Record payment, reconcile accounts
   - **Project Agent**: Create task, assign team member, update status
   - **Writer Agent**: Draft proposal copy, email templates
   - **Brand Agent**: Apply brand voice to content
   - **Voice Agent**: Transcribe and route inbound calls

### Estimated Hours: 150-180

### Deliverables
- [ ] domains/ai/models (AIAgent, AIRun, KnowledgeSource)
- [ ] domains/ai/services (OrchestratorService, AgentService)
- [ ] Agent implementations (6 domain-specific agents)
- [ ] Evaluation dataset + quality metrics
- [ ] API endpoints: POST /api/v1/agents/run

---

## Phase 6: Mobile & Hardening (3 weeks) — 📱 PLANNED

**Objective**: Mobile apps (admin, team, client) + security hardening.

### Epics
1. **Mobile Apps (2 weeks)**
   - Admin app (project status, payment approvals, team management)
   - Team app (task updates, time tracking, deliverable submission)
   - Client app (proposal view, deliverable access, messaging)

2. **Hardening (1 week)**
   - Security audit (OWASP Top 10)
   - Penetration testing
   - SSL/TLS verification
   - Dependency vulnerability scan
   - Backup + recovery drill (test failover)

### Estimated Hours: 120-150

### Deliverables
- [ ] apps/mobile/admin (React Native)
- [ ] apps/mobile/team (React Native)
- [ ] apps/mobile/client (React Native)
- [ ] Security audit report
- [ ] Backup/recovery procedure (documented + tested)

### Phase Gate → Phase 7
- [ ] Mobile apps working on iOS + Android
- [ ] No high/critical security issues
- [ ] Backup/recovery tested successfully
- [ ] Team trained on incident response
- [ ] Uptime monitoring + alerting active

---

## Phase 7: Advanced Features (4+ weeks) — 🚀 PLANNED

**Objective**: Advanced analytics, marketplace, white-label portal.

### Planned Features
1. **Writer OS**: Content creation, AI copywriting, brand voice enforcement
2. **Branding Studio**: Brand asset management, design system sync
3. **Marketing Intelligence**: Lead scoring, campaign analytics, ROI tracking
4. **Advanced Forecasting**: Revenue projections, resource capacity planning
5. **Marketplace**: Third-party app integrations, plugin system
6. **White-Label Portal**: Custom domain, branded client portal, reseller support

### Estimated Hours: 200+

### Target Timeline
- Phase 7 begins after Phase 6 MVP is stable in production
- Rolling releases every 2 weeks
- No phase gate — continuous improvement

---

## Critical Path & Dependencies

```
Phase 0 ✅
  ↓
Phase 1 (CRM, Website)
  ├── Phase 2 (Proposals)
  │   └── Phase 3 (Projects)
  │       └── Phase 4 (Accounting)
  │           └── Phase 5 (AI)
  │               └── Phase 6 (Mobile)
  │                   └── Phase 7 (Advanced)
  └── (Parallel) Infrastructure: CI/CD, monitoring, backups
```

### Critical Milestones
- **End of Phase 1**: Lead capture working in production, CRM operational
- **End of Phase 2**: Proposal workflow + approvals tested
- **End of Phase 3**: Full delivery tracking (projects → tasks → deliverables)
- **End of Phase 4**: Financial module complete, tax invoice ready (once entity registered)
- **End of Phase 5**: HORUS agents in test environment, evaluation dataset built
- **End of Phase 6**: MVP released to internal team, security hardened
- **Phase 7+**: Continuous product expansion

---

## Resource Allocation

| Phase | Lead Engineer | Product Manager | QA | Design | DevOps |
|-------|--|--|--|--|--|
| 0 | Claude | User | Claude | N/A | Claude |
| 1 | Claude + Team | Product Owner | QA Lead | Designer | DevOps |
| 2-6 | Team | Product Owner | QA Lead | Designer | DevOps |
| 7+ | Team | Product Owner | QA Lead | Designer | DevOps |

---

## Success Metrics

### Phase Completion
- All acceptance tests passing for phase
- Code review approved (min 2 reviewers for platform changes)
- CI/CD green (lint, type-check, tests, security scan)
- Documentation updated
- No critical security issues

### Overall Project Health
- **Uptime**: 99.5%+ (post-Phase 6)
- **Test Coverage**: >80% (maintained across all phases)
- **Deploy Frequency**: 1-2x per week (post-Phase 1)
- **MTTR**: <30 minutes for critical bugs
- **Security**: Zero critical/high vulnerabilities

---

## Risk Mitigation

| Risk | Impact | Mitigation | Status |
|------|--------|------------|--------|
| Egyptian registration delayed | High | Mark as "pending" in system, disable tax docs until active | ✅ Phase 0 ADR |
| Floot performance limits | Medium | Monitor, plan caching + pagination early | 🚧 Phase 1 |
| AI quality in Arabic | High | Native speaker evaluation dataset + human gates | 🚧 Phase 5 |
| Communications provider outages | Medium | Multi-provider fallback + test mode | 🚧 Phase 5 |
| Database growth (50k+ records) | Medium | Partitioning by organization_id + date | 🚧 Phase 4 |

---

## Questions & Escalation

- **Technical blockers**: Ask Claude for architecture guidance
- **Scope clarification**: Ask Product Owner for requirements
- **Security concerns**: Escalate to Security Team immediately
- **Deployment issues**: Ask DevOps for production access

---

**Last Updated**: October 16, 2026  
**Next Review**: Phase 1 completion  
**Status**: Phase 0 Complete, Phase 1 Ready to Start
