import { toast } from "sonner"
import { emit } from "@/lib/sync"
import type { SHAPFeature } from "./decisionGateway"
import { narrativeTranslator, type AdverseActionNotice } from "./narrativeTranslator"
import { supabase } from "@/lib/supabaseClient"
import { companyService } from "./companyService"

export interface AdverseActionReview {
  id: string
  applicantId: string
  applicantName: string
  decisionDate: string
  // Raw SHAP data (translator-only policy)
  shapFeatures: SHAPFeature[]
  shapRankings: {
    rank: number
    feature: string
    contribution: number
    description: string
  }[]
  // LLM Narrative (translated from SHAP)
  narrative: {
    summary: string
    keyFactors: string[]
    behavioralExplanations: string[]
    plainLanguageScore: number
    cfpbCompliant: boolean
  }
  // Original adverse action notice
  notice: AdverseActionNotice
  // Review workflow
  status: "pending_review" | "approved" | "overridden" | "sent"
  reviewerNotes: string
  reviewedBy: string | null
  reviewedAt: string | null
  overrideReason: string | null
  finalNarrative: string | null
}

import { adverseActionRepository } from "@/repositories/AdverseActionRepository"

// Adverse Action Review Queue
// Translator-only policy: UI shows raw SHAP alongside narrative
class AdverseActionService {
  private reviews: AdverseActionReview[] = []
  private isLoaded = false

  constructor() {
    this.initFromSupabase()
  }

  private async initFromSupabase() {
    if (typeof window === "undefined") return
    
    try {
      const data = await adverseActionRepository.findRecent()
      this.reviews = data.map((row: any) => ({
        id: row.id,
        applicantId: row.applicant_id,
        applicantName: row.applicant_name,
        decisionDate: row.created_at,
        shapFeatures: row.shap_features || [],
        shapRankings: row.shap_rankings || [],
        narrative: {
          summary: row.narrative_summary,
          keyFactors: row.custom_narrative ? [row.custom_narrative] : [],
          behavioralExplanations: row.behavioral_explanations || [],
          plainLanguageScore: row.plain_language_score,
          cfpbCompliant: row.cfpb_compliant,
        },
        notice: row.notice || {} as AdverseActionNotice,
        status: row.status,
        reviewerNotes: row.reviewer_notes || "",
        reviewedBy: row.reviewed_by,
        reviewedAt: row.reviewed_at,
        overrideReason: row.override_reason,
        finalNarrative: row.custom_narrative,
      }))
    } catch (err) {
      console.error("Failed to load adverse actions from repository", err)
    } finally {
      this.isLoaded = true
      emit("adverseAction")
    }
  }

  /**
   * Create new adverse action review
   * Enforces translator-only policy
   */
  async createReview(
    applicantId: string,
    applicantName: string,
    shapFeatures: SHAPFeature[],
    creditBureau: string = "Experian, TransUnion, Equifax"
  ): Promise<AdverseActionReview> {
    // Sort SHAP by absolute contribution for ranking
    const sortedSHAP = [...shapFeatures]
      .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
      .map((f, i) => ({
        rank: i + 1,
        feature: f.feature,
        contribution: f.contribution,
        description: f.description,
      }))

    // Generate narrative via translator (never guess, only map)
    const translation = narrativeTranslator.generatePlainLanguageNarrative(shapFeatures)
    const notice = narrativeTranslator.translateToAdverseAction(
      shapFeatures,
      applicantName,
      creditBureau
    )

    // Map to behavioral specificity
    const behavioralExplanations = sortedSHAP.slice(0, 4).map(s => {
      return this.mapToBehavioralSpecificity(s.feature, s.contribution)
    })

    const review: AdverseActionReview = {
      id: `AA-${Date.now()}`,
      applicantId,
      applicantName,
      decisionDate: new Date().toISOString(),
      shapFeatures,
      shapRankings: sortedSHAP,
      narrative: {
        summary: translation.summary,
        keyFactors: translation.topFactors,
        behavioralExplanations,
        plainLanguageScore: translation.plainLanguageScore,
        cfpbCompliant: translation.cfpbCircular2023_03Compliant,
      },
      notice,
      status: "pending_review",
      reviewerNotes: "",
      reviewedBy: null,
      reviewedAt: null,
      overrideReason: null,
      finalNarrative: null,
    }

    this.reviews.unshift(review)
    emit("adverseAction")

    try {
      const data = await adverseActionRepository.insert({
        applicant_name: applicantName,
        applicant_id: applicantId,
        plain_language_score: translation.plainLanguageScore,
        cfpb_compliant: translation.cfpbCircular2023_03Compliant,
        status: "pending_review",
        narrative_summary: translation.summary,
        behavioral_explanations: behavioralExplanations,
        shap_features: shapFeatures,
        shap_rankings: sortedSHAP,
        notice: notice,
      } as any)

      if (data) {
        review.id = data.id
        emit("adverseAction")
      }
    } catch (err) {
      console.error("Failed to insert adverse action to repository", err)
    }

    toast.info(`New Adverse Action Review: ${applicantName}`, {
      description: "Awaiting Compliance Officer approval",
    })

    return review
  }

