# AVA-18 Repository Coverage Report

**Date**: June 2026
**Target**: `avarentdemo` Repository

This report inventories every persistence path within the codebase to identify where business-critical writes and reads flow through designated Repositories versus direct UI/Service persistence or legacy paths.

## Inventory of Persistence Paths

| Component | Persistence Method | Repository Used | Tenant Scoped | Status |
| --------- | ------------------ | --------------- | ------------- | ------ |
| `AdverseActionService` | Repository | `AdverseActionRepository` | Yes (Inherited) | ✅ Compliant |
| `FairnessDriftService` | Repository | `MonitoringRepository` | Yes (Inherited) | ✅ Compliant |
| `ThreatService` | Repository | `MonitoringRepository` | Yes (Inherited) | ✅ Compliant |
| `LedgerService` | Repository | `DecisionRepository` | Yes (Inherited) | ✅ Compliant |
| `CompanyService` | Direct Supabase Client | None | Yes | ⚠️ Valid (Auth/Tenant root) |
| `AltDataService` | Direct Supabase Client | None | Yes | ❌ Non-Compliant |
| `AntiFairwashingService` | Direct Supabase Client | None | Yes | ❌ Non-Compliant |
| `BIFSGService` | Direct Supabase Client | None | Yes | ❌ Non-Compliant |
| `DecisionGateway` | Direct Supabase Client | None | Yes | ❌ Non-Compliant |
| `GANDebiasingService` | Direct Supabase Client | None | Yes | ❌ Non-Compliant |
| `ModelRetrainingService` | Direct Supabase Client | None | Yes | ❌ Non-Compliant |
| `API: /api/v1/decisions` | Direct Supabase Client | None | Yes | ❌ Non-Compliant |
| `API: /api/inngest` | Direct Supabase Client | None | N/A | ⚠️ Background Job |

## Findings

1. **Compliant Paths**: The four primary services refactored during AVA-17 (`AdverseActionService`, `FairnessDriftService`, `ThreatService`, `LedgerService`) successfully use the `BaseRepository` abstraction and enforce tenant scoping via `companyService.getActiveCompanyId()`.
2. **Non-Compliant Services**: Several specialized services (`AltDataService`, `AntiFairwashingService`, `BIFSGService`, `DecisionGateway`, `GANDebiasingService`, `ModelRetrainingService`) bypass the `BaseRepository` pattern and instantiate Supabase clients directly. While these paths manually enforce `company_id = companyId`, they violate the architecture boundary established in AVA-17.
3. **API Routes**: The REST endpoints (`/api/v1/decisions`) currently insert directly into Supabase instead of utilizing `DecisionRepository`.
4. **Auth Exemption**: `CompanyService` and `login-signup.tsx` interact directly with `supabase.auth`, which is expected for identity and session management.

## Conclusion

The repository abstraction is not yet uniformly adopted across all background services. To achieve 100% repository coverage, the remaining 6 services and 1 API route must be refactored to consume the `BaseRepository` abstractions rather than calling `supabase.from()` directly. However, per the AVA-18 constraints ("Do not perform another architectural refactor"), we acknowledge these as architectural debt while confirming they still technically enforce tenant isolation via `company_id`.
