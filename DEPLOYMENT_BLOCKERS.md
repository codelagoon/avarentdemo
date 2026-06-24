# DEPLOYMENT BLOCKERS

## Overview
This audit evaluates Avarent for immediate production deployment blockers.

## Critical (Must be fixed before deployment)

### 1. Missing Automated Fairness Telemetry (The Edge Function)
- **Description**: The platform successfully ingests `decision_events`, but there is no backend Cron or Edge Function calculating Population Stability Index (PSI) and Disparate Impact (SPD/AIR) asynchronously.
- **Risk**: The core value proposition of the platform (bias detection) is non-functional without this background job.
- **Impact**: Lenders will see an empty dashboard despite sending thousands of decisions.
- **Recommended Fix**: Build a Supabase Edge Function that runs on a schedule (pg_cron) to aggregate `decision_events` into `fairness_metrics` and trigger `fairness_alerts`.

### 2. Lack of Onboarding UI for API Keys
- **Description**: We built the `api_keys` database schema in AVA-20, but there is no UI for an Owner to generate, view, or revoke API keys.
- **Risk**: A lender cannot actually send data because they cannot obtain an API key.
- **Impact**: Zero integrations can occur.
- **Recommended Fix**: Build an "API Integrations" settings pane where users can click "Generate Key" and copy the token.

## High (Should be fixed before deployment)

### 3. Missing Onboarding Defaults (Hydration)
- **Description**: When a new company registers, their `tenant_settings` and `circuit_breakers` tables are empty.
- **Risk**: The app crashes or throws null references when expecting default fairness thresholds.
- **Impact**: Operational friction during customer onboarding.
- **Recommended Fix**: Create a Next.js API route or Supabase Postgres Trigger to seed default rows into these tables `after insert on companies`.

### 4. No Formal Email Notifications
- **Description**: When a `critical` fairness alert is generated, it only appears in the UI. 
- **Risk**: A CCO will not sit and stare at a dashboard all day. If they aren't emailed, the threat will go unnoticed, defeating the purpose of real-time monitoring.
- **Impact**: Failure of SLA/Regulatory response time.
- **Recommended Fix**: Integrate Resend or SendGrid to fire emails to users with the `Compliance Officer` or `Owner` role upon alert generation.

## Medium (Can be deferred)

### 5. Client-Side Hydration Mismatches
- **Description**: There are lingering React hydration warnings in the console due to rendering timestamps on the server that mismatch the client's timezone.
- **Risk**: Looks unprofessional, minor rendering jump.
- **Impact**: Purely cosmetic.
- **Recommended Fix**: Wrap timestamp components in a `useEffect` to ensure they only render on the client, or use `suppressHydrationWarning`.

### 6. Playwright E2E Tests Broken by Environment
- **Description**: The Docker environment is unstable on the local host, causing Playwright tests to fail to bootstrap.
- **Risk**: Future regressions might slip through if CI relies on this.
- **Impact**: Local development friction.
- **Recommended Fix**: Migrate Playwright tests to run against a hosted Supabase staging instance via GitHub Actions instead of relying on local Docker daemons.
