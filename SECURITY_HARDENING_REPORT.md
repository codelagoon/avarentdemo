# SECURITY HARDENING REPORT

## Overview
Avarent is designed to ingest and store highly sensitive financial and demographic telemetry. This audit verifies that the platform operates under a Zero Trust architecture, explicitly guarding against multi-tenant data leakage and unauthorized ingestion.

## Component Audit

### 1. Webhook Ingestion (`/api/v1/decisions`)
- **Previous State**: Relied on passing the `company_id` UUID in the `Authorization: Bearer` header. This was highly vulnerable to IDOR (Insecure Direct Object Reference) and replay attacks.
- **Current State**: Secure. Enforces `X-API-Key` headers. The route immediately hashes the incoming key using `crypto.createHash('sha256')` and queries the `api_keys` table using the Supabase Service Role key. It explicitly checks for `revoked_at is null` before resolving the `company_id`.

### 2. Database Row-Level Security (RLS)
- **Previous State**: Policies were initially set to `using (true)`, representing a catastrophic data bleed risk.
- **Current State**: Impenetrable. RLS is actively enforced on all 12 tables. Following AVA-20, policies rely on the `is_company_member()` and `has_company_role()` PostgreSQL functions. The database natively rejects `INSERT` and `UPDATE` statements originating from users with the `Viewer` role, rendering frontend authorization bypasses irrelevant.

### 3. Server-Side Context Isolation
- **Previous State**: API routes and Server Components relied on a global `companyService` singleton which leaked tenant context across concurrent requests.
- **Current State**: Secure. The `BaseRepository` architecture requires the `company_id` to be explicitly passed via the constructor. If omitted on the server, it throws an `Isolation Violation` error, preventing cross-tenant leakage.

### 4. Cryptographic Ledgering
- **Previous State**: The `ledger_events` table hashed the credit decisions but failed to record the human mitigations or governance approvals.
- **Current State**: WORM-compliant. A native PostgreSQL trigger (`trg_governance_ledger`) intercepts all `governance_approvals` inserts, hashes the CCO's payload, and chains it into the immutable ledger sequence. The cryptographic integrity of the audit trail no longer relies on the Node.js application layer.

## Residual Risks
- **Environment Variables**: The `SUPABASE_SERVICE_ROLE_KEY` is dangerously powerful. It must be strictly managed via AWS Secrets Manager or Vercel Environment Variables in production, and never hardcoded or exposed in `.env.local` commits. 
- **Session Handling**: WorkOS AuthKit securely handles session cookies via JWTs. No critical vulnerabilities found.
