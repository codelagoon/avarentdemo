# API KEY OPERATIONS

## Feature Delivery
Phase 2 of the Self-Serve Autonomy Sprint established the `TenantApiKeyManager` and the `/api/v1/keys` secure ingestion route.

## Operational Workflow
A non-technical Owner can now autonomously integrate their Loan Origination System (LOS) or decision engine into Avarent.

1. **Generation**: The user navigates to `Settings -> Model Configuration`. They click `Generate Key`.
2. **Copy-Once Security**: The backend securely generates a cryptographically random string (e.g. `avk_live_9f8d...`), hashes it with SHA-256, and stores the hash in the `api_keys` table. The raw string is returned exactly once to the frontend and displayed in an orange "Copy Now" alert box.
3. **Visibility**: The `TenantApiKeyManager` lists all active keys, displaying their `name`, `created_at` timestamp, and `last_used_at` timestamp. This provides immediate auditability for dormant integrations.
4. **Revocation**: The Owner can click the trash icon to revoke a key. This performs a soft-delete (`revoked_at`), instantly terminating the key's ability to ingest webhook data while preserving its historical audit footprint in the database.

## Verdict
**Self-Serve Ready**: Yes. The `Owner` role is fully autonomous and no longer requires an engineer to run `INSERT` statements to establish tenant data pipelines.
