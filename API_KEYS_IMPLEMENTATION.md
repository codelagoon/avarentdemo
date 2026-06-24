# API KEYS IMPLEMENTATION

## Overview
Avarent's ingestion endpoint (`/api/v1/decisions`) previously relied on passing the `company_id` UUID directly in the `Authorization: Bearer` header. This was fundamentally insecure, functioning effectively as an unauthenticated endpoint. We have now implemented a robust API Key architecture.

## Schema
Table: `api_keys`
- `id` (uuid)
- `company_id` (uuid) - Maps the key to the tenant.
- `name` (text) - e.g., "Encompass Webhook Prod"
- `key_hash` (text) - The SHA-256 hash of the generated API key.
- `created_by` (uuid) - The user who generated the key.
- `last_used_at` (timestamp) - Tracks active usage.
- `revoked_at` (timestamp) - Soft-deletion for immediate invalidation.

## Auth Flow
1. Client generates an API key in the UI (e.g., `avk_1234567890abcdef`). The UI displays the raw key exactly once.
2. The UI hashes the key (SHA-256) and stores *only* the hash (`key_hash`) in the `api_keys` table.
3. The client sends a `POST` request to `/api/v1/decisions` with header `X-API-Key: avk_1234567890abcdef`.
4. The Next.js API route hashes the incoming `X-API-Key`.
5. The API route queries the `api_keys` table using the Supabase Service Role key (bypassing RLS since the client is not an authenticated user session).
6. If a match is found and `revoked_at` is null, the `company_id` is resolved and injected into `DecisionRepository(companyId)`.

## Rotation Process
1. Generate a new API Key ("Encompass V2").
2. Update the external LOS (Encompass) to use the new key.
3. Monitor `last_used_at` on the old key ("Encompass V1").
4. Once traffic fully migrates, click "Revoke" on the old key.

## Revocation Process
Keys are never deleted to maintain audit integrity. Instead, `revoked_at` is set to `now()`. The `/api/v1/decisions` middleware explicitly rejects any key where `revoked_at` is not null.
