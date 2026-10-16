# ECHOWAVE ECOSYSTEM — Architecture Decision Record

**Date**: 2026-10-16  
**Status**: APPROVED (Phase 0)  
**Decision Owner**: Claude Code / Principal Architect

---

## 1. Platform & Deployment

### Decision
Build on **Claude + Floot** (new account) with **React/TypeScript** frontend and **PostgreSQL** backend.

### Rationale
- Floot provides integrated Postgres, backend endpoints, auth, storage, scheduler, mobile builds
- React/TypeScript enable rapid iteration with type safety
- Code ownership: GitHub as canonical source (exportable, portable)
- No vendor lock-in for core business logic
- Claude as architect/engineer accelerates quality implementation

### Alternatives Considered
- **Supabase + Vercel**: More flexibility but higher operational overhead
- **Firebase**: Proprietary, harder to export
- **Custom Node/Python**: Too slow for Phase 0 timeline

---

## 2. Architecture Style

### Decision
**Modular Monolith** (not microservices from the start).

### Rationale
- Single deployable unit keeps teams aligned
- Clear domain boundaries prevent shared-database anti-patterns
- Separates only when operational necessity proves it (e.g., scaling comms, long-running tasks)
- Easier for Claude to maintain semantic coherence across codebase
- Lower infrastructure cost and complexity

### Domains (Logical Separation)
```
domains/
  identity/
  crm/
  sales/
  contracts/
  delivery/
  finance/
  subscriptions/
  communications/
  ai/
  analytics/
```

Each domain owns its tables, validation, and API surface. Cross-domain queries forbidden at DB level; use typed service layer only.

---

## 3. Data Architecture

### Decision
- **Single PostgreSQL database** with strict tenant isolation
- Every query filters by `organization_id` (row-level security)
- Foreign key constraints prevent orphaned data
- Immutable documents (versions, not updates)
- Event outbox for reliable async messaging

### Rationale
- ACID guarantees for financial correctness
- Tenant isolation at query level (not app level)
- Version history for audit and legal proof
- Event sourcing for reliability without extra complexity

### Anti-Patterns Forbidden
- Direct app-level filtering (no "hidden" rows by UI)
- Decimal math in application code (PostgreSQL numeric type)
- Unversioned documents once approved
- Missing audit trails on sensitive operations

---

## 4. Authentication & Authorization

### Decision
- **Floot Auth** for session/JWT management
- **RBAC roles** (Owner, Admin, Finance, Sales, PM, Creative, Support, Client, Auditor)
- **ABAC** for sensitive operations (finance, contracts, client data)
- **Server-side enforcement** — never trust client claims

### Rationale
- Floot handles credential security, recovery, MFA infrastructure
- Roles map to job functions
- ABAC checks relationship (e.g., user must be in same org as client record)
- Frontend is hostile; server checks every mutation

### Sensitive Operations Requiring ABAC
- Create/approve commercial document
- Record payment or reconciliation
- Access client project files
- Request signature or approval
- Send message to external party

---

## 5. Internationalization

### Decision
- **Content** in Arabic (Egyptian) and English, stored separately
- **UI** supports bidirectional (RTL/LTR) in same session
- **Currency** as enum (EGP, USD, etc.), stored per transaction
- **Timezone** as user preference, displayed in Africa/Cairo default

### Rationale
- Egypt is home market (Arabic primary)
- Global clients (English required)
- Cinematic media demands editorial quality in both languages
- Separate content prevents translation drift

---

## 6. Legal & Compliance

### Decision
- **Egyptian entity registration**: Planned / In Progress status until verified
- **Pre-registration documents**: Allowed (draft proposals, internal PDFs)
- **Tax invoices**: Disabled until registration + official ETA approval
- **Commercial documents**: Numbered, versioned, linked to entity status

### Rationale
- No fake registration numbers or tax IDs
- Support actual business workflow (proposals exist before tax invoices)
- Clear audit trail of when official capabilities activate
- Avoids retroactive "correction" of issued documents

### Gating
```
Entity Status: GB (verified) | Egypt (pending) | Egypt (active)
  ├─ GB status: can issue to any client
  ├─ Egypt pending: drafts only, no official issuance
  └─ Egypt active: full tax compliance + reporting
```

