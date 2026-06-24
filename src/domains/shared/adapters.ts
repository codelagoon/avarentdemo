import type { LedgerEntry, LedgerEventType, ThreatEvent, ThreatSeverity } from "@/domains/shared/types"
import { createHash } from "crypto"

/** Deterministic opaque ref from a seed — no raw PII stored in Supabase. */
export function toApplicantRef(seed: string): string {
  const hash = createHash("sha256").update(seed).digest("hex").slice(0, 16)
  return `REF-${hash}`
}

export interface ThreatLogRow {
  id: string
  company_id: string
  external_id: string | null
  applicant_id: string
  applicant_ref: string | null
  applicant_name: string
  attack_vector: string
  risk_score: number
  severity: string
  status: string
  signal_label: string | null
  finding_id: string | null
  description: string | null
  proxy_variables: string[] | null
  confidence: number | null
  model_score: number | null
  zip_code: string | null
  blocked: boolean | null
  created_at: string
}

export interface LedgerEventRow {
  id: string
  company_id: string
  external_id: string | null
  applicant_id: string
  applicant_ref: string | null
  decision_event: string
  previous_hash: string
  current_hash: string
  seal_signature: string
  event_type: string | null
  model_version: string | null
  fairness_score: number | null
  severity: string | null
  created_at: string
}

export function mapThreatRowToEvent(row: ThreatLogRow): ThreatEvent {
  const label =
    row.signal_label ??
    (row.applicant_name && !row.applicant_name.includes(".")
      ? row.applicant_name
      : "Aggregate cohort signal")

  return {
    id: row.external_id ?? row.id,
    timestamp: row.created_at,
    applicantId: row.applicant_ref ?? row.applicant_id,
    applicantName: label,
    severity: row.severity as ThreatSeverity,
    attackVector: row.attack_vector,
    proxyVariables: row.proxy_variables ?? [],
    confidence: Number(row.confidence ?? 0),
    blocked: row.blocked ?? row.status === "resolved",
    modelScore: Number(row.model_score ?? 0),
    zipCode: row.zip_code ?? undefined,
    description: row.description ?? row.attack_vector,
    findingId: row.finding_id ?? undefined,
    signalLabel: row.signal_label ?? undefined,
  }
}

export function mapThreatEventToRow(
  event: ThreatEvent,
  organizationId: string
): Omit<ThreatLogRow, "id" | "created_at" | "company_id" | "risk_score" | "status"> & {
  company_id: string
  risk_score: number
  status: string
} {
  const applicantRef = toApplicantRef(event.applicantId)
  return {
    company_id: organizationId,
    external_id: event.id,
    applicant_id: applicantRef,
    applicant_ref: applicantRef,
    applicant_name: event.signalLabel ?? "Aggregate signal",
    attack_vector: event.attackVector,
    risk_score: Math.round(event.modelScore * 100),
    severity: event.severity,
    status: event.blocked ? "resolved" : "unresolved",
    signal_label: event.signalLabel ?? event.applicantName,
    finding_id: event.findingId ?? null,
    description: event.description,
    proxy_variables: event.proxyVariables,
    confidence: event.confidence,
    model_score: event.modelScore,
    zip_code: event.zipCode ?? null,
    blocked: event.blocked,
  }
}

function inferLedgerEventType(message: string, explicit?: string | null): LedgerEventType {
  if (explicit && ["decision", "intervention", "alert", "audit", "proof_signed"].includes(explicit)) {
    return explicit as LedgerEventType
  }
  const lower = message.toLowerCase()
  if (lower.includes("proof") || lower.includes("signed")) return "proof_signed"
  if (lower.includes("intervention") || lower.includes("resolved")) return "intervention"
  if (lower.includes("alert") || lower.includes("escalat")) return "alert"
  if (lower.includes("decision")) return "decision"
  return "audit"
}

export function mapLedgerRowToEntry(row: LedgerEventRow): LedgerEntry {
  const message = row.decision_event
  const eventType = inferLedgerEventType(message, row.event_type)
  const label = row.applicant_ref ?? row.applicant_id

  return {
    id: row.external_id ?? row.id,
    timestamp: row.created_at,
    eventType,
    applicantId: label,
    applicantName: "Aggregate record",
    hash: row.current_hash,
    prevHash: row.previous_hash,
    severity: (row.severity as ThreatSeverity | undefined) ?? undefined,
    modelVersion: row.model_version ?? "FNB-FAIR-v4.2.1",
    fairnessScore: Number(row.fairness_score ?? 0),
    message,
  }
}

export function mapLedgerEntryToRow(
  entry: LedgerEntry,
  organizationId: string
): Omit<LedgerEventRow, "id" | "created_at" | "company_id" | "seal_signature"> & {
  company_id: string
  seal_signature: string
} {
  const applicantRef = toApplicantRef(entry.applicantId)
  return {
    company_id: organizationId,
    external_id: entry.id,
    applicant_id: applicantRef,
    applicant_ref: applicantRef,
    decision_event: entry.message,
    previous_hash: entry.prevHash,
    current_hash: entry.hash,
    seal_signature: `meridian:sha256:${entry.hash}`,
    event_type: entry.eventType,
    model_version: entry.modelVersion,
    fairness_score: entry.fairnessScore,
    severity: entry.severity ?? null,
  }
}
