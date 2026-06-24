-- AVARENT Sentinel: Phase 4.5 Tenant Services Extension Migration
-- Adds tables for fairness alerts, circuit breakers, and rashomon models

-- 1. FAIRNESS ALERTS (Fairness Drift Service)
alter table adverse_actions 
  add column if not exists shap_features jsonb,
  add column if not exists shap_rankings jsonb,
  add column if not exists notice jsonb,
  add column if not exists reviewer_notes text;
  
create table if not exists fairness_alerts (
  id text primary key,
  company_id uuid references companies(id) on delete cascade not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  severity text not null, -- 'critical' | 'high' | 'warning'
  metric text not null, -- 'PSI' | 'DPD' | 'BOTH'
  current_value numeric not null,
  threshold numeric not null,
  delta numeric not null,
  cohort_id text not null,
  recommended_action text not null,
  acknowledged boolean not null default false
);

create table if not exists fairness_metrics (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  cohort_id text not null,
  psi numeric not null,
  psi_threshold numeric not null,
  dpd numeric not null,
  dpd_threshold numeric not null,
  demographic_breakdown jsonb not null default '[]'::jsonb,
  accuracy_fairness_points jsonb not null default '[]'::jsonb
);

-- 2. CIRCUIT BREAKERS (Decision Gateway Service)
create table if not exists circuit_breakers (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade not null unique,
  failures integer not null default 0,
  last_failure_time bigint not null default 0,
  is_open boolean not null default false,
  consecutive_successes integer not null default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. RASHOMON MODELS (Rashomon Service)
create table if not exists rashomon_models (
  id text primary key,
  company_id uuid references companies(id) on delete cascade not null,
  name text not null,
  accuracy numeric not null,
  fairness_score numeric not null,
  feature_count integer not null,
  calibration numeric not null,
  latency_ms integer not null,
  complexity text not null, -- 'low' | 'medium' | 'high'
  description text not null,
  parameters jsonb not null default '{}'::jsonb,
  is_current boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. TENANT SETTINGS (Alt Data, Anti-Fairwashing, Fairness Drift)
create table if not exists tenant_settings (
  company_id uuid references companies(id) on delete cascade primary key,
  alt_data_state jsonb not null default '{}'::jsonb,
  anti_fairwashing_state jsonb not null default '{}'::jsonb,
  fairness_drift_state jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexing for lookup latency
create index if not exists idx_fairness_alerts_company on fairness_alerts(company_id);
create index if not exists idx_fairness_metrics_company on fairness_metrics(company_id);
create index if not exists idx_circuit_breakers_company on circuit_breakers(company_id);
create index if not exists idx_rashomon_models_company on rashomon_models(company_id);

-- RLS Policies
alter table fairness_alerts enable row level security;
alter table fairness_metrics enable row level security;
alter table circuit_breakers enable row level security;
alter table rashomon_models enable row level security;
alter table tenant_settings enable row level security;

create policy "Allow access fairness_alerts by company" on fairness_alerts for all using (true);
create policy "Allow access fairness_metrics by company" on fairness_metrics for all using (true);
create policy "Allow access circuit_breakers by company" on circuit_breakers for all using (true);
create policy "Allow access rashomon_models by company" on rashomon_models for all using (true);
create policy "Allow access tenant_settings by company" on tenant_settings for all using (true);