---

## 7. Financial Consistency

### Decision
- **Journal entry model**: Balanced entries (debit = credit)
- **Payment states**: REPORTED → VERIFIED → RECONCILED
- **No floating-point math**: Postgres `numeric` type throughout
- **Posted entries immutable**: Only reverse (debit-credit swap)

### Rationale
- Accounting requires balanced ledgers
- Payment report ≠ bank verification
- Precise currency handling prevents rounding errors
- Audit trail supports regulatory review

---

## 8. AI & Agent Governance

### Decision
- **Horus Orchestrator** routes intents to domain-specific agents
- **Agents have scoped tools** (findClient, createLead, draftProposal)
- **No direct DB access** for AI; all reads/writes through typed services
- **Approval gates** for operations affecting clients, money, contracts
- **Logging**: Every agent run recorded with context, tools, decision, outcome

### Rationale
- Agents can't leak data across organization boundaries
- Human review gates prevent unapproved external actions
- Traces enable debugging and compliance review
- Modular agents can be disabled/replaced without system impact

---

## 9. Communications Channels

### Decision
- **Inbound**: Voice (with AI identification), WhatsApp Business, Telegram, Email
- **Outbound**: Same channels, with consent/approval gates
- **Test mode**: Required before live activation (no real calls/messages sent)
- **Webhook verification**: HMAC signing, idempotency keys, retry logic

### Rationale
- Multiple channels meet customer expectations
- Clear test/live boundary prevents accidental messages
- Webhook security prevents spoofing and duplicates
- Compliance: record consent, call summaries, opt-out paths

---

## 10. Deployment & Promotion

### Decision
- **Git feature branches** → **PR review** → **staging test** → **main merge** → **production**
- **Zero-downtime migrations**: Additive schema changes only; use feature flags for deletions
- **Backup before every production change**: Testable recovery procedure
- **Rollback plan**: Every major change has a known rollback sequence

### Rationale
- Human review catches logic errors and security issues
- Staging allows realistic testing without production risk
- Feature flags decouple deployment from rollout
- Backup discipline prevents data loss from human error

---

## Deferred Decisions (For Later Phases)

| Topic | Current | Future |
|-------|---------|--------|
| Caching | None; Postgres only | Redis for session/token caching |
| Rate Limiting | Per-endpoint simple logic | Distributed rate limiter |
| Search | SQL full-text search | Elasticsearch/Algolia if scale demands |
| Image Processing | Upload + link to CDN | On-demand resize/optimize |
| Task Queue | Scheduled jobs in Floot | RabbitMQ/SQS if job volume exceeds limits |
| Geolocation | App doesn't use it yet | GIS library if needed for real estate features |

---

## Constraints & Risks

### Must Haves
- Egypt tax readiness must be technically feasible without system redesign
- All client data isolated by organization (no data leakage)
- Financial records immutable once posted
- Communication consent tracked and enforceable

### Nice to Have (Phase 2+)
- Real-time collaboration on projects
- Advanced analytics (ML churn prediction, revenue forecasting)
- Marketplace for third-party integrations
- White-label client portals

### Known Risks
1. **Floot API limits** → Mitigated: Monitor usage, plan scaling early
2. **PostgreSQL growth** → Mitigated: Partitioning strategy by organization, date
3. **AI quality in Arabic** → Mitigated: Evaluation dataset + human review gates
4. **Communications latency** → Mitigated: Test with real providers before go-live

---

## Implementation Checklist

- [ ] Database schema v1 (identity, legal, CRM, sales)
- [ ] Auth system (Floot integration, RBAC enforcement)
- [ ] Design system (components, tokens, themes)
- [ ] Public website (lead form → CRM integration)
- [ ] Admin dashboard (basic CRUD on all domains)
- [ ] Test harness (unit, integration, E2E, security)
- [ ] CLAUDE.md (conventions, project rules)
- [ ] Backup/recovery procedure (documented and tested)
- [ ] Deployment runbook (promotion path from dev → prod)

---

## Sign-Off

**Approved by**: Claude Architect, on behalf of ECHOWAVE Owner  
**Effective**: 2026-10-16  
**Next review**: Phase 1 completion

