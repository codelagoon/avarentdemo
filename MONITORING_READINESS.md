# Monitoring Readiness Audit

As per Directive 6, all monitoring capabilities are classified below:

## 1. Automated Decision Technology (ADT) Ingestion
- **Status**: **Production Ready**
- **Analysis**: The `POST /api/v1/decisions` endpoint correctly inserts records into the `decision_events` table securely.

## 2. Fairness Drift Monitor (Parity Watch)
- **Status**: **Real Data Required**
- **Analysis**: The service reads from Supabase (`fairness_alerts`), but the alerts themselves are generated manually via the "Simulate" buttons in the UI. To be production-ready, this needs a background chron job or database trigger to calculate drift over real `decision_events`.

## 3. Circuit Breaker / Decision Gateway
- **Status**: **Simulated**
- **Analysis**: The `DecisionGateway` trips circuit breakers based on UI interactions and simulated demo scenarios rather than intercepting real API traffic payload anomalies.

## 4. Anti-Fairwashing Threat Detection
- **Status**: **Real Data Required**
- **Analysis**: The system reads `threat_log` from Supabase, but the threats are manually instantiated in the codebase rather than being heuristically detected from actual log events.

## 5. Scenario Runner
- **Status**: **Mock**
- **Analysis**: `scenarioService.ts` injects completely fake payloads into the system for demonstration purposes. This entire system should be removed or moved entirely out of the production runtime into a local testing suite.
