-- AVA-20 PILOT READINESS SPRINT
-- Phase 4: Governance Approvals & Phase 5: Ledger Integration

create type governance_decision as enum ('approved', 'rejected', 'more_info_needed');

create table if not exists governance_approvals (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  investigation_id uuid references investigations(id) on delete cascade not null,
  approved_by uuid references auth.users(id) on delete set null,
  decision governance_decision not null,
  rationale text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_gov_approvals_company on governance_approvals(company_id);
create index idx_gov_approvals_inv on governance_approvals(investigation_id);

alter table governance_approvals enable row level security;

-- All members can view
create policy "Members can view governance_approvals" on governance_approvals for select using (is_company_member(company_id));

-- Only Compliance Officers and Owners can insert approvals
create policy "Officers and Owners can insert governance_approvals" on governance_approvals for insert with check (has_company_role(company_id, array['owner', 'compliance_officer']::company_role[]));


-- PHASE 5: LEDGER INTEGRATION VIA POSTGRES TRIGGER
-- We ensure that EVERY governance action is automatically written to the immutable ledger_events table.
-- This guarantees cryptographic WORM compliance for human approvals without relying on the Node.js application layer.

create or replace function fn_ledger_governance_trigger()
returns trigger as $$
declare
  v_previous_hash text;
  v_current_hash text;
  v_seal_signature text;
  v_payload jsonb;
begin
  -- 1. Find the most recent hash for this company to chain the ledger
  select current_hash into v_previous_hash
  from ledger_events
  where company_id = NEW.company_id
  order by created_at desc
  limit 1;

  -- Default genesis hash if this is the first ledger event for the company
  if v_previous_hash is null then
    v_previous_hash := '0000000000000000000000000000000000000000000000000000000000000000';
  end if;

  -- 2. Construct the payload representing the human action
  v_payload := jsonb_build_object(
    'investigation_id', NEW.investigation_id,
    'approved_by', NEW.approved_by,
    'decision', NEW.decision,
    'rationale', NEW.rationale,
    'timestamp', NEW.created_at
  );

  -- 3. Cryptographically hash the payload + previous hash (simulating SHA-256 for the prototype)
  v_current_hash := encode(digest(v_previous_hash || v_payload::text, 'sha256'), 'hex');
  v_seal_signature := 'SIG_GOV_' || substring(v_current_hash from 1 for 8);

  -- 4. Insert into the ledger_events table
  insert into ledger_events (
    company_id,
    applicant_id, -- Using applicant_id to store the Investigation reference since the schema expects a string
    decision_event,
    previous_hash,
    current_hash,
    seal_signature
  ) values (
    NEW.company_id,
    'INV-' || substring(NEW.investigation_id::text from 1 for 8),
    'Governance ' || initcap(NEW.decision::text),
    v_previous_hash,
    v_current_hash,
    v_seal_signature
  );

  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_governance_ledger on governance_approvals;
create trigger trg_governance_ledger
after insert on governance_approvals
for each row execute function fn_ledger_governance_trigger();
