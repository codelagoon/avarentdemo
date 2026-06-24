# Security Observability Foundation (Phase 1.5)

## Implemented

### Authentication event logging (`src/lib/security/auth-events.ts`)

Structured auth events emitted on:
- `auth.sign_in.success` / `auth.sign_in.failure`
- `auth.sign_up.success` / `auth.sign_up.failure`
- `auth.sign_out`
- `auth.session.expired`
- `auth.access.denied`

Events log to stdout in production (type + userId). Full JSON in development.

### Middleware session refresh (`src/middleware.ts`)

- Refreshes Supabase session cookies on every matched request
- Blocks unauthenticated access to `/api/*` (except Inngest, which uses its own signing key)
- Logs `auth.access.denied` on blocked API access

## Phase 2 recommendations

| Control | Implementation |
|---------|----------------|
| Durable auth audit log | Insert auth events into `ledger_events` or dedicated `security_audit_log` table via server action |
| Failed login rate limiting | Supabase Auth rate limits + optional Upstash/Vercel KV counter |
| Session anomaly detection | Monitor `auth.session.expired` frequency per user |
| Access logging for RLS denials | Postgres `log_statement` or Supabase Log Explorer |
| Security monitoring | Route stdout auth events to Datadog/Sentry in Vercel log drain |
| Inngest job audit | Log companyId + userId on each event dispatch |

## Not added (by design)

- Enterprise SIEM integration
- Third-party observability SDKs
- PII in log payloads (email logged only on auth events in dev)
