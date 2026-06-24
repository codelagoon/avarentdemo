# COMPLIANCE WORKFLOW MAP

## Target Flow vs Reality Gap Analysis

### 1. Decision Event
- **Target**: Machine learning inference engine (internal or external) logs a credit decision alongside interpretability data (SHAP, Top Reasons).
- **Reality**: `decision_events` table captures this perfectly. Ingestion is handled via `POST /api/v1/decisions` which maps directly to the `DecisionRepository`. 
- **Gap**: None.

### 2. Alert
- **Target**: Continuous drift/fairness monitoring detects an anomaly (e.g., PSI/DPD drop) and raises a severity-tiered alert to compliance officers.
- **Reality**: `fairness_alerts` table exists and `FairnessAlertRepository` is wired. 
- **Gap**: **CRITICAL**. There is no backend engine connecting `decision_events` to `fairness_alerts`. The loop is completely broken. Without mock data, an alert will never trigger automatically.

### 3. Investigation
- **Target**: Compliance officers review the alert, dig into the proxy/feature data, and document findings.
- **Reality**: 
  - For proxy threats: `threat_log` captures sequential proxy correlation attacks.
  - For fairness reviews: The `fairness_alerts` table has a `status` and `acknowledged` flag.
- **Gap**: Weak lineage. The `threat_log` does not explicitly link to a specific `fairness_alert` ID via a foreign key, making it difficult to prove *why* an investigation started.

### 4. Evidence
- **Target**: Documenting exactly what features were used, what alternative models were tested, and the explanations given to the consumer.
- **Reality**: 
  - Alternative Models: `rashomon_models` table.
  - Features: `feature_library` table.
  - Explanations: `adverse_actions` table.
- **Gap**: Disjointed. Evidence is spread across multiple tables without a unifying "Investigation ID" or "Evidence Collection" entity.

### 5. Audit Packet
- **Target**: A tamper-evident snapshot of the decision, the alert, the investigation, and the evidence.
- **Reality**: `ledger_events` (Cryptographically Chained Ledger). It chains `decision_event` hashes.
- **Gap**: The ledger only chains the *decision*. It does not cryptographically seal the *investigation* or the *evidence*. A regulator cannot cryptographically verify that an investigation happened *before* an adverse action was sent.

### 6. Governance Record
- **Target**: Formal sign-off by a Chief Compliance Officer (CCO) approving a model version or an investigation outcome.
- **Reality**: There is no `governance_approvals` table. 
- **Gap**: **SEVERE**. Governance is purely implicit (e.g., changing the `model_version` in `companies`). There is no immutable record of "User X approved Model Y on Date Z based on Evidence Packet A."
