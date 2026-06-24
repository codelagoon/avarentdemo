import { BaseRepository } from "./BaseRepository"

export interface AdverseActionRecord {
  id: string
  company_id: string
  applicant_id: string
  applicant_name: string
  status: "pending_review" | "approved" | "overridden" | "sent"
  narrative_summary: string
  behavioral_explanations: string[]
  shap_features: any[]
  shap_rankings: any[]
  plain_language_score: number
  cfpb_compliant: boolean
  notice: any
  reviewer_notes?: string
  reviewed_by?: string
  reviewed_at?: string
  override_reason?: string
  custom_narrative?: string
  created_at: string
}

export class AdverseActionRepository extends BaseRepository<AdverseActionRecord> {
  constructor() {
    super("adverse_actions")
  }

  async findRecent(limit = 100): Promise<AdverseActionRecord[]> {
    const { data, error } = await this.query().order("created_at", { ascending: false }).limit(limit)
    if (error) throw error
    return data as AdverseActionRecord[]
  }

  async findPending(): Promise<AdverseActionRecord[]> {
    const { data, error } = await this.query().eq("status", "pending_review").order("created_at", { ascending: false })
    if (error) throw error
    return data as AdverseActionRecord[]
  }
}

export const adverseActionRepository = new AdverseActionRepository()
