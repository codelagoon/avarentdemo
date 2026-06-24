# AVA-18 Onboarding Validation Report

**Date**: June 2026
**Target**: Supabase Auth + Company Service Onboarding Flow

## Environment Status
**BLOCKER**: Due to the local Docker daemon failure, live programmatic simulation of the onboarding flow against the Supabase local container (`http://localhost:54321`) could not be executed. This report relies on architectural tracing of the onboarding paths.

## Onboarding Flow Trace

The onboarding flow was traced through `login-signup.tsx` and `companyService.ts`.

### 1. Create Account
- **Action**: User submits email/password via `supabase.auth.signUp()`.
- **Status**: ✅ Code path is correct.

### 2. Create Organization
- **Action**: User is redirected to `/onboarding`. User submits company details.
- **Status**: ⚠️ **Risk**. The API calls `companyService.create(data)`.

### 3. Persist Organization
- **Action**: `companyService.create()` calls `supabase.from("companies").insert({ ...data, owner_id: currentUserId })`.
- **Status**: ✅ The company is securely tied to the user's `auth.uid()`.

### 4. Create Records / Hydrate
- **Action**: After onboarding, the UI expects metrics.
- **Status**: ❌ **Failure Point**. There is no initial hydration trigger for new companies. They will land on an empty dashboard. Because the platform relies heavily on background ML models generating `decision_events` and `fairness_alerts`, a newly onboarded tenant will see a broken or completely blank state until data flows via the API.

### 5. Refresh / Logout / Login
- **Action**: `companyService.ts` listens to `supabase.auth.onAuthStateChange`.
- **Status**: ✅ When the user logs back in, `companyService.fetchUserCompany()` retrieves the company using `.eq("owner_id", this.currentUserId)`.

## Conclusion
The onboarding flow is functionally wired to Supabase Auth and the `companies` table. However, it fails the "Production Readiness" test because new tenants are not hydrated with default configurations, threshold limits, or dummy initial state, resulting in a likely poor "Day 1" UX. This requires a dedicated onboarding hydration service in AVA-19.
