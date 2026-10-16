# Acceptance Tests — ECHOWAVE Ecosystem

**Purpose**: Define acceptance criteria for each phase and track test coverage.

---

## Phase 0: Foundation ✅ COMPLETE

### Gate Criteria
- [x] Architecture documented and approved
- [x] Database schema finalized
- [x] GitHub repo initialized with CI/CD
- [x] Auth + org isolation working and tested
- [x] Design system in place
- [x] CLAUDE.md followed in first PR

### Test Coverage
- 20+ unit tests for identity services (UserService, OrganizationService)
- Database migration tests (forward and rollback)
- RBAC enforcement tests
- Validation utilities test suite
- Design system component tests

**Result**: All Phase 0 tests passing. Foundation ready.

---

## Phase 1: Lead Capture & CRM 🚧 IN PROGRESS

**Timeline**: 3 weeks (lead capture, CRM, contacts)  
**Test Target**: 50+ acceptance tests passing

### Epic 1: Public Website (1 week)
- [ ] Marketing pages (home, services, portfolio)
- [ ] Lead capture form with validation
- [ ] Email notification on lead submission
- [ ] CAPTCHA integration
- [ ] Form submission tracking

**Acceptance Tests** (12 tests)
1. ✅ Lead creation from website form with required fields
2. ✅ Email format validation on submission
3. ✅ Phone number format validation
4. ✅ Service interest selection tracked
5. ✅ Lead source set to "website"
6. ✅ Form submission success response
7. ✅ Validation error messages displayed
8. ✅ Required field indication in UI
9. ✅ Form reset after successful submission
10. ✅ Email notification triggered on lead creation
11. ✅ CAPTCHA validated before submission
12. ✅ Duplicate email detection (opt-in vs spam)

### Epic 2: Lead Management (1 week)
- [ ] Store leads in CRM
- [ ] Lead detail view and dashboard
- [ ] Status workflow (new → contacted → qualified → rejected)
- [ ] Bulk import leads from CSV
- [ ] Lead search and filters

**Acceptance Tests** (18 tests)
1. ✅ Lead creation via API (POST /leads)
2. ✅ Retrieve single lead (GET /leads/{id})
3. ✅ List all leads with pagination
4. ✅ Filter leads by status
5. ✅ Filter leads by source
6. ✅ Search leads by name
7. ✅ Search leads by email
8. ✅ Update lead status to "contacted"
9. ✅ Update lead status to "qualified"
10. ✅ Update lead status to "rejected"
11. ✅ Add notes to lead
12. ✅ Track last contacted timestamp
13. ✅ Lead scoring mechanism
14. ✅ Bulk import leads from CSV
15. ✅ Validate CSV format before import
16. ✅ Lead statistics by status
17. ✅ Lead statistics by source
18. ✅ Export leads to CSV

### Epic 3: Contact Management (1 week)
- [ ] Contact CRUD (create, read, update, delete)
- [ ] Attach contacts to leads
- [ ] Communication history tracking
- [ ] Consent preferences (email, phone, SMS)
- [ ] Contact search and filters

**Acceptance Tests** (20 tests)
1. ✅ Create contact with required fields
2. ✅ Validate first name required
3. ✅ Validate last name required
4. ✅ Validate email format
5. ✅ Validate phone format
6. ✅ Retrieve single contact
7. ✅ List all contacts with pagination
8. ✅ Search contacts by name
9. ✅ Search contacts by email
10. ✅ Update contact details
11. ✅ Update contact address
12. ✅ Update contact consent preferences
13. ✅ Track marketing consent
14. ✅ Track email consent
15. ✅ Track phone consent
16. ✅ Add communication history entry
17. ✅ View communication history
18. ✅ Attach contact to lead
19. ✅ Soft delete contact
20. ✅ Count contacts by organization

### Phase 1 Gate Criteria
- [ ] All 50+ acceptance tests passing
- [ ] Website live with working lead capture form
- [ ] CRM stores 100+ leads successfully
- [ ] Lead-Contact-Opportunity relationships working
- [ ] No critical security issues (org isolation tested)
- [ ] Backup/recovery procedure tested
- [ ] Team trained on lead workflow

---

## Phase 2: Sales & Proposals 📋 PLANNED

