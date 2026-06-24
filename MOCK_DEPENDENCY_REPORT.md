# AVA-18 Mock Dependency Report

**Date**: June 2026
**Target**: `mockData.ts` references

## Findings

### Allowed (Testing/Demo Scope)
- `tests/avarent.spec.ts` (Playwright)
- `tests/login-context-regression.spec.ts` (Playwright)
- `src/services/scenarioService.ts` (Demo adversarial simulation engine)

### Not Allowed (Production Scope)
- `src/app/page.tsx` (`DAILY_STATS` used for hero metrics)
- `src/views/AnalyticsPage.tsx` (Charts)
- `src/views/DashboardPage.tsx` (Charts)
- `src/views/EvidenceLedgerPage.tsx` (`DATA_VOLUME` and `LedgerEventType`)
- `src/views/SettingsPage.tsx` (`DAILY_STATS`)
- `src/views/ThreatAnalysisPage.tsx` (`ThreatSeverity`)
- `src/views/AccessControlPage.tsx` (`USER_ROLES`)

## Remediation Strategy
Since we cannot redesign the domain model or create new architecture (per AVA-18 constraints), the fastest and safest way to eradicate `mockData.ts` from the UI without breaking the React rendering trees is to either:
1. Lift the types directly into the components that need them.
2. Replace hardcoded imported data with inline fallbacks (e.g. `const FAIRNESS_METRICS = []`) until the charts are fully wired to `DecisionRepository` in AVA-19.

We will proceed with substituting inline empty/default arrays for the chart data so that the platform functions correctly as a multi-tenant platform (showing 0 data for new tenants) rather than displaying fake data for everyone.
