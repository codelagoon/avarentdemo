# Persistence Matrix

| Service | Current Store | Target Store | Tenant Scoped | Migration Complexity |
| ------- | ------------- | ------------ | ------------- | -------------------- |
| **companyService** | `companies` (DB) + `localStorage` (active ID) | `companies` (DB) + Auth Session | Yes | Medium (Requires AuthKit/Session sync to replace local state) |
| **ledgerService** | `applicants` / `ledger_events` (DB) + `mockData.ts` | `ledger_events` (DB) via Repository | Yes | Medium (Remove mock merge, ensure single DB truth) |
| **adverseActionService** | `adverse_actions` + `tenant_settings` (DB) | `DecisionRecord` (DB) / `investigations` | Yes | High (Schema redesign to unify actions into Compliance/Decision records) |
| **fairnessDriftService** | `fairness_alerts` + `tenant_settings` (DB) | `fairness_alerts` (DB) | Yes | Low (Already in Supabase, but needs Repository wrapper) |
| **decisionGateway** | `circuit_breakers` + `tenant_settings` (DB) | `circuit_breakers` (DB) | Yes | Low (Already in Supabase, needs Repository wrapper) |
| **altDataService** | `feature_library` + `tenant_settings` (DB) | `feature_library` (DB) | Yes | Low (Already in Supabase, needs Repository wrapper) |
| **antiFairwashingService** | `threat_log` + `tenant_settings` (DB) | `threat_log` (DB) | Yes | Low (Already in Supabase, needs Repository wrapper) |
| **rashomonService** | `rashomon_models` (DB) | `rashomon_models` (DB) | Yes | Low (Already in Supabase, needs Repository wrapper) |
| **threatService** | `localStorage` + `mockData.ts` | `threat_log` (DB) | Yes | Medium (Migrate local JSON string to DB rows via Repository) |
| **syntheticDataService** | `localStorage` | `synthetic_datasets` (DB) | Yes | Medium (Create new schema table and Repository) |
| **scenarioService** | `mockData.ts` (Read-only) | Remove or Seed DB | N/A | Low (This is demo scaffolding, delete or move to DB seeder) |
| **aiModelService** | `localStorage` (API Keys) | `tenant_settings` (DB) or Secrets | Yes | High (Moving API keys to secure backend storage requires API routing) |
| **auditPacketService** | In-Memory (Generated on fly) | `audit_packets` (DB) | Yes | Medium (Persist generated packets instead of only downloading) |
