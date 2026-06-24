# Testing Gap Report

## Current Coverage
- `tests/avarent.spec.ts` covers the primary demo scenarios ("good faith", "synthetic data studio", "alternative data hub", "anti-fairwashing").
- `tests/login-context-regression.spec.ts` covers login context bypasses.
- There are no unit tests (`Vitest`).

## Critical Gaps
- **Tenant Isolation**: No tests verify that Company A cannot see Company B's decision events.
- **Org Membership**: WorkOS auth logic is not tested.
- **Adverse Action Approvals**: The manual override workflow is missing tests.
- **Audit Packet Generation**: No tests verify that the packet is properly formed from canonical `DecisionRecord` objects.

Business rule logic needs dedicated integration tests against a test database rather than relying purely on Playwright UI tests against mock data.
