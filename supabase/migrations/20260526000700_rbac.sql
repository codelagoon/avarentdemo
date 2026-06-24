-- AVA-20 PILOT READINESS SPRINT
-- Phase 2: Role-Based Access Control (RBAC)

create type company_role as enum ('owner', 'compliance_officer', 'analyst', 'viewer');

create table if not exists organization_roles (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role company_role not null default 'viewer',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(company_id, user_id)
);

-- Backfill organization_roles from the legacy companies.owner_id
insert into organization_roles (company_id, user_id, role)
select id, owner_id, 'owner'::company_role
from companies
where owner_id is not null
on conflict do nothing;

create index idx_org_roles_user on organization_roles(user_id);
create index idx_org_roles_company on organization_roles(company_id);

-- Helper function for RLS
create or replace function has_company_role(c_id uuid, allowed_roles company_role[])
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 
    from organization_roles 
    where company_id = c_id 
      and user_id = auth.uid() 
      and role = any(allowed_roles)
  );
$$;

-- Helper function for ANY member (Viewer +)
create or replace function is_company_member(c_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 
    from organization_roles 
    where company_id = c_id 
      and user_id = auth.uid()
  );
$$;

-- REDEFINE RLS TO USE RBAC
-- Example: Viewers can read everything, Analysts/Officers/Owners can write.

-- 1. COMPANIES
drop policy if exists "Users can view own companies" on companies;
drop policy if exists "Users can update own companies" on companies;

create policy "Members can view company" on companies
for select using (is_company_member(id));

create policy "Owners can update company" on companies
for update using (has_company_role(id, array['owner']::company_role[]));

-- 2. ALL OTHER TABLES: Read access for all members
-- We will dynamically drop the old policies and add the new ones

do $$
declare
  t text;
begin
  for t in select unnest(array['applicants', 'feature_library', 'threat_log', 'adverse_actions', 'ledger_events', 'fairness_alerts', 'fairness_metrics', 'circuit_breakers', 'rashomon_models', 'tenant_settings', 'decision_events', 'api_keys'])
  loop
    execute format('drop policy if exists "Users can access their company %I" on %I;', t, t);
    execute format('drop policy if exists "Users can view their company API keys" on %I;', t);
    execute format('drop policy if exists "Users can insert their company API keys" on %I;', t);
    execute format('drop policy if exists "Users can update their company API keys" on %I;', t);
    
    -- ALL Members can SELECT
    execute format('create policy "Members can view %I" on %I for select using (is_company_member(company_id));', t, t);
    
    -- ONLY Analyst, Compliance Officer, Owner can INSERT/UPDATE/DELETE (Viewers are read-only)
    execute format('create policy "Staff can insert %I" on %I for insert with check (has_company_role(company_id, array[''owner'', ''compliance_officer'', ''analyst'']::company_role[]));', t, t);
    execute format('create policy "Staff can update %I" on %I for update using (has_company_role(company_id, array[''owner'', ''compliance_officer'', ''analyst'']::company_role[]));', t, t);
    execute format('create policy "Staff can delete %I" on %I for delete using (has_company_role(company_id, array[''owner'', ''compliance_officer'', ''analyst'']::company_role[]));', t, t);
  end loop;
end $$;

-- Override specific sensitive tables
-- Tenant Settings and API Keys: Only Owner can manage
drop policy if exists "Staff can insert tenant_settings" on tenant_settings;
drop policy if exists "Staff can update tenant_settings" on tenant_settings;
drop policy if exists "Staff can delete tenant_settings" on tenant_settings;

create policy "Owners can update tenant_settings" on tenant_settings
for update using (has_company_role(company_id, array['owner']::company_role[]));

create policy "Owners can insert tenant_settings" on tenant_settings
for insert with check (has_company_role(company_id, array['owner']::company_role[]));

drop policy if exists "Staff can insert api_keys" on api_keys;
drop policy if exists "Staff can update api_keys" on api_keys;
drop policy if exists "Staff can delete api_keys" on api_keys;

create policy "Owners can insert api_keys" on api_keys
for insert with check (has_company_role(company_id, array['owner']::company_role[]));

create policy "Owners can update api_keys" on api_keys
for update using (has_company_role(company_id, array['owner']::company_role[]));
