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
