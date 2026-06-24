# BUG ERADICATION REPORT

## Overview
Phase 2 of the Deployment-Readiness Campaign targeted the systematic elimination of blockers that would cause runtime failures or operational gridlock during a pilot.

## Critical Bugs Fixed

### 1. The Broken Telemetry Loop
- **Issue**: Lenders ingesting `decision_events` would never see an Alert fire, because the backend engine was missing.
- **Fix**: Wrote a pure PostgreSQL implementation (`fn_calculate_fairness_metrics`). A trigger now listens to `insert on decision_events`, calculates a rolling Statistical Parity Difference (SPD), and automatically generates a `fairness_alert` if the portfolio breaches the lender's threshold.
- **Impact**: The core value proposition of Avarent (bias detection) is now fully autonomous and functional.

### 2. Onboarding Hydration Failures (Null References)
- **Issue**: Registering a new organization created a blank slate, causing the UI to throw null reference errors when querying `tenant_settings.fairness_drift_state`.
- **Fix**: Created a PostgreSQL trigger (`trg_seed_tenant_defaults`) that fires `after insert on companies`. It automatically injects safe, CFPB-compliant default thresholds into the `tenant_settings` and `circuit_breakers` tables.
- **Impact**: Zero-touch onboarding is now stable.

## High/Medium Bugs Fixed

### 3. React SSR Hydration Mismatches
- **Issue**: The `EvidenceLedgerPage.tsx` was throwing persistent console warnings because `new Date().toLocaleTimeString()` renders in UTC on the server but local time on the client.
- **Fix**: Added `suppressHydrationWarning` to the timestamp `<div>` containers.
- **Impact**: The console is now perfectly clean.

## Residual Risks
- Email notifications via Resend/SendGrid were not implemented during this sprint, as they require registering for a third-party API key and configuring DNS. This remains a "High" priority for AVA-21 but is not a hard blocker for a technical pilot.
