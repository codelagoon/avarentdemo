-- AVA-19 SWEEP 2: Realistic Lender Dataset Seed
-- Simulates "Apex Lending", a mid-market auto & personal loan provider.

-- Define variables (requires executing as a single block)
DO $$
DECLARE
  v_company_id uuid := '11111111-1111-1111-1111-111111111111';
  v_owner_id uuid := '00000000-0000-0000-0000-000000000000'; -- Requires a valid auth.uid() in reality
BEGIN

  -- 1. Create Company
  INSERT INTO companies (id, name, short_name, email, industry, regulatory_body, primary_use_case, fairness_threshold)
  VALUES (
    v_company_id, 
    'Apex Lending', 
    'Apex', 
    'compliance@apexlending.com', 
    'auto_lending', 
    'CFPB', 
    'Auto Loans (Prime & Subprime)', 
    0.80
  ) ON CONFLICT DO NOTHING;

  -- 2. Create Decision Events (Realistic auto loan volume)
  INSERT INTO decision_events (id, company_id, applicant_id, applicant_name, credit_score, income, loan_amount, debt_to_income, outcome, primary_score, fairness_score, tower, shap_features, top_reasons, latency_ms)
  VALUES 
    (gen_random_uuid(), v_company_id, 'APP-9021', 'Sarah Jenkins', 720, 85000, 32000, 0.32, 'approved', 88.5, 92.1, 'primary', '[{"feature": "debt_to_income", "value": -0.12}, {"feature": "credit_score", "value": +0.45}]', '["Strong credit history", "Sufficient income"]', 145),
    (gen_random_uuid(), v_company_id, 'APP-9022', 'Marcus Thorne', 610, 45000, 28000, 0.45, 'denied', 45.2, 51.0, 'primary', '[{"feature": "debt_to_income", "value": -0.88}, {"feature": "recent_inquiries", "value": -0.30}]', '["Debt-to-income ratio too high", "Recent credit inquiries"]', 162),
    (gen_random_uuid(), v_company_id, 'APP-9023', 'Elena Rodriguez', 680, 62000, 22000, 0.38, 'approved', 75.1, 78.5, 'primary', '[{"feature": "employment_length", "value": +0.25}, {"feature": "credit_score", "value": +0.15}]', '["Stable employment", "Acceptable credit"]', 130),
    (gen_random_uuid(), v_company_id, 'APP-9024', 'David Kim', 750, 110000, 45000, 0.25, 'approved', 92.4, 95.0, 'primary', '[{"feature": "income", "value": +0.50}, {"feature": "credit_score", "value": +0.40}]', '["High income", "Excellent credit"]', 140),
    (gen_random_uuid(), v_company_id, 'APP-9025', 'Jamal Washington', 630, 52000, 25000, 0.42, 'denied', 58.7, 62.1, 'fairness', '[{"feature": "zip_code_risk", "value": -0.65}, {"feature": "credit_score", "value": -0.10}]', '["Geographic risk factor", "Credit score below tier threshold"]', 155);

  -- 3. Create Fairness Alerts (Triggered by the Jamal Washington denial pattern)
  INSERT INTO fairness_alerts (id, company_id, severity, metric, current_value, threshold, delta, cohort_id, recommended_action, acknowledged)
  VALUES 
    ('ALT-2026-06-01', v_company_id, 'critical', 'SPD', 0.72, 0.80, -0.08, 'ZIP-RISK-MINORITY-MAJORITY', 'Investigate ZIP code proxy correlation to race; generate Rashomon set.', false),
    ('ALT-2026-06-05', v_company_id, 'warning', 'PSI', 0.15, 0.10, 0.05, 'INCOME-TIER-3', 'Monitor income distribution drift. No immediate action required.', true);

  -- 4. Create Threat Log (Investigation into the Alert)
  INSERT INTO threat_log (id, company_id, applicant_name, applicant_id, attack_vector, risk_score, severity, status)
  VALUES 
    (gen_random_uuid(), v_company_id, 'Jamal Washington', 'APP-9025', 'Sequential Proxy Correlation (ZIP -> Race)', 92, 'critical', 'unresolved');

  -- 5. Create Adverse Action (Evidence for Denial)
  INSERT INTO adverse_actions (id, company_id, applicant_name, applicant_id, plain_language_score, cfpb_compliant, status, narrative_summary, behavioral_explanations)
  VALUES 
    (gen_random_uuid(), v_company_id, 'Marcus Thorne', 'APP-9022', 88, true, 'sent', 'Application denied primarily due to excessive debt obligations relative to income.', '{"Reduce revolving credit balances", "Avoid new credit inquiries"}');

  -- 6. Create Ledger Events (Audit History)
  INSERT INTO ledger_events (id, company_id, applicant_id, decision_event, previous_hash, current_hash, seal_signature)
  VALUES 
    (gen_random_uuid(), v_company_id, 'APP-9021', 'Auto Loan Origination - Approved', '0000000000000000000000000000000000000000000000000000000000000000', 'a1b2c3d4e5f6g7h8i9j0a1b2c3d4e5f6g7h8i9j0a1b2c3d4e5f6g7h8i9j0a1b2', 'SIG_XYZ123'),
    (gen_random_uuid(), v_company_id, 'APP-9022', 'Auto Loan Origination - Denied', 'a1b2c3d4e5f6g7h8i9j0a1b2c3d4e5f6g7h8i9j0a1b2c3d4e5f6g7h8i9j0a1b2', 'c3d4e5f6g7h8i9j0a1b2c3d4e5f6g7h8i9j0a1b2c3d4e5f6g7h8i9j0a1b2c3d4', 'SIG_ABC987');

END $$;
