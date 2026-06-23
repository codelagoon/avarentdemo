import type { MembershipRole } from "@/lib/identity/types"

/**
 * Tenant scope passed to organization-aware repositories (AVA-17 prep).
 * organization_id maps to companies.id in Postgres.
 */
export interface TenantScope {
  organization_id: string
  user_id: string
  role: MembershipRole
}

export interface TenantScopedQuery {
  scope: TenantScope
}

/** Base contract for repositories that will be backed by Supabase RLS. */
export interface OrganizationScopedRepository {
  readonly entityName: string
  readonly requiresOrganizationId: true
}

export interface ServiceTenantRequirement {
  service: string
  organizationIdRequired: boolean
  futureRlsTable: string | null
  futureRepository: string
  notes: string
}

/**
 * AVA-19 audit: organization_id requirements per service/domain.
 * No persistence migration in this phase — interfaces only.
 */
export const SERVICE_TENANT_REQUIREMENTS: ServiceTenantRequirement[] = [
  {
    service: "threatService",
    organizationIdRequired: true,
    futureRlsTable: "threat_log",
    futureRepository: "ThreatRepository",
    notes: "Investigations scoped by company_id; threat events must filter by organization.",
  },
  {
    service: "ledgerService",
    organizationIdRequired: true,
    futureRlsTable: "ledger_events",
    futureRepository: "LedgerRepository",
    notes: "Audit History and Documentation queue; hash chain per organization.",
  },
  {
    service: "fairnessDriftService",
    organizationIdRequired: true,
    futureRlsTable: "applicants",
    futureRepository: "MonitoringRepository",
    notes: "Monitoring metrics derived from tenant applicant aggregates.",
  },
  {
    service: "auditPacketService",
    organizationIdRequired: true,
    futureRlsTable: null,
    futureRepository: "AuditPacketRepository",
    notes: "Exam packages scoped to organization; new audit_packets table recommended in AVA-17.",
  },
  {
    service: "companyService",
    organizationIdRequired: true,
    futureRlsTable: "companies",
    futureRepository: "OrganizationRepository",
    notes: "Local profile cache; canonical org is companies table via membershipDomain.",
  },
  {
    service: "adverseActionService",
    organizationIdRequired: true,
    futureRlsTable: "adverse_actions",
    futureRepository: "AdverseActionRepository",
    notes: "Documentation and adverse action workflows.",
  },
  {
    service: "scenarioService",
    organizationIdRequired: true,
    futureRlsTable: null,
    futureRepository: "ScenarioRepository",
    notes: "Demo scenarios per organization in AVA-17.",
  },
  {
    service: "decisionGateway",
    organizationIdRequired: true,
    futureRlsTable: "applicants",
    futureRepository: "DecisionRepository",
    notes: "Credit decisions tied to company_id.",
  },
  {
    service: "antiFairwashingService",
    organizationIdRequired: true,
    futureRlsTable: "feature_library",
    futureRepository: "FeatureLibraryRepository",
    notes: "Proxy quarantine per organization.",
  },
  {
    service: "rashomonService",
    organizationIdRequired: true,
    futureRlsTable: null,
    futureRepository: "ModelRepository",
    notes: "LDA / model search scoped to organization models.",
  },
  {
    service: "syntheticDataService",
    organizationIdRequired: true,
    futureRlsTable: "applicants",
    futureRepository: "SyntheticDataRepository",
    notes: "Synthetic cohort generation per tenant.",
  },
  {
    service: "altDataService",
    organizationIdRequired: true,
    futureRlsTable: "feature_library",
    futureRepository: "AltDataRepository",
    notes: "Alternative data features per organization.",
  },
  {
    service: "dataImportService",
    organizationIdRequired: true,
    futureRlsTable: "applicants",
    futureRepository: "DataImportRepository",
    notes: "Bulk import scoped to organization.",
  },
  {
    service: "bifsgService",
    organizationIdRequired: true,
    futureRlsTable: "bisg_cache",
    futureRepository: "BisgRepository",
    notes: "Already uses Supabase; needs company_id on cache rows in AVA-17.",
  },
  {
    service: "aiModelService",
    organizationIdRequired: false,
    futureRlsTable: null,
    futureRepository: "AiModelRepository",
    notes: "BYOK keys are user-scoped; org-level key vault in future.",
  },
  {
    service: "csvGeneratorService",
    organizationIdRequired: true,
    futureRlsTable: null,
    futureRepository: "ExportRepository",
    notes: "Exports must include organization_id in audit trail.",
  },
  {
    service: "narrativeTranslator",
    organizationIdRequired: true,
    futureRlsTable: "adverse_actions",
    futureRepository: "NarrativeRepository",
    notes: "Adverse action narratives per organization.",
  },
]

export const WORKFLOW_TENANT_REQUIREMENTS = [
  {
    workflow: "investigations",
    domain: "investigationDomain",
    organizationIdRequired: true,
    syncChannels: ["threat", "ledger"],
  },
  {
    workflow: "monitoring",
    domain: "monitoringDomain",
    organizationIdRequired: true,
    syncChannels: ["fairnessDrift", "threat", "ledger"],
  },
  {
    workflow: "documentation",
    domain: "auditPacketDomain",
    organizationIdRequired: true,
    syncChannels: ["auditPacket", "ledger"],
  },
  {
    workflow: "audit-history",
    domain: "ledgerDomain",
    organizationIdRequired: true,
    syncChannels: ["ledger"],
  },
  {
    workflow: "command-center",
    domain: "commandCenterDomain",
    organizationIdRequired: true,
    syncChannels: ["threat", "ledger", "fairnessDrift", "auditPacket"],
  },
] as const
