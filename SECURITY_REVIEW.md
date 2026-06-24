# AVA-18 Security Review

**Date**: June 2026
**Target**: `avarentdemo` Authentication, Authorization, and Session Handling

## Audit Results

### 1. Authentication
- **Status**: ✅ **PASS**
- **Details**: The demo bypass logic (`const PASSWORD = "197704"`) was successfully scrubbed during AVA-17. The platform now strictly relies on Supabase Auth (WorkOS AuthKit architecture). Unauthenticated users are strictly routed to the `LoginCardSection`.

### 2. Authorization (Row Level Security)
- **Status**: ❌ **CRITICAL FAILURE**
- **Details**: As detailed in `RLS_AUDIT.md`, the database initialization scripts (`init_schema.sql` and `20260526000300_adt_decision_events.sql`) utilize `using (true)` policies. These open the entire database to public read/write access if the API URL and anon key are exposed. The attempt to fix `companies` in Phase 3 of AVA-17 failed because the old policies were not explicitly dropped, resulting in an `OR` bypass.

### 3. Tenant Context (Server-Side)
- **Status**: ❌ **CRITICAL VULNERABILITY**
- **Details**: As detailed in `TENANT_ISOLATION_REPORT.md`, `BaseRepository` relies on a shared Node.js singleton (`companyService.ts`) for deriving the tenant context. If `BaseRepository` is used in a Next.js Server Component or API route, the tenant context will bleed across concurrent user requests, resulting in catastrophic cross-tenant data exposure.

### 4. API Routes
- **Status**: ⚠️ **HIGH RISK**
- **Details**: `POST /api/v1/decisions` uses the `supabaseServiceKey` (Service Role Key) which completely bypasses RLS policies. It manually extracts the tenant via `Bearer` token string matching:
  ```typescript
  const companyId = authHeader.replace("Bearer ", "").trim()
  ```
  This is insecure because it assumes the bearer token is simply the UUID of the company, effectively creating an unauthenticated endpoint where anyone can insert data into any company's ledger if they can guess the UUID.

## Conclusion
The application is **NOT SECURE** for production use. The underlying architecture is sound for a Single-Page App, but the translation into a Server-Side Next.js application with Supabase requires a complete overhaul of how `tenantId` is injected (Dependency Injection rather than singletons) and a full rewrite of the PostgreSQL RLS policies.
