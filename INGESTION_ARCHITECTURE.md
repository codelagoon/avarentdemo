# INGESTION ARCHITECTURE & FRAMEWORK

## Overview
To move Avarent from a prototype to a production deployment, the platform requires a robust, fault-tolerant ingestion framework capable of handling high-volume lending decisions from external origination systems (LOS) like Encompass, Blend, or bespoke internal credit engines.

## Architecture

### 1. External Sources
- **Supported LOS**: Encompass (via Webhooks), Blend, MeridianLink.
- **Custom Engines**: Python/FastAPI ML inferencing engines sending JSON payloads.

### 2. Ingestion Path & Normalization
1. **API Gateway (`/api/v1/decisions`)**: 
   - Receives raw JSON payload.
   - Validates `Bearer` token against a newly proposed `api_keys` table (UUID tokens are unacceptable for production).
2. **Schema Validation & Normalization**:
   - Zod/Joi is used to sanitize the payload.
   - External LOS fields (e.g., `loan_amt`, `applicant_income`) are mapped to the Avarent canonical ADT schema (`loan_amount`, `income`).
3. **Storage (Repository)**:
   - Event is durably persisted to `decision_events` via `DecisionRepository`.
   - Event is pushed to an event bus (e.g., Supabase Realtime / PostgreSQL LISTEN/NOTIFY) for asynchronous processing.

### 3. Monitoring & Fairness Computation Loop
- **Supabase Edge Function (Fairness Engine)**:
   - Subscribes to the `decision_events` stream.
   - Recalculates Population Stability Index (PSI) and Disparate Impact (AIR/SPD) based on the rolling cohort window.
   - If thresholds are breached, the Edge Function inserts a row into `fairness_alerts`.

### 4. Failure Handling
- **Dead-Letter Queue (DLQ)**: Any payload that fails normalization or persistence is routed to a `dlq_events` table for manual retry.
- **Circuit Breakers**: If the Edge Function fails or detects runaway bias (e.g., 5 consecutive high-severity alerts), it triggers the `circuit_breakers` table to halt automated ML inferencing via Webhook response (`{ action: 'halt' }`).

## Required Next Steps for Pilot
1. Build `api_keys` table for secure webhook authentication.
2. Build the Supabase Edge Function to close the broken ML loop (Decision Event $\rightarrow$ Alert).
