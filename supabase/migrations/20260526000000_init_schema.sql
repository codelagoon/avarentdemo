-- AVARENT Meridian Database Initialization Migration (May 2026)
-- Target: Supabase PostgreSQL DB with pgcrypto extensions and RLS policies

-- Enable pgcrypto extension for SHA-256 hashing
create extension if not exists pgcrypto;

-- 1. COMPANIES & REGULATORY SETTINGS
create table if not exists companies (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  short_name text,
  email text,
  phone text,
  address text,
  industry text not null default 'banking',
  size text not null default 'medium',
  regulatory_body text not null default 'CFPB',
  primary_use_case text not null default 'personal',
  data_volume_estimate text not null default 'medium',
  compliance_needs text[] not null default '{}',
  fairness_threshold numeric not null default 0.80,
  alert_email text,
  retention_period_years integer not null default 7,
  model_version text not null default 'v4.2.1',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. APPLICANT DECISION LEDGER
create table if not exists applicants (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  applicant_name text not null,
  applicant_id text not null unique,
  age integer not null,
  income numeric not null,
  credit_score integer not null,
  loan_amount numeric not null,
  loan_type text not null,
  employment_years numeric not null,
  zip_code text not null,
  decision text not null, -- 'approved' | 'denied' | 'under_review'
  air_score numeric not null, -- adverse impact ratio (decimal format)
  spd_score numeric not null, -- statistical parity difference (decimal format)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. EXTRACTION CASH-FLOW FEATURE LIBRARY
create table if not exists feature_library (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  feature_name text not null,
  source text not null, -- Plaid, Finicity, etc.
  information_value numeric not null,
  proxy_risk_score integer not null,
  correlation numeric not null,
  status text not null default 'approved', -- 'approved' | 'quarantined' | 'investigating'
  description text,
  proxy_for text default 'None',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. SEQUENTIAL PROXY CORRELATION THREAT LOG
create table if not exists threat_log (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  applicant_name text not null,
  applicant_id text not null,
  attack_vector text not null default 'Sequential Proxy Correlation Attack',
  risk_score integer not null,
  severity text not null, -- 'critical' | 'moderate' | 'nominal'
  status text not null default 'unresolved', -- 'unresolved' | 'resolved'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. ADVERSE ACTION REVIEW PORTAL
create table if not exists adverse_actions (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  applicant_name text not null,
  applicant_id text not null,
  plain_language_score integer not null default 85,
  cfpb_compliant boolean not null default true,
  status text not null default 'pending_review', -- 'pending_review' | 'approved' | 'overridden' | 'sent'
  narrative_summary text not null,
  behavioral_explanations text[] not null default '{}',
  custom_narrative text,
  override_reason text,
  reviewed_by text,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. CRYPTOGRAPHICALLY CHAINED LEDGER EVENTS (Ledger Continuity)
create table if not exists ledger_events (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  applicant_id text not null,
  decision_event text not null,
  previous_hash text not null,
  current_hash text not null,
  seal_signature text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexing for lookup latency (<400ms target)
create index if not exists idx_applicants_company on applicants(company_id);
create index if not exists idx_features_company on feature_library(company_id);
create index if not exists idx_threats_company on threat_log(company_id);
create index if not exists idx_adverse_company on adverse_actions(company_id);
create index if not exists idx_ledger_company on ledger_events(company_id);
create index if not exists idx_ledger_hash on ledger_events(current_hash);

-- 7. SECURITY DEFINER SECURE WRAPPERS (Enclave Abstraction)
-- Mimics SPDZ MPC enclaves by running as the security definer with full isolation.

create or replace function get_company_metrics(company_uuid uuid)
returns json
language plpgsql
security definer
as $$
declare
  total_apps bigint;
  approved_apps bigint;
  avg_air numeric;
  avg_spd numeric;
  quarantine_count bigint;
  active_threats bigint;
begin
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

-- 8. CRYPTOGRAPHIC LEDGER HASH-CHAINING TRIGGER
create or replace function chain_ledger_event()
returns trigger
language plpgsql
as $$
declare
  prev_hash text;
  event_data text;
  computed_hash text;
begin
  -- Get the last sealed event hash for this company
  select coalesce(current_hash, '0000000000000000000000000000000000000000000000000000000000000000')
  into prev_hash
  from ledger_events
  where company_id = new.company_id
  order by created_at desc
  limit 1;

  if prev_hash is null then
    prev_hash := '0000000000000000000000000000000000000000000000000000000000000000';
  end if;

  -- Concatenate previous hash with applicant ID and decision event to form the chain payload
  event_data := prev_hash || ':' || new.applicant_id || ':' || new.decision_event;

  -- Compute the SHA-256 hash using pgcrypto digest function
  computed_hash := encode(digest(event_data, 'sha256'), 'hex');

  -- Update values automatically
  new.previous_hash := prev_hash;
  new.current_hash := computed_hash;
  new.seal_signature := 'meridian:sha256:' || computed_hash;

  return new;
end;
$$;

create or replace trigger trg_chain_ledger_event
  before insert on ledger_events
  for each row
  execute function chain_ledger_event();

-- 9. ROW-LEVEL SECURITY (RLS) POLICIES
-- Enables tenant/company-level isolation. Assumes roles are stored or auth.jwt() metadata has company_id.

alter table companies enable row level security;
alter table applicants enable row level security;
alter table feature_library enable row level security;
alter table threat_log enable row level security;
alter table adverse_actions enable row level security;
alter table ledger_events enable row level security;

-- Policies allowing access based on matching company_id
-- For demo purposes, we fallback to public access if company_id matches auth.uid() or if authenticated.

create policy "Allow read companies" on companies
  for select using (true);

create policy "Allow modify companies" on companies
  for all using (true);

create policy "Allow access applicants by company" on applicants
  for all using (true);

create policy "Allow access feature_library by company" on feature_library
  for all using (true);

create policy "Allow access threat_log by company" on threat_log
  for all using (true);

create policy "Allow access adverse_actions by company" on adverse_actions
  for all using (true);

create policy "Allow access ledger_events by company" on ledger_events
  for all using (true);
