# AVARENT Sentinel - Compliance Officer Testing Guide

## Quick Start Test Flow

### 1. Access the Application
- **URL**: http://localhost:5173
- **Authentication**: Supabase email/password (register or sign in)
- **New organization**: Click "Register Organization" and complete signup, then the onboarding wizard

### 2. Login Options Test

#### Option A: Existing User Access
1. Enter your registered email and password
2. Click "Sign In"
3. Verify the Command Center dashboard loads

#### Option B: New Company Onboarding
1. Click "Register Organization" on the login page
2. Complete registration with email and password
3. Complete the onboarding wizard:
   - **Step 1**: Welcome screen with feature overview
   - **Step 2**: Company name, industry, size
   - **Step 3**: Email, phone, regulatory body (CFPB/OCC/FDIC)
   - **Step 4**: Lending products (Mortgage/Auto/Personal), compliance features
   - **Step 5**: Review & confirm, complete setup
3. Verify auto-login after onboarding

---

## Feature Tests by Section

### Dashboard Page (`/`)

#### KPI Cards (Top Row)
- [ ] **Models in Production**: Shows count (default: 3)
- [ ] **Audits Last 24h**: Shows count with trend
- [ ] **Data Points / Decision**: Shows 82 (+3 from last month) with accent
- [ ] **Fairness Score**: Percentage display
- [ ] **Open Incidents**: Alert badge if > 0

#### Demo Scenarios Bar
- [ ] Click **"Good Faith"**: No proxies detected, clean approval
- [ ] Click **"Mild Proxy"**: 1 proxy detected, intervention applied
- [ ] Click **"Bad Faith"**: 3 proxies, escalated to compliance

#### Red Team Console
For each scenario:
1. Select scenario from bar
2. Click **"Execute Adversarial Test"**
3. Observe:
   - Scanning animation (600ms)
   - Proxy detection warnings
   - Graph edge severing animation
   - Toast notifications
   - Ledger entry creation
4. Verify **data volume indicator**: "Using 82 data points for this decision"
5. Check tooltip on info icon shows optimal range (65-120)

#### Causal Graph Section
- [ ] Title shows: "Causal Graph — 82 features analyzed"
- [ ] Badge shows: "65–120 range" with tooltip
- [ ] Training data info: "Trained on 1.2M records | Monthly: 85K"
- [ ] Reset button clears severed edges

#### Evidence Feed (Right Panel)
- [ ] Shows 6 most recent ledger entries
- [ ] Each entry shows: applicant name, decision badge, timestamp
- [ ] Subtext: "Based on 82 features • X interventions applied"
- [ ] View All button links to Evidence Ledger page

---

### Evidence Ledger Page (`/ledger`)

#### Header Stats
- [ ] Total Entries count matches actual data
- [ ] Proofs Signed count
- [ ] Interventions count
- [ ] Avg Fairness percentage

#### Search & Filter
- [ ] Search by applicant name works
- [ ] Search by applicant ID works
- [ ] Filter by type (Decision/Intervention/Proof Signed/Alert)
- [ ] Sort by timestamp (asc/desc)
- [ ] Sort by fairness score

#### Table Features
- [ ] SHA-256 Chained badge visible
- [ ] Export CSV button downloads real data
- [ ] Hash chain verification (prev_hash links)
- [ ] Data volume info in header: "82 features per decision • 1.2M records"

---

### Threat Analysis Page (`/threats`)

#### Header Stats
- [ ] Critical threats count
- [ ] High/Medium/Low distribution
- [ ] Blocked vs Active counts
- [ ] Total events count

#### Heatmap
- [ ] 7x7 grid showing hourly threat patterns
- [ ] Color intensity matches event count
- [ ] Tooltip shows exact count on hover

#### Threat Table
- [ ] Filter by severity (Critical/High/Medium/Low)
- [ ] Filter by status (Blocked/Active)
- [ ] Search by applicant name or attack vector
- [ ] Model Score Distribution chart visible

---

### Analytics & Fairness Page (`/analytics`)

#### Charts
- [ ] **Approval Lift by Protected Group**: Bar chart with lift values
- [ ] **Proxy Detection Outcomes**: Stacked bar (Cleared/Flagged/Blocked)
- [ ] **Data Volume vs Accuracy & Fairness**: Line chart showing 82 as optimal
  - Badge: "82 optimal" with tooltip
  - Range info: "65–120 features • Trained on 1.2M records"

#### Fairness Metrics Table
- [ ] Disparate Impact by Protected Group
- [ ] All groups show DI Ratio ≥ 0.80 (CFPB compliant)
- [ ] Approval Lift column with TrendingUp icons
- [ ] HMDA 2026 badge visible

---

### Access Control Page (`/access`)

