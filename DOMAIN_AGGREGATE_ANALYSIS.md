# Domain Aggregate Analysis

## Candidate Aggregate Roots

### 1. `DecisionRecord`
- **Description**: The core unit of algorithmic action. Every time the credit model runs, a `DecisionRecord` is created.
- **Child Entities**: `SHAPFeature[]`, `AdverseActionReview` (if outcome is denied/referred).
- **Lifecycle Ownership**: Created via API ingest (`POST /api/v1/decisions`). Modified only if an adverse action review overrides the decision. Never deleted.
- **Pros**: Perfectly maps to the ADT table (`decision_events`). Unifies the "Adverse Action" and "Ledger" into one pipeline.

### 2. `ComplianceCase`
- **Description**: An aggregated grouping of alerts or decisions that require human intervention.
- **Child Entities**: `FairnessAlert`, `ThreatEvent`, `DecisionRecord[]`.
- **Lifecycle Ownership**: Created by the monitoring system. Resolved by a Compliance Officer.
- **Pros**: Maps well to the "Governance" aspect of the platform.
- **Cons**: Too broad. A threat event (Anti-Fairwashing) is conceptually different from a Fairness Drift alert (BIFSG macro-level).

### 3. `ModelArtifact` (or `RashomonModel`)
- **Description**: Represents a machine learning model deployed or tested.
- **Child Entities**: `FeatureLibrary`, `FairnessMetrics`.
- **Lifecycle Ownership**: Created during model upload/sync.

## Recommendation

We should adopt **`DecisionRecord`** as the primary Aggregate Root for all transactional data. 
Currently, `ledger_events` and `adverse_actions` are treated as separate domains, but they are conceptually the same thing: an applicant was evaluated by a model.
- If approved, it's just a `DecisionRecord`.
- If denied, it's a `DecisionRecord` with a pending `AdverseActionReview`.

We should adopt **`MonitoringAlert`** as a secondary Aggregate Root for governance workflows (unifying `fairness_alerts`, `threat_log`, and `circuit_breakers` into one standardized alerting structure).
