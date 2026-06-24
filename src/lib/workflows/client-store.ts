import type { LedgerEntry, ThreatEvent } from "@/domains/shared/types"
import { emit } from "@/lib/sync"

interface WorkflowCache {
  organizationId: string | null
  threats: ThreatEvent[] | null
  ledger: LedgerEntry[] | null
  loadedAt: number | null
}

const cache: WorkflowCache = {
  organizationId: null,
  threats: null,
  ledger: null,
  loadedAt: null,
}

export function getCachedThreats(): ThreatEvent[] | null {
  return cache.threats
}

export function getCachedLedger(): LedgerEntry[] | null {
  return cache.ledger
}

export function getCachedOrganizationId(): string | null {
  return cache.organizationId
}

export function setWorkflowCache(
  organizationId: string,
  threats: ThreatEvent[],
  ledger: LedgerEntry[]
): void {
  cache.organizationId = organizationId
  cache.threats = threats
  cache.ledger = ledger
  cache.loadedAt = Date.now()
  emit("threat")
  emit("ledger")
}

export function clearWorkflowCache(): void {
  cache.organizationId = null
  cache.threats = null
  cache.ledger = null
  cache.loadedAt = null
}

export async function hydrateWorkflowCacheFromApi(): Promise<boolean> {
  if (typeof window === "undefined") return false

  try {
    const response = await fetch("/api/workflows/bootstrap", { credentials: "include" })
    if (!response.ok) return false

    const data = (await response.json()) as {
      organization_id: string
      threats: ThreatEvent[]
      ledger: LedgerEntry[]
    }

    setWorkflowCache(data.organization_id, data.threats, data.ledger)
    return true
  } catch {
    return false
  }
}
