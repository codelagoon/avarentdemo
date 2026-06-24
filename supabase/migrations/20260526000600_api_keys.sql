-- AVA-20 PILOT READINESS SPRINT
-- Phase 1: API Key Infrastructure

create table if not exists api_keys (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  name text not null,
  key_hash text not null unique, -- Store SHA-256 hash only!
  created_by uuid references auth.users(id) on delete set null,
  last_used_at timestamp with time zone,
  revoked_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_api_keys_hash on api_keys(key_hash);
create index if not exists idx_api_keys_company on api_keys(company_id);

alter table api_keys enable row level security;

create policy "Users can view their company API keys" on api_keys
for select using (
  company_id in (select id from companies where owner_id = auth.uid())
);

create policy "Users can insert their company API keys" on api_keys
for insert with check (
  company_id in (select id from companies where owner_id = auth.uid())
);

create policy "Users can update their company API keys" on api_keys
for update using (
  company_id in (select id from companies where owner_id = auth.uid())
);