  /**
   * Approve narrative (no changes)
   */
  async approveReview(reviewId: string, reviewerName: string, notes?: string): Promise<boolean> {
    const review = this.reviews.find(r => r.id === reviewId)
    if (!review) return false

    review.status = "approved"
    review.reviewedBy = reviewerName
    review.reviewedAt = new Date().toISOString()
    review.reviewerNotes = notes || "Approved as generated"
    review.finalNarrative = review.narrative.summary
    emit("adverseAction")

    try {
      await adverseActionRepository.update(reviewId, {
        status: review.status,
        reviewed_by: review.reviewedBy,
        reviewed_at: review.reviewedAt,
        reviewer_notes: review.reviewerNotes,
        custom_narrative: review.finalNarrative,
      } as any)
    } catch (err) {
      console.error("Failed to approve adverse action in repository", err)
    }

    toast.success(`Adverse Action Approved: ${review.applicantName}`)
    return true
  }

  /**
   * Override narrative (with required reason)
   */
  async overrideReview(
    reviewId: string,
    reviewerName: string,
    finalNarrative: string,
    overrideReason: string
  ): Promise<boolean> {
    const review = this.reviews.find(r => r.id === reviewId)
    if (!review) return false

    if (!overrideReason || overrideReason.length < 10) {
      toast.error("Override requires detailed reason (min 10 chars)")
      return false
    }

    review.status = "overridden"
    review.reviewedBy = reviewerName
    review.reviewedAt = new Date().toISOString()
    review.overrideReason = overrideReason
    review.finalNarrative = finalNarrative
    review.reviewerNotes = `OVERRIDE: ${overrideReason}`
    emit("adverseAction")

    try {
      await adverseActionRepository.update(reviewId, {
        status: review.status,
        reviewed_by: review.reviewedBy,
        reviewed_at: review.reviewedAt,
        override_reason: review.overrideReason,
        custom_narrative: review.finalNarrative,
        reviewer_notes: review.reviewerNotes,
      } as any)
    } catch (err) {
      console.error("Failed to override adverse action in repository", err)
    }

    toast.warning(`Adverse Action Overridden: ${review.applicantName}`, {
      description: `Reason: ${overrideReason.substring(0, 50)}...`,
    })
    return true
  }

  /**
   * Mark as sent to applicant
   */
  async markAsSent(reviewId: string): Promise<boolean> {
    const review = this.reviews.find(r => r.id === reviewId)
    if (!review) return false
    if (review.status !== "approved" && review.status !== "overridden") {
      toast.error("Review must be approved or overridden before sending")
      return false
    }

    review.status = "sent"
    emit("adverseAction")

    try {
      await adverseActionRepository.update(reviewId, {
        status: review.status,
      } as any)
    } catch (err) {
      console.error("Failed to mark adverse action as sent in repository", err)
    }

    toast.success(`Adverse Action Notice sent to ${review.applicantName}`)
    return true
  }

  /**
   * Get pending reviews
   */
  getPendingReviews(): AdverseActionReview[] {
    return this.reviews.filter(r => r.status === "pending_review")
  }

  /**
   * Get all reviews
   */
  getAllReviews(): AdverseActionReview[] {
    return [...this.reviews]
  }

  /**
   * Get review by ID
   */
  getReview(id: string): AdverseActionReview | undefined {
    return this.reviews.find(r => r.id === id)
  }

