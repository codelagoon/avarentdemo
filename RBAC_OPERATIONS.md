# TEAM & RBAC OPERATIONS

## Feature Delivery
Phase 3 of the Self-Serve Autonomy Sprint established the `TenantTeamManager` and the `/api/v1/team` secure route.

## Operational Workflow
A non-technical Owner can now autonomously invite colleagues and distribute roles.

1. **Invitation**: The user navigates to `Settings -> Team & Roles`. They input a colleague's email (e.g. `c.officer@bank.com`), select the `Compliance Officer` role, and click "Send Invite."
2. **Role Modification**: The Team Manager lists all active organization members. The Owner can seamlessly modify a user's role from `Analyst` to `Compliance Officer` via a dropdown, immediately promoting their permissions in the database `organization_roles` table.
3. **Deactivation**: If an Analyst leaves the company, the Owner clicks the trash icon. This executes a `DELETE` against the role mapping, instantly stripping the user of all RLS access to the tenant's data.

## Verdict
**Self-Serve Ready**: Yes. The platform handles the full lifecycle of identity governance without requiring an engineer to manipulate the `organization_roles` database table.
