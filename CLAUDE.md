# CLAUDE.md — ECHOWAVE ECOSYSTEM Project Rules

**Last Updated**: 2026-10-16  
**Status**: Phase 0 (Active)

---

## Project Overview

**ECHOWAVE ECOSYSTEM** is a comprehensive business management and AI system for an Egyptian creative agency. Built on Claude + Floot, with React/TypeScript + PostgreSQL.

**Brand**: ECHOWAVE — Egyptian Roots. Global Impact.  
**Repository**: https://github.com/EchoWaveAgency/echowave-ecosystem  
**Primary Language**: English (engineering), Arabic (content/UI)

---

## Core Principles

1. **Real Implementation**: Every feature is testable code, not mockups
2. **Tenant Isolation**: organization_id on every query; no data leakage
3. **Financial Consistency**: Balanced ledgers, immutable posted documents
4. **Audit Everything**: Log sensitive operations; enable compliance review
5. **Server-Side Security**: Never trust client claims; enforce RBAC server-side
6. **Incremental Delivery**: Test and merge before moving to next phase
7. **Portable Code**: GitHub as source of truth; exportable from Floot

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + TypeScript | 18.3+ |
| Backend | Floot endpoints (Node.js) | Latest |
| Database | PostgreSQL | 14+ |
| ORM/Query | TypeORM or raw SQL | N/A |
| Authentication | Floot Auth + RBAC | Built-in |
| Storage | Floot storage (S3-like) | Built-in |
| Styling | TailwindCSS + design tokens | 3.x |
| API Documentation | OpenAPI 3.0 | Typed |
| Testing | Vitest + Playwright | Latest |
| CI/CD | GitHub Actions | Standard |
| Monitoring | Structured logs + Sentry (future) | TBD |

---

## Project Structure

```
echowave-ecosystem/
├── docs/
│   ├── ADR.md                          # Architecture decisions
│   ├── DATA_MODEL.md                   # ERD and schema
│   ├── INTEGRATIONS.md                 # External services
│   ├── ACCEPTANCE_TESTS.md             # Feature criteria
│   ├── DEPLOYMENT.md                   # Promotion runbook
│   └── ROADMAP.md                      # Phase 0-7 timeline
│
├── .github/
│   ├── workflows/
│   │   ├── test.yml                    # Unit + integration
│   │   ├── lint.yml                    # TypeScript, Prettier
│   │   └── security.yml                # SAST scan
│   └── CONTRIBUTING.md
│
├── apps/
│   ├── website/
│   │   ├── pages/                      # React pages (SSR ready)
│   │   ├── components/
│   │   └── public/
│   ├── business-os/
│   ├── client-portal/
│   └── mobile/
│
├── domains/                            # Modular business logic
│   ├── identity/
│   │   ├── models/
│   │   ├── services/
│   │   ├── api/
│   │   └── __tests__/
│   ├── crm/
│   ├── sales/
│   ├── contracts/
│   ├── delivery/
│   ├── finance/
│   ├── subscriptions/
│   ├── communications/
│   ├── ai/
│   └── analytics/
│
├── platform/                           # Cross-cutting concerns
│   ├── auth/
│   ├── authorization/
│   ├── database/
│   ├── events/
│   ├── storage/
│   ├── scheduler/
│   ├── logging/
│   ├── errors/
│   └── security/
│
├── design-system/
│   ├── tokens/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── spacing.ts
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Form.tsx
│   │   └── ...
│   └── themes/
│       ├── dark.css
│       └── light.css
│
├── integrations/
│   ├── voice/
│   ├── whatsapp/
│   ├── telegram/
│   ├── email/
│   ├── payments/
│   └── egypt-tax/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   ├── security/
│   └── ai-evals/
│
├── scripts/
│   ├── db/
│   │   ├── migrate.ts
│   │   ├── seed.ts
│   │   └── rollback.ts
│   ├── backup.sh
│   └── health-check.sh
│
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── .env.example
├── .env.local (GITIGNORE)
├── CLAUDE.md (this file)
└── README.md
```

---

## Key Conventions

### Branch Naming
```
feature/<domain>/<feature-name>
fix/<issue-number>-<description>
refactor/<area>
docs/<topic>
```

Example: `feature/sales/proposal-versioning`, `fix/123-client-isolation-check`

