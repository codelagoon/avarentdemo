-- Phase 1.5: RLS hardening — tenant isolation via company_members
-- Replaces permissive using(true) policies with organization-scoped access.

-- ---------------------------------------------------------------------------
-- 1. Company membership (links auth.users → companies)
-- ---------------------------------------------------------------------------
create table if not exists company_members (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  company_id uuid references companies(id) on delete cascade not null,
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, company_id)
);

create index if not exists idx_company_members_user on company_members(user_id);
create index if not exists idx_company_members_company on company_members(company_id);

alter table company_members enable row level security;

-- ---------------------------------------------------------------------------
-- 2. Helper: company IDs the current user belongs to
-- ---------------------------------------------------------------------------
create or replace function public.user_company_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from company_members where user_id = auth.uid();
$$;

revoke all on function public.user_company_ids() from public;
grant execute on function public.user_company_ids() to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Drop permissive demo policies
-- ---------------------------------------------------------------------------
drop policy if exists "Allow read companies" on companies;
drop policy if exists "Allow modify companies" on companies;
drop policy if exists "Allow access applicants by company" on applicants;
drop policy if exists "Allow access feature_library by company" on feature_library;
drop policy if exists "Allow access threat_log by company" on threat_log;
drop policy if exists "Allow access adverse_actions by company" on adverse_actions;
drop policy if exists "Allow access ledger_events by company" on ledger_events;
drop policy if exists "Allow read and write on bisg_cache" on bisg_cache;

-- ---------------------------------------------------------------------------
-- 4. company_members policies
-- ---------------------------------------------------------------------------
create policy "company_members_select_own"
  on company_members for select to authenticated
  using (user_id = auth.uid());

create policy "company_members_insert_own"
  on company_members for insert to authenticated
  with check (user_id = auth.uid());

create policy "company_members_delete_own"
  on company_members for delete to authenticated
  using (user_id = auth.uid() and role = 'owner');

-- ---------------------------------------------------------------------------
-- 5. companies — tenant-scoped
-- ---------------------------------------------------------------------------
create policy "companies_select_member"
  on companies for select to authenticated
  using (id in (select public.user_company_ids()));

create policy "companies_insert_authenticated"
  on companies for insert to authenticated
  with check (auth.uid() is not null);

create policy "companies_update_member"
  on companies for update to authenticated
  using (id in (select public.user_company_ids()))
  with check (id in (select public.user_company_ids()));

-- ---------------------------------------------------------------------------
-- 6. Tenant-scoped tables (company_id column)
-- ---------------------------------------------------------------------------
create policy "applicants_tenant_all"
  on applicants for all to authenticated
  using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));

create policy "feature_library_tenant_all"
  on feature_library for all to authenticated
  using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));

create policy "threat_log_tenant_all"
  on threat_log for all to authenticated
  using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));

create policy "adverse_actions_tenant_all"
  on adverse_actions for all to authenticated
  using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));

create policy "ledger_events_tenant_all"
  on ledger_events for all to authenticated
  using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));

-- ---------------------------------------------------------------------------
-- 7. bisg_cache — authenticated only (no anon access)
-- ---------------------------------------------------------------------------
create policy "bisg_cache_select_authenticated"
  on bisg_cache for select to authenticated
  using (true);

create policy "bisg_cache_insert_authenticated"
  on bisg_cache for insert to authenticated
  with check (true);

create policy "bisg_cache_update_authenticated"
  on bisg_cache for update to authenticated
  using (true)
  with check (true);

create policy "bisg_cache_delete_authenticated"
  on bisg_cache for delete to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- 8. Harden security definer function — enforce membership
-- ---------------------------------------------------------------------------
create or replace function get_company_metrics(company_uuid uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  total_apps bigint;
  approved_apps bigint;
  avg_air numeric;
  avg_spd numeric;
  quarantine_count bigint;
  active_threats bigint;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if not exists (
    select 1 from company_members
    where user_id = auth.uid() and company_id = company_uuid
  ) then
    raise exception 'access denied: not a member of this organization';
  end if;

  select count(*), count(*) filter (where decision = 'approved')
  into total_apps, approved_apps
  from applicants
  where company_id = company_uuid;

  select coalesce(avg(air_score), 0.0), coalesce(avg(spd_score), 0.0)
  into avg_air, avg_spd
  from applicants
  where company_id = company_uuid;

  select count(*)
  into quarantine_count
  from feature_library
  where company_id = company_uuid and status = 'quarantined';

  select count(*)
  into active_threats
  from threat_log
  where company_id = company_uuid and status = 'unresolved';

  return json_build_object(
    'total_applications', total_apps,
    'approved_applications', approved_apps,
    'average_air', round(avg_air, 4),
    'average_spd', round(avg_spd, 4),
    'quarantined_features', quarantine_count,
    'active_threats_unresolved', active_threats
  );
end;
$$;

revoke all on function get_company_metrics(uuid) from public;
grant execute on function get_company_metrics(uuid) to authenticated;
