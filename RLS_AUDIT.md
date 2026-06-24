# AVA-18 RLS Verification Audit

**Date**: June 2026
**Target**: Supabase `init_schema.sql` and subsequent migrations

This report audits the Row-Level Security (RLS) enforcement across all persistence tables to verify tenant isolation at the database layer.

## Audit Matrix

| Table | RLS Enabled | Policies Present | Strict Tenant Isolation? | Pass/Fail |
| ----- | ----------- | ---------------- | ------------------------ | --------- |
| `companies` | Yes | Yes | No (Overlapping `true` policy) | ❌ FAIL |
| `applicants` | Yes | Yes | No (`using (true)`) | ❌ FAIL |
| `feature_library` | Yes | Yes | No (`using (true)`) | ❌ FAIL |
| `threat_log` | Yes | Yes | No (`using (true)`) | ❌ FAIL |
| `adverse_actions` | Yes | Yes | No (`using (true)`) | ❌ FAIL |
| `ledger_events` | Yes | Yes | No (`using (true)`) | ❌ FAIL |
| `decision_events` | Yes | Yes | No (`using (true)`) | ❌ FAIL |
| `fairness_alerts` | Yes | No | N/A | ❌ FAIL |
| `fairness_metrics`| Yes | No | N/A | ❌ FAIL |

## Critical Security Vulnerabilities

1. **Permissive "Dev" Policies**: In `init_schema.sql` (Phase 1 of AVA-17) and `20260526000300_adt_decision_events.sql` (Phase 5a), policies were created with `using (true)` to facilitate rapid UI prototyping. Example:
   ```sql
   create policy "Allow access applicants by company" on applicants for all using (true);
   create policy "Allow full access for dev" on decision_events using (true);
   ```
   These policies effectively completely nullify RLS by granting global public access to all rows regardless of authentication state.

2. **Overlapping Policies on `companies`**: While `20260526000400_company_users.sql` successfully added strict policies like `using (owner_id = auth.uid())`, it failed to `DROP` the prior `using (true)` policies from `init_schema.sql`. Since Postgres evaluates multiple policies using logical `OR`, the strict policy is overridden by the permissive one.

3. **Missing Foreign-Key RLS Chains**: The tables containing compliance data (`decision_events`, `fairness_alerts`, etc.) do not restrict access based on the `companies.owner_id`. A secure RLS policy should look like this:
   ```sql
   create policy "Users can access their company's decisions" on decision_events
   using (
     company_id in (
       select id from companies where owner_id = auth.uid()
     )
   );
   ```
   Instead, they are globally accessible.

## Conclusion

**BLOCKER**. The platform fails the RLS audit entirely. While tenant isolation is enforced at the Application/Repository layer (see `TENANT_ISOLATION_REPORT.md`), the database layer is completely un-isolated. Any user with the Anon Key could query the Supabase REST API directly and dump the entire multi-tenant database.

To fix this, a new migration must be created that drops all `using (true)` policies and replaces them with strict `auth.uid()` checks against the `companies` table.
