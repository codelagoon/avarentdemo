import { BaseRepository } from "./BaseRepository"

export interface DecisionRecord {
  id: string
  company_id: string
  applicant_id: string
  applicant_name: string
  credit_score?: number
  income?: number
  loan_amount?: number
  debt_to_income?: number
  outcome: "approved" | "denied" | "referred"
  primary_score?: number
  fairness_score?: number
  tower?: "primary" | "fairness" | "circuit_breaker"
  shap_features: { feature: string; value: number; contribution: number; description: string }[]
  top_reasons: string[]
  circuit_breaker_triggered: boolean
  latency_ms?: number
  model_version?: string
  created_at: string
}

export class DecisionRepository extends BaseRepository<DecisionRecord> {
  constructor(serverTenantId?: string) {
    super("decision_events", serverTenantId)
  }

  async findRecent(limit = 100): Promise<DecisionRecord[]> {
    const { data, error } = await this.query().order("created_at", { ascending: false }).limit(limit)
    if (error) throw error
    return data as DecisionRecord[]
  }

  async findByApplicant(applicantId: string): Promise<DecisionRecord[]> {
    const { data, error } = await this.query().eq("applicant_id", applicantId)
    if (error) throw error
    return data as DecisionRecord[]
  }
}

export const decisionRepository = new DecisionRepository()
