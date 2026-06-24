# GOVERNANCE QUEUE

## Feature Delivery
Phase 5 of the Self-Serve Autonomy Sprint established the `GovernancePage.tsx` view specifically designed for the Chief Compliance Officer (CCO) role.

## Operational Workflow
The CCO requires a dedicated workspace to review Analyst recommendations, sign off on mitigations, and establish the final cryptographic link in the audit chain. 

1. **Visibility**: The `Governance Queue` lists all investigations currently in the `under_review` status. It is filtered out of the Analyst Inbox to ensure separation of duties.
2. **Approval Mechanics**: 
   - **Approve**: Clicking "Sign & Approve" automatically advances the investigation to `closed` and seals the algorithmic intervention into the immutable `ledger_events` table (handled by the Postgres trigger `trg_governance_ledger`).
   - **Reject**: Clicking "Reject" bounces the investigation back to the `in_progress` state, immediately returning it to the assigned Analyst's Inbox.
3. **Auditability**: Approved and Rejected actions are permanently tracked in their respective tabs.

## Verdict
**Self-Serve Ready**: Yes. The CCO now has a single pane of glass for regulatory sign-offs. The platform enforces the "Four Eyes" principle (Maker/Checker) autonomously.