#### User Management
- [ ] 10 users displayed in table
- [ ] Role badges (Admin/Analyst/Officer/Viewer)
- [ ] MFA status icons
- [ ] Last access timestamps
- [ ] Status indicators (Active/Inactive)

#### Role Cards
- [ ] Compliance Officer role description
- [ ] Data Analyst permissions
- [ ] Risk Manager scope
- [ ] Auditor view-only access

---

### Settings Page (`/settings`)

#### Configuration
- [ ] Model Version display (FNB-FAIR-v4.2.1)
- [ ] Audit Retention: 7 Years (2555 days)
- [ ] Alert Threshold slider (default: 0.80)
- [ ] Fairness Drift Δ: 0.05

#### Compliance Badges
- [ ] CFPB badge
- [ ] HMDA 2026 badge
- [ ] ECOA Compliant badge
- [ ] OCC Regulated badge

#### System Actions
- [ ] Download System Logs (placeholder)
- [ ] Export Configuration (placeholder)
- [ ] Reset to Defaults confirmation modal

---

## Core AI/ML Features Verification

### 1. Two-Tower Decision Gateway
**Test**: Run any scenario in Red Team Console
**Expected**:
- Primary Score and Fairness Score both displayed
- Latency < 400ms shown
- Top 3 SHAP reasons listed
- If proxy detected: automatic severing

### 2. Circuit Breaker
**Test**: Not directly testable in UI, but verify:
- If fairness audit times out (>150ms), shows "Referral to Manual Underwriting"

### 3. SHAP Feature Attribution
**Test**: Check Evidence Feed after running scenario
**Expected**: Each entry shows top 3 features with contribution percentages

### 4. BIFSG Proxy Detection
**Test**: Run "Bad Faith" scenario
**Expected**: 
- Proxy variables detected
- Alert severity = Critical
- Recommended action = "SEVER"

### 5. Adverse Action Notice (for denials)
**Test**: Look for denied applications in ledger
**Expected**: 
- Behavioral specificity (not generic "poor credit")
- CFPB Circular 2023-03 compliant language
- Consumer rights section

### 6. Rashomon Set / LDA Search
**Test**: Not directly visible in UI, but underlying service active
**Location**: `/src/services/rashomonService.ts`

---

## Data Persistence Tests

### LocalStorage Verification
1. Open browser DevTools → Application → LocalStorage
2. Keys to verify:
   - `avarent_ledger_entries`
   - `avarent_threat_events`
   - `avarent_company`
   - `avarent_onboarding_complete`

### Cross-Session Persistence
1. Run a scenario (creates ledger entry)
2. Refresh page
3. Verify entry persists in Evidence Ledger
4. Check new entry appears in Threat Analysis

---

## Keyboard Shortcuts

- `1` → Dashboard
- `2` → Threat Analysis
- `3` → Evidence Ledger
- `4` → Analytics & Fairness
- `5` → Access Control
- `6` → Settings

---

## Expected Toast Notifications

When running scenarios, expect these toast messages:
- "Scanning application for proxy variables…"
- "1 proxy variable(s) detected!"
- "Severing: ZIP_CODE_INCOME_PROXY"
- "Application APPROVED — Fairness score: 94%"
- "Application ESCALATED — 3 proxy attack blocked"

---

## Error Scenarios

### Invalid Password
- Enter wrong password
- Verify red border and error message
- Verify error clears after 2 seconds

### Network Issues
- Disconnect network
- Try to access dashboard
- Verify graceful fallback (mock data loads)

---

## Performance Benchmarks

- **Initial Load**: < 2 seconds
- **Scenario Execution**: 2-3 seconds (with animations)
- **Page Navigation**: < 500ms
- **Search/Filter**: < 200ms

---

## Accessibility Checks

- [ ] Tab navigation works through all interactive elements
- [ ] Focus indicators visible
- [ ] ARIA labels on icons and buttons
- [ ] Color contrast meets WCAG 2.1 AA

---

## Mobile Responsive (if testing on mobile)

- [ ] Sidebar collapses to hamburger menu
- [ ] Cards stack vertically
- [ ] Font sizes readable
- [ ] Touch targets > 44px

---

## Test Completion Checklist

- [ ] All 6 pages accessible
- [ ] All 3 demo scenarios executed
- [ ] At least 5 ledger entries created
- [ ] CSV export tested
- [ ] All filters/sorts tested
- [ ] Onboarding flow completed (optional)
- [ ] No console errors
- [ ] No broken images or icons

---

## Reporting Issues

If you find a bug:
1. Screenshot the issue
2. Note the page URL
3. Check browser console for errors
4. Document steps to reproduce
5. Tag with priority (Critical/High/Medium/Low)

---

**Test Date**: ___________  
**Tester Name**: ___________  
**Overall Status**: ⬜ Pass / ⬜ Fail / ⬜ Partial
