# INVESTIGATION INBOX

## Feature Delivery
Phase 4 of the Self-Serve Autonomy Sprint established the `InboxPage.tsx` view for Analysts and Compliance Officers.

## Operational Workflow
Analysts no longer have to navigate through high-level dashboards to find out if they have work to do. They now have a dedicated case management workspace.

1. **Routing**: Investigations initiated from the `ThreatAnalysisPage` are now automatically visible in the `InboxPage`.
2. **Filtering**: The workspace is segmented into three states:
   - **Assigned to Me**: Only active investigations requiring immediate mitigation work from the current user.
   - **All Open**: A global view of all open investigations across the organization (for Managers/CCOs).
   - **Resolved**: Historical, closed investigations.
3. **Empty States**: If there are no active threats, the UI displays an "Inbox Zero" graphic to reward the Analyst and reduce cognitive load.

## Verdict
**Self-Serve Ready**: Yes. The platform now supports a true daily operational workflow where Analysts log in, check their inbox, resolve threats, and achieve inbox zero without touching SQL or navigating disjointed dashboards.
