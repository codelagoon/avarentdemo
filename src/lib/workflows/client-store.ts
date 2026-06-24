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

export function upsertThreatInCache(event: ThreatEvent): void {
  if (!cache.threats) return
  const index = cache.threats.findIndex((t) => t.id === event.id)
  const next = [...cache.threats]
  if (index >= 0) {
    next[index] = event
  } else {
    next.unshift(event)
  }
  cache.threats = next
  emit("threat")
}

export function upsertLedgerInCache(entry: LedgerEntry): void {
  if (!cache.ledger) return
  const index = cache.ledger.findIndex((e) => e.id === entry.id)
  const next = [...cache.ledger]
  if (index >= 0) {
    next[index] = entry
  } else {
    next.unshift(entry)
  }
  cache.ledger = next
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
