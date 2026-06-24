-- AVA-17: Workflow persistence columns + PII-safe applicant references

alter table threat_log
  add column if not exists external_id text,
  add column if not exists applicant_ref text,
  add column if not exists signal_label text,
  add column if not exists finding_id text,
  add column if not exists description text,
  add column if not exists proxy_variables text[] not null default '{}',
  add column if not exists confidence numeric not null default 0,
  add column if not exists model_score numeric not null default 0,
  add column if not exists zip_code text,
  add column if not exists blocked boolean not null default false;

create unique index if not exists idx_threat_log_external_id
  on threat_log(company_id, external_id)
  where external_id is not null;

comment on column threat_log.applicant_ref is
  'Opaque aggregate applicant reference — no raw PII. Display via signal_label.';

alter table ledger_events
  add column if not exists external_id text,
  add column if not exists applicant_ref text,
  add column if not exists event_type text not null default 'audit',
  add column if not exists model_version text,
  add column if not exists fairness_score numeric not null default 0,
  add column if not exists severity text;

create unique index if not exists idx_ledger_events_external_id
  on ledger_events(company_id, external_id)
  where external_id is not null;

comment on column ledger_events.applicant_ref is
  'Opaque aggregate applicant reference — no raw PII.';
