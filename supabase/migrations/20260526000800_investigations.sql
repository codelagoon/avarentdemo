-- AVA-20 PILOT READINESS SPRINT
-- Phase 3: Investigations Workflow

create type investigation_status as enum ('open', 'in_progress', 'under_review', 'resolved', 'closed');

-- 1. Investigations Core Table
create table if not exists investigations (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  title text not null,
  description text,
  status investigation_status not null default 'open',
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Assignments
create table if not exists investigation_assignments (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  investigation_id uuid references investigations(id) on delete cascade not null,
  assignee_id uuid references auth.users(id) on delete cascade not null,
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(investigation_id, assignee_id)
);

-- 3. Notes
create table if not exists investigation_notes (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  investigation_id uuid references investigations(id) on delete cascade not null,
  author_id uuid references auth.users(id) on delete set null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Evidence Linking (Many-to-Many generic linker)
create table if not exists investigation_evidence (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  investigation_id uuid references investigations(id) on delete cascade not null,
  evidence_type text not null, -- 'rashomon_model', 'feature', 'decision_event', 'adverse_action'
  evidence_id text not null, -- Can be uuid or text depending on the source table
  attached_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(investigation_id, evidence_type, evidence_id)
);

-- 5. Alert Linking
alter table fairness_alerts
add column if not exists investigation_id uuid references investigations(id) on delete set null;

alter table threat_log
add column if not exists investigation_id uuid references investigations(id) on delete set null;

-- Indexes
create index idx_investigations_company on investigations(company_id);
create index idx_inv_assignments_inv on investigation_assignments(investigation_id);
create index idx_inv_notes_inv on investigation_notes(investigation_id);
create index idx_inv_evidence_inv on investigation_evidence(investigation_id);

-- RLS Policies (leveraging the RBAC functions from previous migration)
alter table investigations enable row level security;
alter table investigation_assignments enable row level security;
alter table investigation_notes enable row level security;
alter table investigation_evidence enable row level security;

-- All members can view
create policy "Members can view investigations" on investigations for select using (is_company_member(company_id));
create policy "Members can view inv_assignments" on investigation_assignments for select using (is_company_member(company_id));
create policy "Members can view inv_notes" on investigation_notes for select using (is_company_member(company_id));
create policy "Members can view inv_evidence" on investigation_evidence for select using (is_company_member(company_id));

-- Analysts+ can insert/update
create policy "Staff can insert investigations" on investigations for insert with check (has_company_role(company_id, array['owner', 'compliance_officer', 'analyst']::company_role[]));
create policy "Staff can update investigations" on investigations for update using (has_company_role(company_id, array['owner', 'compliance_officer', 'analyst']::company_role[]));

create policy "Staff can insert inv_assignments" on investigation_assignments for insert with check (has_company_role(company_id, array['owner', 'compliance_officer', 'analyst']::company_role[]));
create policy "Staff can insert inv_notes" on investigation_notes for insert with check (has_company_role(company_id, array['owner', 'compliance_officer', 'analyst']::company_role[]));
create policy "Staff can insert inv_evidence" on investigation_evidence for insert with check (has_company_role(company_id, array['owner', 'compliance_officer', 'analyst']::company_role[]));
