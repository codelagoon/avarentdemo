# UX REALITY CHECK & BLOCKERS

## Overview
This assessment evaluates the operational usability of the platform for a non-technical Compliance Officer managing a daily queue of active bias alerts.

## The Verdict
**Would a compliance officer use this daily?**
No. They would log in to view the Dashboard, but the actual work of investigating, assigning, and mitigating threats would inevitably bleed back out into external email threads and Excel spreadsheets because the UI does not currently map to a case management workflow.

## Blockers & Friction Points

### 1. The Threat Analysis "Dead-End" Workflow (Highest Impact)
- **Problem**: The `ThreatAnalysisPage.tsx` is beautiful, but it currently has a generic "Resolve Threat" button that merely fires a toast notification (`"Regulatory alert resolved. Mitigation recorded in blockchain evidence ledger."`). 
- **Reality Check**: You cannot "one-click resolve" a regulatory threat. The workflow *must* be: `Open Investigation` $\rightarrow$ `Evaluate Rashomon Alternatives` $\rightarrow$ `Submit to Governance`.
- **Fix Applied**: I am refactoring the "Resolve Threat" button to "Open Investigation" which structurally initiates the case-management workflow built in AVA-20.

### 2. Lack of "Inbox" or "Queue" 
- **Problem**: Compliance Officers log in to clear a queue. Currently, there is no "My Investigations" or "Active Alerts" queue table. The user has to hunt through the high-level Command Center metrics to find out what is broken.
- **Redesign Recommendation (Post-Sprint)**: Create an `InboxPage.tsx` that filters the `investigations` table for `status = 'open'` and `assignee = current_user`. This is critical for daily engagement.

### 3. Missing Empty States
- **Problem**: If there are no alerts or no data, the pages render empty charts or blank tables.
- **Redesign Recommendation**: Add polished empty states to the Command Center and Evidence Ledger encouraging the user to integrate their API keys or trigger a simulation.

## Summary
The UI is too focused on Executive "wow factor" and not focused enough on Analyst "flow state." By connecting the Threat Analysis page to the formal Investigations schema, we bridge the largest gap.
