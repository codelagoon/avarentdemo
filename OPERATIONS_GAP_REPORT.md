# OPERATIONS GAP REPORT

## Overview
This audit evaluates whether a non-technical compliance officer can complete core Avarent workflows autonomously, without relying on an engineer to execute SQL queries or manage Supabase configurations.

## Workflow Assessment

### 1. Onboarding & Registration
- **Can a non-technical user complete this?** 🟡 **Partially**
- **Gap**: A user can sign up via WorkOS and create a Tenant. However, they cannot currently connect their LOS (Loan Origination System) without an API key, stalling the onboarding process immediately.

### 2. API Key Management
- **Can a non-technical user complete this?** 🔴 **No**
- **Gap**: There is no UI to generate, view, or revoke API keys. An engineer must manually run `insert into api_keys` and provide the raw string to the lender.

### 3. Team Management (RBAC)
- **Can a non-technical user complete this?** 🔴 **No**
- **Gap**: The `SettingsPage` lacks an "Invite Member" interface. Furthermore, assigning someone as a `Compliance Officer` requires a manual `UPDATE organization_roles` query in the database.

### 4. Investigations
- **Can a non-technical user complete this?** 🔴 **No**
- **Gap**: Analysts cannot see what threats are assigned to them. There is no "Inbox" or "Queue". The `ThreatAnalysisPage` allows opening an investigation, but the user cannot track its status or due date.

### 5. Governance Approvals
- **Can a non-technical user complete this?** 🔴 **No**
- **Gap**: Compliance Officers have no centralized view of pending approvals. They cannot easily review an Analyst's mitigation notes and click "Approve" or "Reject". This workflow is currently entirely theoretical in the backend.

### 6. Evidence Review & Audit Exports
- **Can a non-technical user complete this?** ✅ **Yes**
- **Gap**: None. The `EvidenceLedgerPage` allows complete self-serve auditing, filtering, and CSV exporting of the cryptographically sealed ledger.

## Conclusion
To achieve self-serve autonomy, we must build three major operational surfaces:
1. **API Keys UI** (Settings)
2. **Team Roles UI** (Settings)
3. **Inbox & Governance Queue** (Case Management)
