# REALISTIC LENDER DATASET

## Overview
The `supabase/seed_realistic.sql` script initializes the database with a high-fidelity, interconnected dataset representing a mid-market auto lending operation ("Apex Lending").

## Dataset Composition

### 1. The Tenant (Apex Lending)
- **Profile**: Subprime and Prime auto lender regulated by the CFPB.
- **Settings**: Fairness threshold set to an aggressive 0.80.

### 2. Decision Events (5 Records)
- We seeded 5 diverse credit applications to represent a realistic day of underwriting.
- **The Bias Event**: Applicant "Jamal Washington" (APP-9025) is denied with a `fairness_score` of 62.1. Crucially, the interpretability payload (`shap_features`) explicitly logs `zip_code_risk` as the primary negative weight. This is a classic redlining/proxy correlation attack vector.

### 3. Monitoring & Governance Workflow (3 Records)
- **Alert**: The bias event successfully trips the `fairness_alerts` table with a 'critical' severity alert for SPD degradation (0.72 vs 0.80 threshold) on a minority-majority cohort.
- **Threat Log**: The system logs an active, unresolved investigation into "Sequential Proxy Correlation (ZIP -> Race)" against the Jamal Washington denial.
- **Adverse Action**: An alternative denial (APP-9022) successfully generates a CFPB-compliant, plain-language narrative.

### 4. Audit Evidence (2 Records)
- **Ledger**: The approvals and denials are stamped into the `ledger_events` table with sequential SHA-256 cryptographic hashes, mimicking a WORM (Write-Once-Read-Many) compliant evidentiary chain.

## Verdict
The dataset proves that the *schema* is capable of supporting a rich, believable compliance narrative. It does not feel empty or synthetic. However, because the backend ML engine is missing, these interconnected records had to be manually correlated via the seed script rather than generated organically by the platform.
