# ECHOWAVE ECOSYSTEM

**Egyptian Roots. Global Impact.**

A comprehensive business management and AI system for creative agencies, built on Claude + Floot with React/TypeScript and PostgreSQL.

## What is ECHOWAVE?

ECHOWAVE Ecosystem is a modular, multi-product platform for managing every aspect of a creative agency:

- **Public Website**: Lead capture and brand storytelling
- **Business OS**: CRM, sales proposals, project management, financial tracking
- **Client Portal**: Secure project collaboration and delivery tracking
- **HORUS AI Orchestrator**: Domain-specific agents for sales, content, strategy, and operations
- **Mobile Apps**: Admin, team, and client-facing applications
- **Communications Hub**: Voice, WhatsApp, Telegram, email integration
- **Financial System**: Multi-currency accounting with Egyptian tax readiness

## Phase 0: Foundation

This repository contains Phase 0 work (weeks 1-2 of development):

- ✅ GitHub repository initialization with CI/CD
- ✅ Project conventions (CLAUDE.md)
- ✅ Architecture decisions (docs/ADR.md)
- ✅ Database schema (docs/DATA_MODEL.md)
- ✅ Platform foundation (auth, RBAC, logging, error handling)
- 🚧 Floot project setup and database initialization
- 🚧 Design system components and tokens

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- Floot account (for backend/database)

### Local Development

```bash
# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Fill in DATABASE_URL, FLOOT_AUTH_SECRET, etc.

# Initialize database
npm run db:migrate

# Start development server
npm run dev
```

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm test:watch

# UI dashboard
npm test:ui

# Coverage report
npm test -- --coverage
```

### Code Quality

```bash
# Lint and format
npm run lint
npm run format

# Type checking
npm run type-check
```

## Project Structure

```
echowave-ecosystem/
├── docs/
│   ├── ADR.md                    # Architecture Decision Record
│   ├── DATA_MODEL.md             # Database schema & ERD
│   ├── RISKS_AND_BACKLOG.md      # Risk register & feature backlog
│   ├── INTEGRATIONS.md           # External service integrations
│   ├── ACCEPTANCE_TESTS.md       # Feature acceptance criteria
│   └── DEPLOYMENT.md             # Deployment runbook
├── apps/                         # Product applications
│   ├── website/                  # Public marketing site
│   ├── business-os/              # Admin dashboard
│   ├── client-portal/            # Client collaboration
│   └── mobile/                   # Mobile apps
├── domains/                      # Business domains (modular monolith)
│   ├── identity/                 # Users, orgs, RBAC
│   ├── crm/                      # Clients, contacts, leads
│   ├── sales/                    # Proposals, deals
│   ├── contracts/                # Legal agreements
│   ├── delivery/                 # Projects, tasks, deliverables
│   ├── finance/                  # Accounting, payments
│   ├── subscriptions/            # Recurring expenses
│   ├── communications/           # Channels, messages
│   ├── ai/                       # Horus agents
│   └── analytics/                # Reporting & insights
├── platform/                     # Cross-cutting concerns
│   ├── auth/                     # Authentication/Floot integration
│   ├── authorization/            # RBAC & access control
│   ├── database/                 # Connection pool, migrations
│   ├── events/                   # Event bus & outbox
│   ├── logging/                  # Structured logging & audit
│   ├── errors/                   # Error handling
│   ├── storage/                  # File storage
│   ├── scheduler/                # Job scheduling
│   └── security/                 # Security utilities
├── design-system/                # UI components & tokens
├── integrations/                 # External service adapters
├── tests/                        # Test suites
├── scripts/                      # Database & utility scripts
├── CLAUDE.md                     # Project conventions & rules
└── package.json

```

## Key Principles

1. **Real Implementation**: Every feature is testable code, not mockups
2. **Tenant Isolation**: `organization_id` on every query; zero data leakage
3. **Financial Consistency**: Journal entries, immutable posted documents
4. **Audit Everything**: Compliance-ready logging for sensitive operations
5. **Server-Side Security**: RBAC enforced on backend; never trust client
6. **Incremental Delivery**: Test and merge before advancing phases
7. **Portable Code**: GitHub is source of truth; exportable from Floot

## Documentation

- **[CLAUDE.md](./CLAUDE.md)**: Complete project conventions, branch naming, commit format, testing requirements
- **[docs/ADR.md](./docs/ADR.md)**: 10 architectural decisions with rationale and alternatives
- **[docs/DATA_MODEL.md](./docs/DATA_MODEL.md)**: PostgreSQL schema with 80+ tables, constraints, and migration strategy
- **[docs/RISKS_AND_BACKLOG.md](./docs/RISKS_AND_BACKLOG.md)**: Risk register and 7-phase feature backlog
- **[.github/CONTRIBUTING.md](./.github/CONTRIBUTING.md)**: Code review process and contribution guidelines

## Timeline

- **Phase 0** (2 weeks): Foundation, auth, RBAC, design system ← **Current**
- **Phase 1** (3 weeks): Public website, lead CRM
- **Phase 2** (2 weeks): Sales proposals, versioning, approvals
- **Phase 3** (3 weeks): Project management, deliverables
- **Phase 4** (3 weeks): Accounting, Egyptian tax readiness
- **Phase 5** (4 weeks): HORUS AI orchestrator, domain agents
- **Phase 6** (3 weeks): Mobile apps, security hardening
- **Phase 7** (4+ weeks): Advanced features, white-label portal

**MVP Target**: Phase 6 (~5 months from start)

## Technology Stack

- **Frontend**: React 18, TypeScript, TailwindCSS
- **Backend**: Floot endpoints (Node.js), Express
- **Database**: PostgreSQL 14+
- **Auth**: Floot Auth + custom RBAC
- **Testing**: Vitest, Playwright
- **CI/CD**: GitHub Actions
- **ORM**: Raw SQL with parameterized queries
- **Logging**: Pino (structured JSON)

## Support

- 📖 See [CLAUDE.md](./CLAUDE.md) for project rules and conventions
- 🏗️ See [docs/ADR.md](./docs/ADR.md) for architectural decisions
- 📊 See [docs/DATA_MODEL.md](./docs/DATA_MODEL.md) for database design
- 📋 See [.github/CONTRIBUTING.md](./.github/CONTRIBUTING.md) for contribution process

---

**Last Updated**: October 16, 2026  
**Status**: Phase 0 (Foundation)  
**License**: Proprietary (ECHOWAVE Agency)
