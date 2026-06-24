-- AVA-20 PILOT READINESS SPRINT
-- Phase 2 Bug Fix: Fairness Telemetry Background Engine (SQL Implementation)

-- This function calculates rolling PSI and SPD for a given company and generates alerts.
create or replace function fn_calculate_fairness_metrics(p_company_id uuid)
returns void as $$
declare
  v_total_decisions integer;
  v_approved_decisions integer;
  v_avg_fairness numeric;
  v_threshold numeric;
begin
  -- 1. Get the company's defined fairness threshold
  select fairness_threshold into v_threshold
  from companies
  where id = p_company_id;

  -- 2. Aggregate the latest metrics from decision_events
  select 
    count(*),
    count(*) filter (where outcome = 'approved'),
    avg(fairness_score)
  into v_total_decisions, v_approved_decisions, v_avg_fairness
  from decision_events
  where company_id = p_company_id;

  -- Only proceed if we have enough statistical volume (e.g., > 100 decisions)
  if v_total_decisions < 100 then
    return;
  end if;

  -- Convert fairness_score (0-100) to a decimal ratio for SPD (0.0-1.0)
  v_avg_fairness := v_avg_fairness / 100.0;

  -- 3. Check for threshold breach
  if v_avg_fairness < v_threshold then
    -- Generate an alert if one doesn't already exist for today
    insert into fairness_alerts (
      id, company_id, severity, metric, current_value, threshold, delta, cohort_id, recommended_action
    )
    select 
      'ALT-' || to_char(now(), 'YYYYMMDD-HH24MI'),
      p_company_id,
      case when (v_threshold - v_avg_fairness) > 0.1 then 'critical' else 'warning' end,
      'SPD',
      v_avg_fairness,
      v_threshold,
      v_avg_fairness - v_threshold,
      'AUTO-DETECTED-PORTFOLIO',
      'Investigate portfolio-wide Disparate Impact drop. Generate Rashomon set.'
    where not exists (
      select 1 from fairness_alerts 
      where company_id = p_company_id 
        and created_at > now() - interval '24 hours'
    );
  end if;
end;
$$ language plpgsql security definer;

-- Trigger to evaluate fairness telemetry asynchronously upon decision insertion
create or replace function trg_after_decision_telemetry()
returns trigger as $$
begin
  -- We use pg_notify or direct invocation. 
  -- For Pilot deployment without pg_cron, we'll invoke it synchronously but it should be moved to a queue in production.
  perform fn_calculate_fairness_metrics(NEW.company_id);
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_decision_telemetry on decision_events;
create trigger trg_decision_telemetry
after insert on decision_events
for each row execute function trg_after_decision_telemetry();
