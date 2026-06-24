import type { LedgerEntry, ThreatEvent } from "@/domains/shared/types"
import { ledgerService } from "@/services/ledgerService"
import { threatService } from "@/services/threatService"
import { SYNC } from "@/domains/shared/sync-channels"

export const INVESTIGATION_SYNC_CHANNELS = [SYNC.threat, SYNC.ledger] as const

const MODEL_VERSION = "FNB-FAIR-v4.2.1"

export function getInvestigations(): ThreatEvent[] {
  return threatService.getAll()
}

export function getInvestigationById(id: string): ThreatEvent | undefined {
  return threatService.getById(id)
}

export function getInvestigationIdForFinding(findingId: string): string | undefined {
  return threatService.getAll().find((t) => t.findingId === findingId)?.id
}

export function getLedgerEvidenceForInvestigation(threat: ThreatEvent): LedgerEntry[] {
  const all = ledgerService.getAll()
  const linked = all.filter(
    (entry) =>
      entry.applicantId === threat.applicantId ||
      entry.message.includes(threat.id) ||
      (threat.findingId && entry.message.includes(threat.findingId))
  )
  return linked.slice(0, 6)
}

export function assignInvestigation(threatId: string, assignee = "compliance analyst"): void {
  const threat = threatService.getById(threatId)
  ledgerService.add({
    eventType: "audit",
    applicantId: threat?.applicantId ?? threatId,
    applicantName: threat?.signalLabel ?? "Investigation",
    message: `Investigation ${threatId} assigned to ${assignee}`,
    modelVersion: MODEL_VERSION,
    fairnessScore: 0.9,
  })
}

export function escalateInvestigation(threat: ThreatEvent): void {
  threatService.update(threat.id, {
    severity: threat.severity === "low" ? "medium" : threat.severity,
  })
  ledgerService.add({
    eventType: "alert",
    applicantId: threat.applicantId,
    applicantName: threat.signalLabel ?? threat.attackVector,
    message: `Investigation ${threat.id} escalated to compliance review`,
    severity: threat.severity,
    modelVersion: MODEL_VERSION,
    fairnessScore: 0.82,
  })
}

export function resolveInvestigation(threat: ThreatEvent): void {
  threatService.block(threat.id)
  ledgerService.add({
    eventType: "intervention",
    applicantId: threat.applicantId,
    applicantName: threat.signalLabel ?? threat.attackVector,
    message: `Investigation ${threat.id} resolved — mitigation recorded in ledger`,
    interventionType: "Proxy variable severed",
    modelVersion: MODEL_VERSION,
    fairnessScore: 0.94,
  })
}

export function getInvestigationStats() {
  return threatService.getStats()
}
