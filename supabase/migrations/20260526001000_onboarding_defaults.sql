-- AVA-20 PILOT READINESS SPRINT
-- Phase 2/3 Bug Fix: Onboarding Defaults Hydration

create or replace function fn_seed_tenant_defaults()
returns trigger as $$
begin
  -- Insert default tenant settings
  insert into tenant_settings (
    company_id,
    alt_data_state,
    anti_fairwashing_state,
    fairness_drift_state
  ) values (
    NEW.id,
    '{"enabled": true, "threshold_weight": 0.15}',
    '{"enabled": true, "strict_mode": false}',
    '{"enabled": true, "alert_threshold": 0.80}'
  ) on conflict do nothing;

  -- Insert default circuit breaker configuration
  insert into circuit_breakers (
    company_id,
    failures,
    is_open,
    consecutive_successes
  ) values (
    NEW.id,
    0,
    false,
    0
  ) on conflict do nothing;

  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_seed_tenant_defaults on companies;
create trigger trg_seed_tenant_defaults
after insert on companies
for each row execute function fn_seed_tenant_defaults();

-- Backfill any existing companies that might be missing their defaults
insert into tenant_settings (company_id) 
select id from companies 
on conflict do nothing;

insert into circuit_breakers (company_id) 
select id from companies 
on conflict do nothing;
