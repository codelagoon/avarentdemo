# GOVERNANCE WORKFLOW

## Overview
Phase 4 and 5 of the Pilot Readiness Sprint established strict organizational accountability. While Phase 3 handles "finding the solution," Phase 4 handles "approving the solution." 

## Schema Architecture
- `governance_approvals`: An immutable append-only table recording a CCO or Owner's final decision (`approved`, `rejected`, `more_info_needed`) regarding an active investigation, complete with a required rationale text blob.

## The Operational Workflow

1. **Review**: The Analyst sets an `investigation` status to `under_review`.
2. **Evaluation**: The Compliance Officer (CCO) logs in. Thanks to RBAC, they are one of the few individuals authorized to insert into `governance_approvals`. They review the linked evidence (the Rashomon model and Proxy metrics).
3. **Approval**: The CCO submits their approval with the rationale: "Alternative Model 2 reduces SPD by 5% with negligible accuracy drop. Approved for deployment."
4. **Ledger Sealing (The Magic)**: The moment the approval is inserted, a PostgreSQL Trigger (`trg_governance_ledger`) intercepts the transaction. It automatically hashes the CCO's payload and chains it into the `ledger_events` table alongside the machine's initial credit decisions.

## Compliance Guarantee
If the CFPB audits the organization 3 years later, the `ledger_events` table will irrefutably prove:
- **Who**: The CCO's unique `auth.users` UUID.
- **Did What**: Approved a specific Rashomon mitigation model.
- **When**: Cryptographically sealed chronologically between thousands of credit applications.
- **Why**: The plain-text rationale is permanently hashed into the blockchain simulator.
