<!-- /autoplan restore point: /Users/george/.gstack/projects/codelagoon-avarentdemo/main-autoplan-restore-20260623-172149.md -->

# AVARENT Sentinel - Final Prototype Iteration Plan

## Current Status: Pre-Prototype Review
Based on comprehensive Playwright testing, the application is functional but needs refinement for a production-ready prototype.

---

## Phase 1: Critical Fixes (Priority: URGENT)

### 1.1 Login Overlay Bug
**Issue**: Login screen doesn't properly hide after authentication
**Test Evidence**: Screenshot test_08_after_fresh_login shows overlay persists
**Fix**: 
- Update `App.tsx` login state management
- Ensure `isAuthenticated` properly triggers re-render
- Add transition animation for smooth hide

### 1.2 Scenario Button Selector Reliability
**Issue**: Playwright couldn't find buttons by text/content
**Fix**:
- Add `data-testid` attributes to all interactive elements
- Standardize button selectors for automation

### 1.3 Console Warning Cleanup
**Current**: 0 errors, but check for warnings
**Action**: Run build and address all TypeScript warnings

---

## Phase 2: Feature Completeness (Priority: HIGH)

### 2.1 Fairness Drift Dashboard UI
**Status**: Service exists, UI partially integrated
**Needed**:
- Gauge chart for Parity Monitor (DPD display)
- Scatter plot for Accuracy-Fairness trade-off
- Real-time alert notification panel
- Historical trend visualization

### 2.2 Adverse Action Review Queue UI
**Status**: Service exists, no UI page
**Needed**:
- New page/route: `/adverse-action-review`
- Queue table with status (pending/approved/overridden/sent)
- Side-by-side SHAP + Narrative view
- Approve/Override workflow with reason capture
- Compliance Officer assignment

### 2.3 LDA Search UI
**Status**: Service exists, no UI integration
**Needed**:
- "Search for LDA" button in Settings or Analytics
- Results panel showing:
  - Current model metrics
  - Alternative model (if found)
  - Accuracy gap vs Fairness gain
  - Performance slack indicator
- Refutation Certificate generation/download

### 2.4 Audit Packet Generation UI
**Status**: Service exists, no UI button
**Needed**:
- "Generate Exam Package" button in Settings
- Progress indicator during compilation
- Download links for PDF attachments
- Email/share functionality

---

## Phase 3: UX Refinement (Priority: MEDIUM)

### 3.1 Responsive Design
**Current**: Desktop-focused
**Needed**:
- Mobile sidebar (hamburger menu)
- Stacked KPI cards on small screens
- Touch-friendly button sizes (min 44px)
- Responsive charts (recharts supports this)

### 3.2 Loading States
**Current**: Basic loading
**Needed**:
- Skeleton screens for data tables
- Progress bars for long operations
- Toast notifications for all actions
- Loading indicators on buttons

### 3.3 Empty States
**Current**: Not defined
**Needed**:
- Empty ledger message
- No threats found illustration
- First-time user onboarding hints

### 3.4 Accessibility (A11y)
**Current**: Basic
**Needed**:
- ARIA labels on all interactive elements
- Keyboard navigation (already has shortcuts 1-6)
- Focus indicators
- Color contrast audit (WCAG 2.1 AA)
- Screen reader testing

---

## Phase 4: Data & Integration (Priority: MEDIUM)

### 4.1 Real-time Updates
**Current**: Manual refresh
**Needed**:
- WebSocket or SSE for live ledger updates
- Real-time threat detection notifications
- Auto-refresh for fairness drift alerts

### 4.2 Export Functionality
**Current**: CSV export skeleton
**Needed**:
- CSV export implementation
- PDF generation for reports
- JSON export for API integration

### 4.3 Data Validation
**Current**: Basic TypeScript
**Needed**:
- Form validation (zod schema)
- Input sanitization
- Error boundary components

---

## Phase 5: Performance (Priority: LOW)

### 5.1 Code Splitting
**Current**: Single chunk (903KB)
**Needed**:
- Lazy load pages
- Dynamic imports for charts
- Separate vendor chunk

