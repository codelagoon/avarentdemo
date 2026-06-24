import { describe, expect, it } from "vitest"
import {
  mapThreatEventToRow,
  mapThreatRowToEvent,
  toApplicantRef,
} from "@/domains/shared/adapters"
import type { ThreatEvent } from "@/domains/shared/types"

const sampleThreat: ThreatEvent = {
  id: "THR-TEST-001",
  timestamp: "2026-06-20T10:15:00Z",
  applicantId: "APP-2026-084723",
  applicantName: "Mortgage approval rate — Hispanic / Latino",
  severity: "critical",
  attackVector: "Sequential Proxy Correlation Attack",
  proxyVariables: ["zip_code"],
  confidence: 0.97,
  blocked: true,
  modelScore: 0.32,
  description: "Test investigation",
  findingId: "FN-200",
  signalLabel: "Mortgage approval rate — Hispanic / Latino",
}

describe("workflow adapters", () => {
  it("stores opaque applicant refs without raw PII labels in applicant_name", () => {
    const row = mapThreatEventToRow(sampleThreat, "org-uuid")
    expect(row.applicant_ref).toBe(toApplicantRef(sampleThreat.applicantId))
    expect(row.applicant_name).toBe(sampleThreat.signalLabel)
    expect(row.applicant_id).toBe(row.applicant_ref)
  })

  it("round-trips threat rows through the domain model", () => {
    const row = mapThreatEventToRow(sampleThreat, "org-uuid")
    const event = mapThreatRowToEvent({
      id: "db-uuid",
      company_id: "org-uuid",
      external_id: sampleThreat.id,
      applicant_id: row.applicant_id,
      applicant_ref: row.applicant_ref,
      applicant_name: row.applicant_name,
      attack_vector: row.attack_vector,
      risk_score: row.risk_score,
      severity: row.severity,
      status: row.status,
      signal_label: row.signal_label,
      finding_id: row.finding_id,
      description: row.description,
      proxy_variables: row.proxy_variables,
      confidence: row.confidence,
      model_score: row.model_score,
      zip_code: row.zip_code,
      blocked: row.blocked,
      created_at: sampleThreat.timestamp,
    })

    expect(event.id).toBe(sampleThreat.id)
    expect(event.findingId).toBe("FN-200")
    expect(event.applicantId).toBe(row.applicant_ref)
  })
})

describe("mock data integrity", () => {
  it("uses unique findingIds across threat events", async () => {
    const { THREAT_EVENTS } = await import("@/data/mockData")
    const findingIds = THREAT_EVENTS.map((t) => t.findingId).filter(Boolean)
    expect(new Set(findingIds).size).toBe(findingIds.length)
  })
})
