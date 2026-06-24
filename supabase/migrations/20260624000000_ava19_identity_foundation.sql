-- AVA-19: Identity, organizations & WorkOS foundation
-- Extends companies as the canonical organization model (no duplicate organizations table).

-- ---------------------------------------------------------------------------
-- 1. Organization fields on companies (organization_id === companies.id)
-- ---------------------------------------------------------------------------
alter table companies
  add column if not exists status text not null default 'active'
    check (status in ('active', 'pending', 'suspended'));

alter table companies
  add column if not exists created_by uuid references auth.users(id) on delete set null;

create index if not exists idx_companies_status on companies(status);
create index if not exists idx_companies_created_by on companies(created_by);

comment on table companies is
  'Canonical organization record. Application layer aliases company_id as organization_id.';

-- ---------------------------------------------------------------------------
-- 2. Membership roles — ADMIN, ANALYST, REVIEWER (+ legacy values)
-- ---------------------------------------------------------------------------
alter table company_members drop constraint if exists company_members_role_check;

alter table company_members
  add constraint company_members_role_check
  check (role in (
    'ADMIN', 'ANALYST', 'REVIEWER',
    'owner', 'admin', 'member', 'viewer'
  ));

-- ---------------------------------------------------------------------------
-- 3. WorkOS identity link on auth.users metadata (documented; set via app sync)
-- ---------------------------------------------------------------------------
-- user_metadata.workos_user_id — set by /api/auth/callback onSuccess sync

-- ---------------------------------------------------------------------------
-- 4. Helper: primary membership for current user
-- ---------------------------------------------------------------------------
create or replace function public.user_primary_membership()
returns table (
  organization_id uuid,
  organization_name text,
  organization_status text,
  membership_role text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id as organization_id,
    c.name as organization_name,
    c.status as organization_status,
    cm.role as membership_role
  from company_members cm
  join companies c on c.id = cm.company_id
  where cm.user_id = auth.uid()
  order by cm.created_at asc
  limit 1;
$$;

revoke all on function public.user_primary_membership() from public;
grant execute on function public.user_primary_membership() to authenticated;
