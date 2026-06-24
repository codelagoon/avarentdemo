# AVA-17 Gap Report

## Critical Findings
- **Split-Brain Persistence**: `companyService.ts` stores `ACTIVE_COMPANY_KEY` in `localStorage`, meaning the active tenant is determined locally rather than securely via an auth token/session. This causes a split-brain if the session expires or mismatches the local storage state.
- **Lack of Repository Abstraction**: There is no `repositories/` directory. Services (e.g., `altDataService.ts`, `ledgerService.ts`) are making raw Supabase queries mixed with domain logic.

## High Findings
- **Auth Bypass**: `login-signup.tsx` and `page.tsx` contain logic for `localStorage.getItem("avarent_auth") === "demo"`. This bypasses tenant isolation completely and runs the app in a pseudo-local mode.

## Medium Findings
- **Mock Implementations**: `src/data/mockData.ts` contains massive amounts of hardcoded data used by `threatService.ts`, `scenarioService.ts`, and `analyticsService.ts`. This indicates the system relies heavily on simulated data instead of real multi-tenant databases.

## Low Findings
- **LocalStorage Clutter**: UI preferences (theme) and API keys (NVIDIA, OpenRouter) are stored in `localStorage`. While API keys are technically functional this way, an enterprise application should manage these at the backend/tenant level.
