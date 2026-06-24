# RBAC MATRIX (Role-Based Access Control)

## Overview
Avarent now enforces granular access control via the `organization_roles` mapping table and PostgreSQL Row-Level Security (RLS) policies. Every user is assigned a specific `company_role` within their tenant.

## Roles Defined

### Owner
The root administrator of the tenant.
- **Permissions**: 
  - Manage all organizational settings (`tenant_settings`).
  - Generate and revoke API Keys (`api_keys`).
  - Manage user roles and invite new members (via `organization_roles`).
  - Approve governance actions (CCO equivalent).

### Compliance Officer
The senior review authority for the tenant.
- **Permissions**: 
  - Approve or reject active investigations.
  - Approve algorithmic mitigations (e.g., Rashomon deployments).
  - Review and sign-off on evidence packets.
  - Cannot generate API keys or manage tenant-wide settings.

### Analyst
The day-to-day investigator and operational user.
- **Permissions**: 
  - Create and update investigations.
  - Attach evidence to an investigation.
  - Trigger alternative model (Rashomon) generations.
  - Cannot approve their own investigations (Segregation of Duties).

### Viewer
Auditors, regulators, or external consultants.
- **Permissions**: 
  - Read-only access to all dashboards, ledgers, and telemetry.
  - Cannot modify any table or initiate any workflow.

## Enforcement Mechanism
RBAC is enforced structurally at the **Database Layer**. We implemented `is_company_member(uuid)` and `has_company_role(uuid, role[])` Postgres functions. 
- All `SELECT` policies rely on `is_company_member`.
- All `INSERT`/`UPDATE`/`DELETE` policies strictly validate against `has_company_role`, guaranteeing that even if a frontend bug exposes an "Approve" button to a Viewer, the API/Database will securely reject the transaction.