### Commit Messages
```
<type>(<domain>): <subject>

<body describing the change>

Closes #<issue> (if applicable)
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`  
Example:
```
feat(sales): add proposal version history

- Store all proposal versions immutably
- Link document history to audit trail
- Add approval gate before finalization

Closes #42
```

### Code Review Process
1. PR author ensures tests pass locally (`npm test`)
2. Linting clean (`npm run lint`)
3. Request review (min 1 for features, 2 for platform changes)
4. Approval required before merge
5. CI must be green
6. Squash or rebase before merge (no merge commits on main)

### Database Migrations
- Create migration files with timestamp: `20261016_120000_add_proposal_versions.ts`
- Forward migration: CREATE/ALTER
- Rollback migration: DROP/REVERSE
- Test rollback before merging
- Never edit previous migrations

### Testing Requirements
- **Unit tests**: Cover domain logic, >80% coverage
- **Integration tests**: Test API endpoints with real DB (test_db)
- **E2E tests**: Smoke tests on staging after deploy
- **Security tests**: RBAC enforcement, SQL injection tests
- **AI evaluations**: Quality checks in Arabic + English

### API Contracts (OpenAPI)
Every endpoint must have:
- Path, method, summary
- Request body schema (with examples)
- Response schema (with examples)
- Auth requirements and error codes
- Rate limits if applicable

Example:
```yaml
POST /api/v1/proposals:
  summary: Create a new proposal
  tags: [Sales]
  security:
    - Bearer: []
  requestBody:
    required: true
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ProposalCreateInput'
  responses:
    201:
      description: Proposal created
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Proposal'
    400:
      description: Validation error
    401:
      description: Unauthorized
    403:
      description: Forbidden (org isolation check)
```

### Environment Variables
Required (never commit):
```
DATABASE_URL=postgresql://...
FLOOT_AUTH_SECRET=...
JWT_SECRET=...
STORAGE_BUCKET=...
OPENAI_API_KEY=... (if used for Horus)
WHATSAPP_BUSINESS_ACCOUNT_ID=...
TELEGRAM_BOT_TOKEN=...
```

Optional (commit .env.example with defaults):
```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_ENV=development
LOG_LEVEL=info
FEATURE_FLAGS=...
```

