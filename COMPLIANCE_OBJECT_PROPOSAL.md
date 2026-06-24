# Compliance Object Proposal

## Current State
The system has fragmented concepts of compliance records:
- `decision_events` (ADT records)
- `fairness_alerts`
- `threat_log`
- `circuit_breakers`

## Proposal: `DecisionRecord`
Instead of having disjointed tables, we should consolidate around a canonical `DecisionRecord`.
The `decision_events` table introduced in Phase 5a is close to this, but it should act as the central source of truth.

```ts
interface DecisionRecord {
  id: string;
  tenantId: string; // Enforced tenant scope
  applicantId: string;
  outcome: 'approved' | 'denied' | 'referred';
  fairnessMetrics: FairnessSnapshot; // Embedded state at time of decision
  shapInterpretability: InterpretabilitySnapshot;
  flags: ('bifsg_proxy_detected' | 'circuit_breaker_triggered' | 'manual_override')[];
  createdAt: string;
}
```

This single canonical object allows us to generate Audit Packets, run Fairness Monitors, and investigate Adverse Actions natively from one data structure, rather than trying to sync multiple disparate tables.