**Timeline**: 2 weeks

### Test Target: 40+ tests

**Key Acceptance Tests**
1. Service catalog creation and management
2. Proposal creation from service catalog
3. Proposal versioning (immutable history)
4. PDF export of proposals
5. Client-facing proposal portal
6. Internal approval workflow
7. Proposal status tracking
8. Line item customization
9. Discount application
10. Proposal locking after approval

---

## Phase 3: Project Management 📅 PLANNED

**Timeline**: 3 weeks

### Test Target: 45+ tests

**Key Acceptance Tests**
1. Project creation with client
2. Project phase definitions
3. Task creation and assignment
4. Task dependencies
5. Progress tracking (% complete)
6. Deliverable submission
7. Deliverable approval workflow
8. Timeline view
9. Team member access control
10. Client visibility settings

---

## Phase 4: Accounting & Egyptian Tax 💰 PLANNED

**Timeline**: 3 weeks

### Test Target: 35+ tests

**Key Acceptance Tests**
1. Journal entry creation (balanced debit/credit)
2. Account chart of accounts setup
3. Payment recording and reconciliation
4. Financial statement generation (P&L, balance sheet)
5. Trial balance calculation
6. Tax invoice generation
7. Egyptian registration tracking
8. Tax ID assignment
9. Compliance task tracking
10. Financial reporting

---

## Phase 5: AI & Orchestration 🤖 PLANNED

**Timeline**: 4 weeks

### Test Target: 50+ tests

**Key Acceptance Tests**
1. Agent definition and routing
2. Tool registry functionality
3. Approval gate system
4. Sales agent proposal generation
5. Finance agent payment recording
6. Project agent task creation
7. Writer agent content generation
8. Brand voice enforcement
9. Voice transcription and routing
10. Evaluation dataset quality metrics

---

## Phase 6: Mobile & Hardening 📱 PLANNED

**Timeline**: 3 weeks

### Test Target: 60+ tests

**Key Acceptance Tests**
1. Admin app project status view
2. Admin app payment approvals
3. Team app task updates
4. Team app time tracking
5. Client app proposal view
6. Client app deliverable access
7. Security audit findings remediated
8. Penetration testing results
9. SSL/TLS verification
10. Backup and recovery drill successful

---

## Cumulative Test Targets

| Phase | Target Tests | Cumulative |
|-------|---|---|
| Phase 0 | 20+ | 20+ |
| Phase 1 | 50+ | 70+ |
| Phase 2 | 40+ | 110+ |
| Phase 3 | 45+ | 155+ |
| Phase 4 | 35+ | 190+ |
| Phase 5 | 50+ | 240+ |
| Phase 6 | 60+ | 300+ |

---

## Testing Strategy

### Unit Tests (80%+ coverage)
- Domain service logic
- Validation utilities
- Business calculations
- Error handling

### Integration Tests (50%+ coverage)
- Database operations
- API endpoints
- Cross-domain interactions
- Transaction handling

### E2E/Acceptance Tests
- Complete user workflows
- Multi-step processes
- Real API interactions
- Authentication flows

### Security Tests
- SQL injection prevention
- XSS prevention
- CSRF protection
- RBAC enforcement
- Tenant isolation

### Performance Tests
- Load testing (100+ concurrent users)
- Database query optimization
- API response time targets
- Cache effectiveness

---

## Test Execution

### Local Development
```bash
npm test                    # Unit + integration tests
npm run test:e2e          # E2E acceptance tests
npm run test:coverage     # Coverage report
```

### CI/CD Pipeline
```yaml
- Lint (ESLint, Prettier)
- Type check (TypeScript)
- Unit tests (Vitest)
- Integration tests
- Security scan (SAST)
- E2E tests (if needed)
```

### Gate Before Merge
- [ ] All tests passing
- [ ] Coverage ≥ 80% (new code)
- [ ] No lint errors
- [ ] No security issues
- [ ] Approved by ≥1 reviewer

---

## Test Maintenance

- Review and update tests with each feature
- Keep acceptance tests in sync with requirements
- Refactor tests if implementation patterns change
- Archive old phase tests as reference
- Document flaky tests and root causes

---

**Last Updated**: 2026-10-16  
**Next Review**: Phase 1 completion
