-- Phase 5a: ADT Schema for Decision Events

create table if not exists decision_events (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  applicant_id text not null,
  applicant_name text not null,
  
  -- Inputs
  credit_score integer,
  income numeric,
  loan_amount numeric,
  debt_to_income numeric,
  
  -- Decisions
  outcome text not null, -- 'approved', 'denied', 'referred'
  primary_score numeric,
  fairness_score numeric,
  tower text, -- 'primary', 'fairness', 'circuit_breaker'
  
  -- Interpretability (ADT)
  shap_features jsonb not null default '[]'::jsonb,
  top_reasons jsonb not null default '[]'::jsonb,
  
  -- Metadata
  circuit_breaker_triggered boolean default false,
  latency_ms integer,
  model_version text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index if not exists idx_decision_events_company_id on decision_events(company_id);
create index if not exists idx_decision_events_created_at on decision_events(created_at);

-- RLS
alter table decision_events enable row level security;
create policy "Allow full access for dev" on decision_events using (true);