### 5.2 Memoization
**Current**: Limited
**Needed**:
- React.memo for table rows
- useMemo for expensive calculations
- useCallback for event handlers

### 5.3 Virtualization
**Current**: None
**Needed**:
- Virtualized lists for large ledgers
- Windowed rendering for long tables

---

## Phase 6: Documentation (Priority: LOW)

### 6.1 API Documentation
**Needed**:
- Service method documentation
- Type definitions
- Usage examples

### 6.2 User Guide
**Needed**:
- Feature walkthrough
- Keyboard shortcuts reference
- Compliance workflow guide

### 6.3 Deployment Guide
**Needed**:
- Environment setup
- Build instructions
- Configuration options

---

## Acceptance Criteria for Final Prototype

### Functional Requirements
- [ ] All 6 pages fully functional
- [ ] All 3 scenarios execute correctly
- [ ] Data persists across sessions (localStorage)
- [ ] No console errors
- [ ] TypeScript builds successfully

### UI Requirements
- [ ] Login overlay bug fixed
- [ ] All buttons have data-testid
- [ ] Responsive on mobile/tablet/desktop
- [ ] Loading states for all async operations
- [ ] Empty states for all data views

### Feature Requirements
- [ ] Fairness Drift Dashboard with gauge + scatter plot
- [ ] Adverse Action Review Queue page
- [ ] LDA Search with certificate generation
- [ ] Audit Packet generation button
- [ ] Real-time monitoring toggle

### Quality Requirements
- [ ] 0 TypeScript errors
- [ ] 0 ESLint warnings
- [ ] WCAG 2.1 AA accessibility
- [ ] <3s initial load time
- [ ] <500ms navigation time

---

## Testing Checklist for Final Prototype

### Automated Tests
- [ ] Login flow (valid/invalid password)
- [ ] All page navigation (1-6 shortcuts)
- [ ] All 3 scenarios execution
- [ ] Data persistence across refresh
- [ ] CSV export functionality
- [ ] Search/filter on all tables

### Manual Tests
- [ ] Mobile responsiveness
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Color contrast verification
- [ ] Touch target sizing

### Compliance Tests
- [ ] CFPB Circular 2023-03 adherence
- [ ] ECOA Regulation B requirements
- [ ] Fair Housing Act standards
- [ ] HMDA 2026 reporting readiness

---

## Estimated Timeline

| Phase | Duration | Priority |
|-------|----------|----------|
| 1 - Critical Fixes | 2 hours | URGENT |
| 2 - Feature Complete | 4 hours | HIGH |
| 3 - UX Refinement | 3 hours | MEDIUM |
| 4 - Data & Integration | 2 hours | MEDIUM |
| 5 - Performance | 1 hour | LOW |
| 6 - Documentation | 1 hour | LOW |
| **Total** | **13 hours** | - |

---

## Next Actions

1. **Fix login overlay bug** (30 min)
2. **Add data-testid attributes** (30 min)
3. **Create Fairness Drift Dashboard UI** (2 hours)
4. **Create Adverse Action Review page** (2 hours)
5. **Integrate LDA Search UI** (1 hour)
6. **Add Audit Packet button** (30 min)
7. **Final testing pass** (2 hours)

**Ready to proceed with Phase 1?**

---

## GSTACK REVIEW REPORT (/autoplan — 2026-06-23)

> **Critical finding:** This plan predates the Meridian refactor. It references `App.tsx`, `/adverse-action-review` routes, 6-page shortcuts, and Playwright tests that no longer exist. Current codebase is Next.js 16 + `AppShell` + 9 workflow views + WorkOS identity (AVA-19, uncommitted). Treat sections below as historical intent; execution must follow current architecture.

### Phase 1 — CEO Review (SELECTIVE EXPANSION)

