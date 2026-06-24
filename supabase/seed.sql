-- AVARENT Development Seed Data

-- 1. Create a Demo User in Auth
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
  'd0000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'demo@avarent.ai', 
  crypt('password', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{}', now(), now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES (
  gen_random_uuid(), 'd0000000-0000-0000-0000-000000000000', 'demo@avarent.ai', '{"sub": "d0000000-0000-0000-0000-000000000000", "email": "demo@avarent.ai"}', 'email', now(), now(), now()
) ON CONFLICT DO NOTHING;

-- 2. Create the Tenant Company
INSERT INTO companies (
  id, name, short_name, industry, size, regulatory_body, owner_id
) VALUES (
  'c0000000-0000-0000-0000-000000000000', 'First Global Bank', 'FGB', 'banking', 'enterprise', 'CFPB', 'd0000000-0000-0000-0000-000000000000'
) ON CONFLICT (id) DO NOTHING;

-- 3. Seed Decision Events (The canonical aggregate)
INSERT INTO decision_events (
  id, company_id, applicant_id, applicant_name, credit_score, income, loan_amount, debt_to_income, outcome, fairness_score, tower, shap_features, top_reasons, model_version
) VALUES 
  ('e1000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'APP-9281', 'Sarah Jenkins', 740, 85000, 320000, 0.28, 'approved', 0.98, 'primary', 
  '[{"feature": "debt_to_income", "value": 0.28, "contribution": 0.45, "description": "Healthy DTI ratio"}]'::jsonb, 
  '["Strong credit history", "Low debt-to-income ratio"]'::jsonb, 'v4.2.1'),
  
  ('e2000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'APP-9282', 'Marcus Thorne', 610, 45000, 280000, 0.45, 'denied', 0.82, 'primary', 
  '[{"feature": "credit_score", "value": 610, "contribution": -0.65, "description": "Credit score below prime threshold"}, {"feature": "debt_to_income", "value": 0.45, "contribution": -0.25, "description": "High DTI"}]'::jsonb, 
  '["Insufficient credit score", "High debt-to-income ratio"]'::jsonb, 'v4.2.1'),
  
  ('e3000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000', 'APP-9283', 'Elena Rodriguez', 685, 62000, 150000, 0.35, 'referred', 0.91, 'circuit_breaker', 
  '[{"feature": "zip_code", "value": 33101, "contribution": -0.55, "description": "Zip code penalty triggered proxy alert"}]'::jsonb, 
  '["Manual review required: BIFSG proxy threshold exceeded"]'::jsonb, 'v4.2.1');

-- 4. Seed Fairness Alerts
INSERT INTO fairness_alerts (
  id, company_id, metric, severity, current_value, threshold, description, is_resolved
) VALUES 
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000000', 'Demographic Parity (Hispanic)', 'high', 0.72, 0.80, 'Approval rate for Hispanic applicants dropped below 80% of majority class.', false),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000000', 'Equal Opportunity (Black)', 'medium', 0.85, 0.90, 'True positive rate disparity detected in Q3 auto loans.', true);

-- 5. Seed Threat Log
INSERT INTO threat_log (
  id, company_id, severity, type, description, affected_features, status
) VALUES 
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000000', 'critical', 'proxy_variable', 'High correlation detected between "neighborhood_cluster" and protected class "Race: Black"', ARRAY['neighborhood_cluster'], 'investigating');
