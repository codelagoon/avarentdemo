import type { LedgerEntry } from "@/data/mockData"
import type { AuditPacket } from "@/services/auditPacketService"
import type { DriftAlert, FairnessDriftMetrics } from "@/services/fairnessDriftService"
import type { MembershipRole } from "@/lib/identity/types"
import type { TenantScope } from "@/domains/identity/tenant-requirements"

/** Repository contracts for current localStorage-backed persistence. */

export interface LedgerRepository {
  getAll(): LedgerEntry[]
  getRecent(count: number): LedgerEntry[]
  filterByType(type: string): LedgerEntry[]
  search(query: string): LedgerEntry[]
}

export interface AuditPacketRepository {
  getHistory(): AuditPacket[]
  save(packet: AuditPacket): void
}

export interface MonitoringRepository {
  getMetrics(): FairnessDriftMetrics[]
  getActiveAlerts(): DriftAlert[]
  ensureSeeded(): void
}

/** AVA-19: Future organization-scoped repository contracts (AVA-17 implementation). */

export interface OrganizationScopedLedgerRepository {
  getAll(scope: TenantScope): Promise<LedgerEntry[]>
  getRecent(scope: TenantScope, count: number): Promise<LedgerEntry[]>
  filterByType(scope: TenantScope, type: string): Promise<LedgerEntry[]>
  search(scope: TenantScope, query: string): Promise<LedgerEntry[]>
}

export interface OrganizationScopedAuditPacketRepository {
  getHistory(scope: TenantScope): Promise<AuditPacket[]>
  save(scope: TenantScope, packet: AuditPacket): Promise<void>
}

export interface OrganizationScopedMonitoringRepository {
  getMetrics(scope: TenantScope): Promise<FairnessDriftMetrics[]>
  getActiveAlerts(scope: TenantScope): Promise<DriftAlert[]>
  ensureSeeded(scope: TenantScope): Promise<void>
}

export interface OrganizationScopedThreatRepository {
  getAll(scope: TenantScope): Promise<import("@/data/mockData").ThreatEvent[]>
  getById(
    scope: TenantScope,
    id: string
  ): Promise<import("@/data/mockData").ThreatEvent | undefined>
}

export interface MembershipRepository {
  getForUser(userId: string): Promise<{
    organization_id: string
    organization_name: string
    role: MembershipRole
  } | null>
  validate(userId: string, organizationId: string): Promise<boolean>
  updateRole(
    userId: string,
    organizationId: string,
    role: MembershipRole
  ): Promise<void>
}