**Premises (confirmed 2026-06-23):**
1. Product is **Meridian** (compliance dashboard), not legacy "AVARENT Sentinel" Vite app.
2. Navigation stays **single-page** (`activeWorkflow` state) — no new page routes like `/login`, `/investigations`, `/adverse-action-review`.
3. **UI polish first** (original premise C), then **minimal AVA-17 immediately after core workflow UI** — not fully deferred, not full-repo migration in one shot.

**Premise revision (interrogate):** User overrode full AVA-17 deferral. Minimal Supabase lands right after core workflow UI ships; full multi-repo migration remains phased.

**0A Premise challenge:** Phase 1.1 (login overlay) is obsolete — auth is WorkOS via `page.tsx` + `/api/auth/*`. Phase 2.2 (`/adverse-action-review` route) conflicts with architecture rules; adverse-action UX belongs in `investigations` or `documentation` workflows. Phase 4.1 (WebSockets) is premature before real backend.

**0B Existing code leverage:**
| Plan item | Current state |
|-----------|---------------|
| Fairness drift UI | Partial — `MonitoringPage`, `AnalysesPage` (AIR metrics) |
| Adverse action queue | Domain/services exist; no dedicated workflow view |
| LDA search | Service layer exists; not wired in Settings/Analyses |
| Audit packet | `DocumentationPage` + `auditPacketDomain` integrated |
| data-testid | Sparse — `AnalysesPage` has some; not standardized |
| Real-time updates | Not implemented; localStorage + `useLiveData` |

**0C Dream state:** CURRENT (localStorage demo) → THIS PLAN (full UI) → 12-MONTH (tenant-scoped Supabase + WorkOS prod + statistical analysis pipelines)

**Mode:** SELECTIVE EXPANSION — keep AVA-17 + workflow completion; defer mobile/WebSocket/perf/docs to TODOS.

**USER CHALLENGE (not auto-decided):** Plan says add `/adverse-action-review` as a Next route. Architecture rule and current `page.tsx` pattern forbid this. **Recommend:** add adverse-action queue as a panel/tab inside `investigations` or extend `documentation`.

### Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|----------|
| 1 | CEO | Defer Phases 4–6 (WebSocket, perf, docs) | Mechanical | P3 | No backend to stream; polish after AVA-17 | Ship now |
| 2 | CEO | Rewrite plan doc for Meridian | Mechanical | P1 | Plan references deleted files | Execute plan as-is |
| 3 | CEO | Skip Phase 1.1 login overlay fix | Mechanical | P4 | Replaced by WorkOS flow | Patch App.tsx |
| 4 | CEO | Adverse action in workflow, not route | User Challenge | P5 | Matches AppShell architecture | `/adverse-action-review` route |
| 5 | CEO | UI first, then minimal AVA-17 | Taste → **Approved override** | P1+P2 | Core UI demo-ready; tenant data follows immediately | Full AVA-17 defer OR big-bang migration |
| 6 | CEO | Defer mobile responsive (Phase 3.1) | Mechanical | P3 | Desktop dashboard primary | Mobile now |
| 7 | CEO | Keep data-testid push scoped to new work | Mechanical | P1 | Test IDs on touched components only | Repo-wide pass |

### NOT in scope (this iteration)
- WebSocket/SSE real-time ledger
- Code splitting / virtualization (Phase 5)
- User guide / deployment docs (Phase 6)
- WCAG full audit (defer until UI stabilizes)
- Legacy Vite/Playwright test restoration

### What already exists
- `AppShell`, `FloatingNav`, 9 workflow pages
- Domain layer + `useLiveData` + localStorage services
- WorkOS AuthKit + org onboarding (AVA-19, pending commit)
- gstack browse tooling (project-local install)

### Deferred to TODOS.md
- Mobile responsive pass
- WebSocket monitoring
- Full data-testid standardization
- LDA search UI in Settings
- Dedicated adverse-action review queue UI (within investigations)

---

*Phases 2–4 (Design, Eng, DX) and Final Approval Gate run after premise confirmation.*

### Phase 2 — Design Review (UI scope: yes)

**Scope completeness:** 6/10 — shell and workflows exist; missing states and several plan features.

