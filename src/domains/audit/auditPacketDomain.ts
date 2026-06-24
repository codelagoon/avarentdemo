import type { LedgerEntry } from "@/data/mockData"
import type { AuditPacket } from "@/services/auditPacketService"
import { auditPacketService } from "@/services/auditPacketService"
import { ledgerService } from "@/services/ledgerService"
import type { AuditPacketRepository } from "@/domains/shared/repositories"

export const AUDIT_PACKET_SYNC_CHANNELS = ["auditPacket", "ledger"] as const

export const auditPacketRepository: AuditPacketRepository = {
  getHistory: () => auditPacketService.getPacketHistory(),
  save: (packet) => {
    void packet
    // Persistence handled inside auditPacketService.generatePacket
  },
}

export function getDocumentationQueue(): LedgerEntry[] {
  const fromLedger = ledgerService
    .getAll()
    .filter(
      (e) =>
        e.eventType === "proof_signed" ||
        e.decision === "denied" ||
        e.decision === "escalated"
    )

  const packetIds = new Set(auditPacketService.getPacketHistory().map((p) => p.packetId))
  const fromPackets = ledgerService.getAll().filter((e) => packetIds.has(e.applicantId))

  const merged = new Map<string, LedgerEntry>()
  for (const entry of [...fromLedger, ...fromPackets]) {
    merged.set(entry.id, entry)
  }
  return [...merged.values()].slice(0, 12)
}

export function generateExamPacket(generatedBy = "Meridian Operator"): AuditPacket {
  const packet = auditPacketService.generatePacket(generatedBy)
  ledgerService.add({
    eventType: "proof_signed",
    applicantId: packet.packetId,
    applicantName: "Exam package",
    message: `Regulatory audit packet ${packet.packetId} generated`,
    modelVersion: "FNB-FAIR-v4.2.1",
    fairnessScore: 0.96,
  })
  return packet
}

export function downloadExamPacket(packet: AuditPacket): Promise<void> {
  return auditPacketService.downloadPacket(packet)
}

export function getPacketHistory(): AuditPacket[] {
  return auditPacketService.getPacketHistory()
}

export function approveDocumentation(entry: LedgerEntry): void {
  ledgerService.add({
    eventType: "audit",
    applicantId: entry.applicantId,
    applicantName: entry.applicantName,
    message: `Documentation approved for ${entry.id} — exam package updated`,
    decision: entry.decision,
    modelVersion: entry.modelVersion,
    fairnessScore: entry.fairnessScore,
  })
}

export function requestDocumentationRevision(entry: LedgerEntry): void {
  ledgerService.add({
    eventType: "alert",
    applicantId: entry.applicantId,
    applicantName: entry.applicantName,
    message: `Revision requested for ${entry.id}`,
    severity: "medium",
    modelVersion: entry.modelVersion,
    fairnessScore: entry.fairnessScore,
  })
}

export function routeToLegalReview(entry: LedgerEntry): void {
  ledgerService.add({
    eventType: "alert",
    applicantId: entry.applicantId,
    applicantName: entry.applicantName,
    message: `${entry.id} routed to legal review queue`,
    decision: "escalated",
    severity: "high",
    modelVersion: entry.modelVersion,
    fairnessScore: entry.fairnessScore,
  })
}
