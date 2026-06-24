# INVESTIGATION WORKFLOW

## Overview
Investigations are now a first-class entity in Avarent. Previously, compliance officers had to mentally connect an active Fairness Alert or Threat to the eventual mitigation (e.g., a Rashomon alternative model). The introduction of the `investigations` schema formalizes this case management process.

## Schema Architecture
The new relational schema ties together disparate telemetry into a cohesive narrative:
- `investigations`: The core case file (Status: Open, In Progress, Under Review, Resolved, Closed).
- `investigation_assignments`: Maps `auth.users` to the investigation (allowing multiple analysts per case).
- `investigation_notes`: Unstructured, chronological commentary provided by analysts during the review.
- `investigation_evidence`: A polymorphic link table attaching specific records (`rashomon_models`, `decision_events`, `feature_library`) to the case file as proof.
- `fairness_alerts` & `threat_log`: Have been altered to include `investigation_id` as a foreign key, making the origin of the investigation explicitly traceable.

## The Operational Workflow

1. **Detection**: A `critical` severity `fairness_alert` triggers due to an SPD drop in the Auto Loan portfolio.
2. **Creation**: An Analyst clicks "Open Investigation" on the Alert. The system creates an `investigations` record and links the Alert.
3. **Assignment**: The Compliance Officer assigns the investigation to two Analysts via `investigation_assignments`. The status moves to `in_progress`.
4. **Execution**: Analysts use the Threat Analysis page to identify a proxy correlation. They generate a Rashomon set to find an alternative model. 
5. **Evidence Collection**: The Analysts attach the proxy `feature` and the chosen `rashomon_model` to the investigation via `investigation_evidence`. They write a note detailing their findings in `investigation_notes`.
6. **Resolution**: The Analyst changes the status to `under_review`, passing the burden to the Governance phase (Phase 4).
