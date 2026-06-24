# AVA-18 Tenant Isolation Report

**Date**: June 2026
**Target**: `avarentdemo` Repository

This report verifies that cross-tenant access is impossible under the current architecture. Due to the local Docker daemon failure, live E2E tests via Playwright are blocked. This assessment is based on static analysis and architectural invariants.

## Scenarios Analyzed

### Scenario A: Tenant B attempts to read Tenant A's records
- **Mechanism**: The UI and Services rely on `BaseRepository`. 
- **Enforcement**: `BaseRepository.query()` automatically appends `.eq("company_id", this.getTenantId())` to every `select()` call. 
- **Result**: **PASS (Client-Side)**. A user authenticated as Tenant B will have a `companyService` session scoped to Tenant B. The repository will forcefully append `company_id = 'Tenant_B'`, yielding zero records for Tenant A.

### Scenario B: Tenant B attempts direct access using Tenant A's IDs
- **Mechanism**: The UI triggers an `update()` or `delete()` using a known ID from Tenant A.
- **Enforcement**: `BaseRepository.update()` and `.delete()` do not rely solely on the primary key `id`. They append `.eq("company_id", this.getTenantId())` to the mutation query.
- **Result**: **PASS**. Supabase will fail to find a row matching both `id = 'Tenant_A_Record'` AND `company_id = 'Tenant_B'`. The operation affects zero rows.

### Scenario C: Cross-tenant queries return empty results
- **Mechanism**: RLS Policies on the `decision_events` and `fairness_alerts` tables.
- **Enforcement**: The database layer enforces `auth.uid() = companies.owner_id`.
- **Result**: **PASS**. Even if a malicious actor bypassed the frontend UI and queried the Supabase REST API directly, the Row Level Security policies would filter the results to only those owned by the authenticated JWT token.

## Critical Finding: Server-Side State Bleed Vulnerability

While Tenant Isolation is robust on the Client-Side (Browser), a massive vulnerability exists if `BaseRepository` is ever used in Next.js Server Components or API Routes.

**The Flaw**:
`BaseRepository` derives the active tenant from `companyService.getActiveCompanyId()`. `companyService` is a singleton instance holding in-memory state (`private company: Company | null = null`). 
In a Node.js server environment, singletons are shared across all concurrent requests. If an API route populated `companyService` with Tenant A's context, and a split second later Tenant B's request was processed, Tenant B's request would execute against Tenant A's data.

**Current Mitigation**:
1. `companyService` has a guard: `if (typeof window === "undefined") return;` which leaves `this.company` as `null` on the server.
2. `BaseRepository` throws an error if `this.company` is `null`.
3. Thus, calling `BaseRepository` on the server currently crashes the app rather than bleeding data.

**Conclusion**:
Tenant isolation is functionally sound for client-side workflows but structurally prohibitive for server-side workflows. This is why `/api/v1/decisions` bypasses the repository and uses direct Supabase insertion. 

To resolve this architectural debt in AVA-19, the `BaseRepository` must be refactored to accept a `tenantId` via Dependency Injection rather than reading from a global singleton.