### Error Handling
- **Validation errors** (400): Include field-level details
- **Authentication errors** (401): Generic message (don't leak user info)
- **Authorization errors** (403): Log attempt, return generic message
- **Not found** (404): Check org_id first (could be auth issue, not existence)
- **Server errors** (5xx): Log full details, return error_id to user for support reference

---

## Sensitive Operations Requiring Approval

These must have human review before auto-execution:

- [ ] Create/update commercial document (proposal, invoice)
- [ ] Record payment (requires reconciliation match)
- [ ] Sign contract
- [ ] Approve proposal with legal review
- [ ] Send outbound message/call to client
- [ ] Create/update financial journal entry
- [ ] AI agent making binding decision

Approval gates in database (`approvals` table) + audit log.

---

## Code Quality & Security

### TypeScript Strictness
```json
{
  "strict": true,
  "noImplicitAny": true,
  "noImplicitThis": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true
}
```

### Linting & Formatting
```bash
npm run lint        # ESLint + TypeScript strict
npm run format      # Prettier auto-fix
npm run type-check  # TypeScript compilation
```

### Security Checklist
- [ ] No hardcoded secrets or credentials
- [ ] SQL injection: Use parameterized queries
- [ ] XSS: Sanitize user input on frontend
- [ ] CSRF: Verify origin headers on state-changing requests
- [ ] RBAC: Check user permission + org membership on every mutation
- [ ] Rate limiting: Implement on public endpoints
- [ ] Dependency scanning: Run `npm audit` before merge

### OWASP Top 10 Considerations
1. **Broken Auth**: Use Floot + server-side session validation
2. **Broken Access Control**: org_id + role checks on every query
3. **SQL Injection**: Parameterized queries only
4. **XSS**: Input sanitization + CSP headers
5. **Insecure Deserialization**: Validate JSON schema
6. **Sensitive Data Exposure**: Encrypt at rest (Floot managed), TLS in transit
7. **XXE**: Disable XML parsing
8. **Broken Auth (again)**: API keys in Authorization header, not URL
9. **SSRF**: Validate redirect URLs
10. **Insufficient Logging**: Audit trail on sensitive ops

---

## Ownership & Approvals

| Area | Owner | Reviewers |
|------|-------|-----------|
| Architecture | Claude (architect) | Product owner (concept), Tech lead (implementation) |
| Database schema | Claude (data architect) | CTO / Tech lead |
| API contracts | Domain owner | Tech lead, security |
| Commercial features | Product owner | Finance, legal |
| AI/Agent behavior | AI architect | Product, security |
| Security patches | Security engineer | All domain owners |
| Deployment | DevOps + tech lead | CTO (production) |

---

## Handoff & Continuity

When handing work off or pausing:

1. Commit all changes to feature branch
2. Update relevant docs (ADR, ROADMAP, CHANGELOG)
3. Leave clear commit messages explaining next steps
4. Tag PR with milestone (Phase 0, Phase 1, etc.)
5. Update task status (in progress → ready for review)
6. Document any blockers or assumptions

When resuming:

1. Re-read ADR and DATA_MODEL
2. Review all PRs merged since pause
3. Check for schema changes affecting your domain
4. Pull latest main; rebase feature branch
5. Run full test suite before continuing

---

## Performance Targets

- **Page load** (p95): <2s (public website), <1s (Business OS)
- **API response** (p95): <200ms (simple queries), <1s (complex reports)
- **Database query** (p95): <50ms (indexed), <500ms (analytical)
- **Build time**: <5 minutes
- **Test suite**: <10 minutes full run

---

## Monitoring & Observability

### Logs
- Structured JSON logs (not plain text)
- Include: timestamp, level, service, context (org_id, user_id), message, error stack
- Retention: 30 days live, 1 year archive

### Metrics
- Endpoint response times
- Error rates by status code
- Database query performance (slow query log)
- Payment reconciliation accuracy
- AI agent quality (evaluations)
- Feature flag rollout %

### Alerts
- Error rate >5% for 5 minutes
- API latency p95 >1s
- Database connection pool near max
- Payment reconciliation failing
- Backup missing for 24+ hours

---

## Documentation Standards

Every PR should include updates to:

- [ ] README.md (if user-facing feature)
- [ ] ADR.md (if architectural decision)
- [ ] API docs (if new endpoint)
- [ ] Data model (if schema change)
- [ ] Deployment runbook (if ops change)
- [ ] CHANGELOG.md

No undocumented features make it to main.

---

## Rollback & Recovery

### Pre-Deployment Checklist
- [ ] Backup database (automated, but verify)
- [ ] Test rollback plan locally
- [ ] All tests passing
- [ ] Code review approved
- [ ] Feature flagged (if large change)
- [ ] Monitoring alerts active
- [ ] Team notified of deployment window

### Rollback Sequence
```bash
# 1. Identify issue (via logs/alerts)
# 2. Revert code change
git revert <commit-hash>
git push origin main

# 3. Database rollback (if schema change)
npm run db:rollback  # Runs down migration

# 4. Clear cache (if applicable)
# 5. Monitor for 30 minutes
# 6. Post-mortem: Why didn't tests catch this?
```

---

## Phase Gates

Each phase must complete **all criteria** before advancing:

### Phase 0 → Phase 1
- [ ] Architecture documented and approved
- [ ] Database schema finalized
- [ ] GitHub repo initialized with CI/CD
- [ ] Auth + org isolation working and tested
- [ ] Design system in place
- [ ] CLAUDE.md followed in first PR

### Phase 1 → Phase 2
- [ ] Public website + lead CRM integration complete and tested
- [ ] 50+ acceptance tests passing
- [ ] No critical security issues open
- [ ] Backup/recovery procedure documented and tested
- [ ] Team trained on deployment process

---

## Contact & Escalation

- **Technical blocker**: @claude (technical decisions)
- **Product clarification**: @owner (scope, requirements)
- **Security concern**: @security-team (alert immediately)
- **Deployment issue**: @devops (production access)

---

## References

- [Architecture Decision Record](./docs/ADR.md)
- [Data Model & ERD](./docs/DATA_MODEL.md)
- [Integration Registry](./docs/INTEGRATIONS.md)
- [Acceptance Tests](./docs/ACCEPTANCE_TESTS.md)
- [Deployment Runbook](./docs/DEPLOYMENT.md)
- [GitHub Org](https://github.com/EchoWaveAgency)

---

**Last reviewed**: 2026-10-16  
**Next review**: After Phase 1 completion