| Dimension | Score | Auto-fix / decision |
|-----------|-------|---------------------|
| Information hierarchy | 7/10 | Command center → workflows clear; adverse-action queue needs dedicated queue panel in Investigations |
| Loading states | 5/10 | Spinner on identity load only; add skeletons to queue tables (P1) |
| Empty states | 4/10 | Add empty ledger / no-threats illustrations (P1) |
| Error states | 6/10 | Onboarding has inline errors; extend to async workflow actions |
| Responsive | 5/10 | Defer mobile hamburger (P3 — per TODOS) |
| Accessibility | 6/10 | `ViewportPage` testIds exist; add ARIA on queue actions incrementally |
| Specificity | 7/10 | Light dashboard theme (#FAFAFA) consistent; fairness gauges still generic |

**Taste:** Gauge vs scatter for fairness drift — recommend gauge on Monitoring overview + scatter on Analyses (P5).

### Phase 3 — Eng Review

**Architecture (ASCII):**
```
page.tsx (auth gate)
  └─ AppShell
       ├─ FloatingNav → activeWorkflow
       └─ WorkflowView → *Page components
            └─ domains/* + useLiveData → localStorage services
```

**Scope challenge:** No reduction. Blast radius for UI polish: `InvestigationsPage`, `MonitoringPage`, `AnalysesPage`, `SettingsPage`, `DocumentationPage`, shared `WorkflowQueuePanel`.

**Test diagram (gaps):**
| Flow | Coverage | Gap |
|------|----------|-----|
| WorkOS login → onboarding | Manual only | Add Playwright smoke in `tests/` |
| Workflow keyboard nav | None | data-testid + key nav test |
| Investigation queue actions | None | Unit test domain functions |
| Audit packet generate | Partial domain tests | UI integration test |

**Test plan artifact:** `~/.gstack/projects/codelagoon-avarentdemo/main-test-plan-20260623.md` (deferred write — eng checklist captured here)

**Failure modes:** localStorage loss on clear; multi-tenant isolation addressed by minimal AVA-17 after UI phase (ledger/investigations vertical first).

### Phase 3.5 — DX Review (skipped)

No developer-facing API/CLI scope in this iteration. Log: Phase 3.5 skipped.

### Approved implementation order (premise C + minimal AVA-17)

**Phase A — Core workflow UI** (human ~2 days / CC ~2–3 hours)

1. **Investigations** — adverse-action review queue panel (approve/override/reason), no new routes
2. **Monitoring** — parity gauge + trend chart (extend existing `MonitoringPanel`)
3. **Analyses** — LDA search entry + results panel
4. **Documentation** — surface "Generate Exam Package" CTA if not prominent
5. **Cross-cutting** — skeleton loaders, empty states, data-testid on touched controls
6. **Settings** — LDA shortcut if not in Analyses

**Phase B — Minimal AVA-17** (immediately after Phase A; human ~1–2 days / CC ~1–2 hours)

Scope: one vertical end-to-end, not full `SERVICE_TENANT_REQUIREMENTS` migration.

- Wire **investigations + ledger** to Supabase with `organization_id` from `IdentityContext` / `useTenantScope()`
- Implement `OrganizationScopedLedgerRepository` + threat reads for investigations workflow
- Add migration for any missing `company_id` columns; apply existing RLS patterns
- Keep localStorage as read-through fallback only during cutover (remove once stable)
- **Out of minimal scope:** monitoring metrics, audit packets, scenarios, full service matrix

**Still deferred (TODOS)**
- Full AVA-17 repo migration for remaining services
- WebSocket/SSE, mobile responsive, perf/docs phases

### Cross-phase theme

**Plan/code drift** — flagged in CEO and Eng. Mitigation: rename doc header to Meridian and track tasks in GitHub issues, not stale phase numbers.

---

## /autoplan Review Complete — **APPROVED** (2026-06-23)

Gate: A — UI polish then minimal AVA-17. Next step when ready: `/ship` after Phase A commits, or start Phase A implementation.
