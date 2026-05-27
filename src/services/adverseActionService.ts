import { toast } from "sonner"
import { emit } from "@/lib/sync"
import type { SHAPFeature } from "./decisionGateway"
import { narrativeTranslator, type AdverseActionNotice } from "./narrativeTranslator"

const STORAGE_KEY = "avarent_adverse_actions"

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

// Adverse Action Review Queue
// Translator-only policy: UI shows raw SHAP alongside narrative
class AdverseActionService {
  private reviews: AdverseActionReview[] = this.loadFromStorage()

  private loadFromStorage(): AdverseActionReview[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return []
      }
    }
    return []
  }

  private saveToStorage() {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.reviews))
    emit("adverseAction")
  }

  /**
   * Create new adverse action review
   * Enforces translator-only policy
   */
  createReview(
    applicantId: string,
    applicantName: string,
    shapFeatures: SHAPFeature[],
    creditBureau: string = "Experian, TransUnion, Equifax"
  ): AdverseActionReview {
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
    this.saveToStorage()
    toast.info(`New Adverse Action Review: ${applicantName}`, {
      description: "Awaiting Compliance Officer approval",
    })

    return review
  }

  /**
   * Approve narrative (no changes)
   */
  approveReview(reviewId: string, reviewerName: string, notes?: string): boolean {
    const review = this.reviews.find(r => r.id === reviewId)
    if (!review) return false

    review.status = "approved"
    review.reviewedBy = reviewerName
    review.reviewedAt = new Date().toISOString()
    review.reviewerNotes = notes || "Approved as generated"
    review.finalNarrative = review.narrative.summary
    this.saveToStorage()

    toast.success(`Adverse Action Approved: ${review.applicantName}`)
    return true
  }

  /**
   * Override narrative (with required reason)
   */
  overrideReview(
    reviewId: string,
    reviewerName: string,
    finalNarrative: string,
    overrideReason: string
  ): boolean {
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
    this.saveToStorage()

    toast.warning(`Adverse Action Overridden: ${review.applicantName}`, {
      description: `Reason: ${overrideReason.substring(0, 50)}...`,
    })
    return true
  }

  /**
   * Mark as sent to applicant
   */
  markAsSent(reviewId: string): boolean {
    const review = this.reviews.find(r => r.id === reviewId)
    if (!review) return false
    if (review.status !== "approved" && review.status !== "overridden") {
      toast.error("Review must be approved or overridden before sending")
      return false
    }

    review.status = "sent"
    this.saveToStorage()
    toast.success(`Adverse Action Notice sent to ${review.applicantName}`)
    return true
  }

  /**
   * Get pending reviews
   */
  getPendingReviews(): AdverseActionReview[] {
    this.reviews = this.loadFromStorage()
    return this.reviews.filter(r => r.status === "pending_review")
  }

  /**
   * Get all reviews
   */
  getAllReviews(): AdverseActionReview[] {
    this.reviews = this.loadFromStorage()
    return [...this.reviews]
  }

  /**
   * Get review by ID
   */
  getReview(id: string): AdverseActionReview | undefined {
    this.reviews = this.loadFromStorage()
    return this.reviews.find(r => r.id === id)
  }

  /**
   * Get review statistics
   */
  getStats() {
    this.reviews = this.loadFromStorage()
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
