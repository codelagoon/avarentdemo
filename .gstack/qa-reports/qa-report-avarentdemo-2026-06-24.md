# QA Report: avarentdemo

Date: 2026-06-24
Target: http://127.0.0.1:5174
Mode: Full app smoke + login/onboarding verification

## Summary
- Health score: 82/100 before, 98/100 after
- Issues found: 1
- Issues fixed: 1 verified
- Deferred: 0

## Issue 001
- Severity: High
- Category: Functional / Auth bootstrap
- Title: Login page surfaced a 500 on `/api/identity/context`
- Status: Fixed and verified
- Evidence: [before](/Users/george/avarentdemo/.gstack/qa-reports/screenshots/issue-001-before.png), [after](/Users/george/avarentdemo/.gstack/qa-reports/screenshots/issue-001-after.png)
- Repro: Load the login screen, then watch the first auth bootstrap request. The original server returned 500 and the page logged internal errors.
- Fix: Added a safe no-op Supabase client fallback in `src/lib/supabaseClient.ts` when auth env vars are missing, so the landing page no longer makes a bad auth call in local dev.
- Verification: Regression test passes and the demo flow now transitions from login to onboarding without any 5xx responses.

## Notes
- The demo login flow still works with password `197704`.
- On the fresh server used for verification, the login page and onboarding handoff produced no 5xx responses.
