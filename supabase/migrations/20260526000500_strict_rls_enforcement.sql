-- AVA-18 SWEEP 1: Strict RLS Enforcement
-- Drops all permissive `using (true)` policies from previous prototyping phases
-- Enforces tenant isolation via `owner_id = auth.uid()`

-- 1. COMPANIES
drop policy if exists "Allow read companies" on companies;
drop policy if exists "Allow modify companies" on companies;

-- Companies policies were already partially fixed in 20260526000400_company_users.sql, 
-- but we ensure they remain the only active policies.

-- 2. APPLICANTS
drop policy if exists "Allow access applicants by company" on applicants;

create policy "Users can access their company applicants" on applicants
for all using (
  company_id in (select id from companies where owner_id = auth.uid())
);

-- 3. FEATURE LIBRARY
drop policy if exists "Allow access feature_library by company" on feature_library;

create policy "Users can access their company feature_library" on feature_library
for all using (
  company_id in (select id from companies where owner_id = auth.uid())
);

-- 4. THREAT LOG
drop policy if exists "Allow access threat_log by company" on threat_log;

create policy "Users can access their company threat_log" on threat_log
for all using (
  company_id in (select id from companies where owner_id = auth.uid())
);

-- 5. ADVERSE ACTIONS
drop policy if exists "Allow access adverse_actions by company" on adverse_actions;

create policy "Users can access their company adverse_actions" on adverse_actions
for all using (
  company_id in (select id from companies where owner_id = auth.uid())
);

-- 6. LEDGER EVENTS
drop policy if exists "Allow access ledger_events by company" on ledger_events;

create policy "Users can access their company ledger_events" on ledger_events
for all using (
  company_id in (select id from companies where owner_id = auth.uid())
);

-- 7. FAIRNESS ALERTS, METRICS, CIRCUIT BREAKERS, RASHOMON MODELS, TENANT SETTINGS
drop policy if exists "Allow access fairness_alerts by company" on fairness_alerts;
drop policy if exists "Allow access fairness_metrics by company" on fairness_metrics;
drop policy if exists "Allow access circuit_breakers by company" on circuit_breakers;
drop policy if exists "Allow access rashomon_models by company" on rashomon_models;
drop policy if exists "Allow access tenant_settings by company" on tenant_settings;

create policy "Users can access their company fairness_alerts" on fairness_alerts
for all using (
  company_id in (select id from companies where owner_id = auth.uid())
);

create policy "Users can access their company fairness_metrics" on fairness_metrics
for all using (
  company_id in (select id from companies where owner_id = auth.uid())
);

create policy "Users can access their company circuit_breakers" on circuit_breakers
for all using (
  company_id in (select id from companies where owner_id = auth.uid())
);

create policy "Users can access their company rashomon_models" on rashomon_models
for all using (
  company_id in (select id from companies where owner_id = auth.uid())
);

create policy "Users can access their company tenant_settings" on tenant_settings
for all using (
  company_id in (select id from companies where owner_id = auth.uid())
);

-- 8. DECISION EVENTS
drop policy if exists "Allow full access for dev" on decision_events;

create policy "Users can access their company decision_events" on decision_events
for all using (
  company_id in (select id from companies where owner_id = auth.uid())
);

-- 9. BISG CACHE
drop policy if exists "Allow read and write on bisg_cache" on bisg_cache;

create policy "Authenticated users can access bisg_cache" on bisg_cache
for all using (
  auth.role() = 'authenticated'
);
