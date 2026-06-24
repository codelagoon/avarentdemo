# Architecture Audit

## Current Architecture
The current architecture is a React frontend built with Vite (but transitioning to Next.js App Router). It leverages Supabase for persistence and edge functions (e.g., `api/v1/decisions`), but still retains many elements of a local, client-heavy "demo" architecture. There is a mix of `App.tsx` (Vite) and `app/page.tsx` (Next.js). WorkOS/AuthKit is mentioned in the design but not fully implemented across all routes, as demo bypass auth logic exists (`avarent_auth=demo`). The domain-driven repository pattern is largely missing; data flows directly from React components and UI hooks into singleton services (`services/*.ts`).

## Data Flow
- **UI to Service**: Components call singleton services (e.g., `companyService.ts`, `ledgerService.ts`).
- **Service to Store**: Services interact with Supabase (e.g., `tenant_settings`, `decision_events`) but some still fall back to `mockData.ts` or `localStorage` for certain state.
- **Real-time**: Real-time subscriptions are missing or simulated via a local event emitter (`emit("...")`).

## Auth Flow
- Some components have a demo login bypass logic that sets `localStorage.getItem("avarent_auth") === "demo"`.
- Production AuthKit integration exists conceptually but is circumvented in demo mode.

## Persistence Flow
- Heavy reliance on `localStorage` for API keys, tenant scope (`ACTIVE_COMPANY_KEY`), and onboarding state.
- Slowly migrating to Supabase (`tenant_settings`, `decision_events`, `rashomon_models`).

## Tenant Flow
- `companyService.ts` dictates tenant scope but stores the active `company_id` in `localStorage`. 
- Some database queries properly enforce Row Level Security, but client-side services often manage tenant boundaries manually.

## Repository Usage
- **None/Incomplete**. The repository pattern (e.g., `repositories/`) does not exist. Services act as direct data access objects mixed with domain logic.

## Dead/Legacy Code
- `App.tsx` and `main.tsx` (Vite) are clashing with `src/app/` (Next.js).
- Heavy reliance on `src/data/mockData.ts` for demo scenarios.
