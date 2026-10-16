# Contributing to ECHOWAVE ECOSYSTEM

Thank you for contributing to ECHOWAVE! Please follow these guidelines to ensure consistent, high-quality code.

## Branch Naming

```
feature/<domain>/<feature-name>    # New feature
fix/<issue-number>-<description>   # Bug fix
refactor/<area>                    # Code refactoring
docs/<topic>                       # Documentation
chore/<task>                       # Maintenance tasks
```

Examples:
- `feature/sales/proposal-versioning`
- `fix/123-client-isolation-check`
- `refactor/database-queries`
- `docs/api-contracts`

## Commit Messages

Follow the conventional commit format:

```
<type>(<domain>): <subject>

<body describing the change in detail>

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

## Code Review Process

1. Create a pull request from your feature branch
2. Ensure all tests pass locally (`npm test`)
3. Run linting (`npm run lint`)
4. Request review (minimum 1 for features, 2 for platform changes)
5. Address all review comments
6. CI must be green before merge
7. Squash or rebase before merge (no merge commits)

## Testing Requirements

- **Unit tests**: Cover domain logic, >80% coverage
- **Integration tests**: Test API endpoints with real DB
- **E2E tests**: Smoke tests on staging after deploy
- **Security tests**: RBAC enforcement, SQL injection tests

Run all tests locally:
```bash
npm test
```

## Code Quality Standards

### TypeScript
- Strict mode enabled: `noImplicitAny`, `strictNullChecks`, etc.
- No `any` types without explicit `// @ts-ignore` comments with reason
- All public functions must have JSDoc comments

### Formatting
```bash
npm run format      # Auto-fix formatting
npm run lint        # Check for issues
npm run type-check  # TypeScript compilation
```

### Database Changes

If your change includes schema modifications:

1. Create a migration file: `scripts/db/migrations/YYYYMMDD_HHMMSS_description.ts`
2. Include both forward (up) and rollback (down) migrations
3. Test rollback before submitting PR
4. Never edit previous migrations

## Sensitive Operations

These operations require human review in code:

- Create/update commercial document (proposal, invoice)
- Record payment (requires reconciliation match)
- Sign contract
- Approve proposal with legal review
- Send outbound message/call to client
- Create/update financial journal entry
- AI agent making binding decision

Always add approval gates in code and audit logs.

## Security Checklist

Before committing:

- [ ] No hardcoded secrets or credentials
- [ ] SQL: Use parameterized queries only
- [ ] XSS: Sanitize user input on frontend
- [ ] CSRF: Verify origin headers on mutations
- [ ] RBAC: Check user permission + org membership on every mutation
- [ ] Rate limiting: Implemented on public endpoints
- [ ] `npm audit` passes (moderate severity threshold)

## Environment Variables

Never commit `.env` files. Use `.env.example` with safe defaults:

```bash
# .env.example
DATABASE_URL=postgresql://user:pass@localhost/echowave
FLOOT_AUTH_SECRET=your_secret_here
JWT_SECRET=your_secret_here
```

## Documentation

Every PR should update relevant docs:

- [ ] README.md (if user-facing feature)
- [ ] docs/ADR.md (if architectural decision)
- [ ] docs/DATA_MODEL.md (if schema change)
- [ ] API docs (if new endpoint)

## Questions?

- Check [CLAUDE.md](../CLAUDE.md) for full project conventions
- Review [docs/ADR.md](../docs/ADR.md) for architecture decisions
- See [docs/DATA_MODEL.md](../docs/DATA_MODEL.md) for database schema