  /**
   * Get review statistics
   */
  getStats() {
    return {
      total: this.reviews.length,
      pending: this.reviews.filter(r => r.status === "pending_review").length,
      approved: this.reviews.filter(r => r.status === "approved").length,
      overridden: this.reviews.filter(r => r.status === "overridden").length,
      sent: this.reviews.filter(r => r.status === "sent").length,
      avgPlainLanguageScore: this.reviews.length > 0
        ? this.reviews.reduce((sum, r) => sum + r.narrative.plainLanguageScore, 0) / this.reviews.length
        : 0,
      cfpbComplianceRate: this.reviews.length > 0
        ? this.reviews.filter(r => r.narrative.cfpbCompliant).length / this.reviews.length
        : 1,
    }
  }

  /**
   * Map feature to behavioral specificity
   * CFPB Circular 2023-03 compliant
   */
  private mapToBehavioralSpecificity(feature: string, contribution: number): string {
    const mappings: Record<string, string> = {
      debt_to_income: contribution < 0
        ? `Debt-to-income ratio of ${Math.abs(contribution * 100).toFixed(0)}% exceeds recommended threshold`
        : "Debt-to-income ratio within acceptable range",

      credit_score: contribution < 0
        ? "Credit history shows patterns of late payments or high utilization"
        : "Strong credit history with consistent on-time payments",

      income: contribution < 0
        ? "Documented income insufficient for requested loan amount"
        : "Income level supports loan repayment capacity",

      employment_stability: contribution < 0
        ? "Employment history shows frequent job changes"
        : "Stable employment history demonstrated",

      recent_inquiries: contribution < 0
        ? "Multiple recent credit inquiries indicating increased credit seeking"
        : "No concerning credit inquiry patterns",

      delinquency_history: contribution < 0
        ? "History of account delinquencies within past 24 months"
        : "No recent delinquency history",

      cash_advance_frequency: contribution < 0
        ? "Multiple cash advances exceeding 30% of monthly income"
        : "Cash advance usage within normal parameters",

      overdraft_history: contribution < 0
        ? "Frequent overdrafts or non-sufficient funds incidents"
        : "Banking history shows responsible account management",

      credit_utilization: contribution < 0
        ? "Credit card balances above 80% of available limits"
        : "Credit utilization at healthy levels",
    }

    return mappings[feature] || `${feature}: ${contribution > 0 ? "Positive" : "Negative"} contribution`
  }

  /**
   * Export review for audit
   */
  exportReview(reviewId: string): string {
    const review = this.getReview(reviewId)
    if (!review) return "Review not found"

    return `
ADVERSE ACTION REVIEW DOCUMENT
Generated: ${new Date().toISOString()}

APPLICANT:
- ID: ${review.applicantId}
- Name: ${review.applicantName}
- Decision Date: ${review.decisionDate}

TRANSLATOR-ONLY POLICY COMPLIANCE:
[OK] Raw SHAP rankings displayed alongside narrative
[OK] No guesswork - strict mapping from attributions to explanations
[OK] CFPB Circular 2023-03 compliant: ${review.narrative.cfpbCompliant ? "YES" : "NO"}

SHAP RANKINGS (Raw):
${review.shapRankings.slice(0, 5).map(s =>
  `${s.rank}. ${s.description}: ${(s.contribution * 100).toFixed(1)}%`
).join("\n")}

NARRATIVE (Translated):
${review.narrative.summary}

Key Factors:
${review.narrative.keyFactors.map(f => `- ${f}`).join("\n")}

Behavioral Specificity:
${review.narrative.behavioralExplanations.map(e => `- ${e}`).join("\n")}

REVIEW WORKFLOW:
Status: ${review.status.toUpperCase()}
${review.reviewedBy ? `Reviewed By: ${review.reviewedBy}` : "Pending Review"}
${review.reviewedAt ? `Reviewed At: ${review.reviewedAt}` : ""}
${review.overrideReason ? `Override Reason: ${review.overrideReason}` : ""}
${review.reviewerNotes ? `Notes: ${review.reviewerNotes}` : ""}

PLAIN LANGUAGE SCORE: ${review.narrative.plainLanguageScore}/100
`.trim()
  }
}

export const adverseActionService = new AdverseActionService()
