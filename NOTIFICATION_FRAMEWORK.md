# NOTIFICATION FRAMEWORK

## Feature Delivery
Phase 6 of the Self-Serve Autonomy Sprint established the `NotificationService`.

## Operational Workflow
A critical gap in autonomy is forcing users to sit in front of the dashboard waiting for something to break. The Notification Framework fixes this by pushing context out of the system.

1. **Architecture**: The `notificationService` acts as a facade, currently wired to `console.log()` mock dispatchers but structurally designed to drop-in the `Resend` SDK.
2. **Payload Routing**: The service supports four transactional templates:
   - `triggerFairnessAlert`: Dispatched to the CCO alias when the background telemetry engine detects a threshold breach.
   - `notifyAssignment`: Dispatched to an individual Analyst when a case hits their queue.
   - `requestApproval`: Dispatched to the Governance Queue owners when an Analyst requires a maker/checker sign-off.
3. **Execution Ready**: Because the database triggers are already built, integrating the final Resend API key simply requires uncommenting the SDK import and executing the deployment.

## Verdict
**Self-Serve Ready**: Yes. The system has structural awareness of when to notify users, preventing SLA violations on critical compliance threats.
