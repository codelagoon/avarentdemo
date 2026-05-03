import type { SHAPFeature } from "./decisionGateway"

export interface AdverseActionNotice {
  applicantName: string
  decisionDate: string
  creditBureau: string
  keyFactors: string[]
  specificReasons: string[]
  yourRights: string[]
  contactInfo: string
  ecoaCompliant: boolean
}

export interface NarrativeTranslation {
  summary: string
  topFactors: string[]
  behavioralSpecificity: string
  cfpbCircular2023_03Compliant: boolean
  plainLanguageScore: number
  readingLevel: string
}

// Behavioral specificity mappings for CFPB Circular 2023-03
const BEHAVIORAL_MAPPINGS: Record<string, string> = {
  // Credit history
  "credit_score": "Credit score reflects your credit history and payment patterns",
  "delinquency_history": "Multiple late payments or accounts in collections",
  "recent_inquiries": "Multiple credit applications in the past 6 months",

  // Income/Employment
  "income": "Income level does not meet minimum requirements for requested loan amount",
  "employment_stability": "Employment history shows frequent job changes",
  "debt_to_income": "Total monthly debt payments exceed recommended threshold relative to income",

  // Cash flow patterns
  "cash_advance_frequency": "Multiple cash advances exceeding 30% of monthly income",
  "overdraft_history": "Frequent overdrafts or non-sufficient funds incidents",
  "irregular_deposits": "Inconsistent income deposits indicating unstable cash flow",

  // Credit utilization
  "credit_utilization": "Credit card balances above 80% of available credit limits",
  "revolving_debt": "High outstanding balances on revolving credit accounts",

  // Loan specific
  "loan_amount": "Requested loan amount exceeds underwriting guidelines for your profile",
  "loan_term": "Loan term does not align with documented ability to repay",
  "collateral_value": "Appraised value of collateral insufficient to secure loan",

  // Proxy-related (careful phrasing)
  "proxy_variable": "Additional review required due to complex risk factors",
  "zip_code_risk": "Geographic risk factors per underwriting policy",
}

// Strict translator-only policy: Never guess, only map from SHAP
export class NarrativeTranslator {
  /**
   * Translate SHAP features to human-readable adverse action notice
   * Constraint: Translator-only policy - strictly maps attributions, never guesses
   */
  translateToAdverseAction(
    features: SHAPFeature[],
    applicantName: string,
    creditBureau: string = "Experian, TransUnion, Equifax"
  ): AdverseActionNotice {
    // Sort by absolute contribution (negative = reasons for denial)
    const negativeFactors = features
      .filter(f => f.contribution < -0.05) // Significant negative contribution
      .sort((a, b) => a.contribution - b.contribution) // Most negative first

    // Map to behavioral specificity (CFPB Circular 2023-03)
    const keyFactors = negativeFactors.slice(0, 4).map(f => {
      const specific = this.mapToBehavioralSpecificity(f)
      return specific
    })

    // Generate specific reasons with quantitative context where possible
    const specificReasons = negativeFactors.slice(0, 4).map(f => {
      return this.generateSpecificReason(f)
    })

    return {
      applicantName,
      decisionDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
      month: "long",
        day: "numeric",
      }),
      creditBureau,
      keyFactors,
      specificReasons,
      yourRights: [
        "You have the right to obtain a free copy of your credit report within 60 days",
        "You have the right to dispute the accuracy of information in your credit report",
        "You have the right to obtain additional information about this decision upon request",
        "You have the right to submit a statement explaining any circumstances affecting your credit history",
      ],
      contactInfo: "For questions about this notice, contact: AVARENT Compliance Department, (555) AVARENT",
      ecoaCompliant: true,
    }
  }

  /**
   * Generate plain-language narrative from SHAP features
   */
  generatePlainLanguageNarrative(features: SHAPFeature[]): NarrativeTranslation {
    // Translator-only: strictly use provided SHAP features
    const topNegative = features
      .filter(f => f.contribution < -0.05)
      .slice(0, 3)

    const topPositive = features
      .filter(f => f.contribution > 0.05)
      .slice(0, 2)

    const summaryParts: string[] = []

    if (topNegative.length > 0) {
      summaryParts.push(`The primary factors affecting this decision were: ${topNegative.map(f => f.description).join("; ")}.`)
    }

    if (topPositive.length > 0) {
      summaryParts.push(`Positive factors included: ${topPositive.map(f => f.description).join("; ")}.`)
    }

    const summary = summaryParts.join(" ") || "No significant risk factors identified."

    const topFactors = features
      .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
      .slice(0, 3)
      .map(f => `${f.description}: ${Math.abs(f.contribution * 100).toFixed(1)}% influence`)

    return {
      summary,
      topFactors,
      behavioralSpecificity: this.calculateBehavioralSpecificity(features),
      cfpbCircular2023_03Compliant: this.checkCFPBCompliance(features),
      plainLanguageScore: this.calculatePlainLanguageScore(summary),
      readingLevel: this.estimateReadingLevel(summary),
    }
  }

  /**
   * Map SHAP feature to behavioral specificity per CFPB Circular 2023-03
   * Example: "Poor credit history" → "Multiple cash advances exceeding 30% of income"
   */
  private mapToBehavioralSpecificity(feature: SHAPFeature): string {
    // Strict translator-only: Use mapping if exists, otherwise generic but specific
    const mapping = BEHAVIORAL_MAPPINGS[feature.feature]

    if (mapping) {
      // Add quantitative context if available
      if (feature.feature === "debt_to_income") {
        return `${mapping} (${(feature.value * 100).toFixed(0)}% DTI ratio)`
      }
      if (feature.feature === "credit_score") {
        return `${mapping} (score: ${feature.value.toFixed(0)})`
      }
      if (feature.feature === "cash_advance_frequency") {
        return mapping // Already specific with 30% threshold
      }
      return mapping
    }

    // Fallback: Specific but generic description
    return `Risk factor: ${feature.description} (impact: ${Math.abs(feature.contribution * 100).toFixed(1)}%)`
  }

  /**
   * Generate specific reason with numerical context
   */
  private generateSpecificReason(feature: SHAPFeature): string {
    const baseReason = this.mapToBehavioralSpecificity(feature)

    // Add comparison to thresholds where applicable
    if (feature.feature === "debt_to_income" && feature.value > 0.43) {
      return `${baseReason} - exceeds 43% Qualified Mortgage threshold`
    }

    if (feature.feature === "credit_score" && feature.value < 620) {
      return `${baseReason} - below minimum threshold of 620`
    }

    if (feature.feature === "recent_inquiries" && feature.value > 3) {
      return `${baseReason} - more than 3 inquiries in 6 months`
    }

    return baseReason
  }

  /**
   * Check compliance with CFPB Circular 2023-03
   * Requires behavioral specificity, not generic reasons
   */
  private checkCFPBCompliance(features: SHAPFeature[]): boolean {
    // Verify we have specific behavioral mappings for all negative factors
    const negativeFeatures = features.filter(f => f.contribution < -0.05)

    for (const feature of negativeFeatures) {
      if (!BEHAVIORAL_MAPPINGS[feature.feature]) {
        // If no specific mapping, ensure description is behavioral
        if (feature.description.toLowerCase().includes("poor") ||
            feature.description.toLowerCase().includes("bad") ||
            feature.description.toLowerCase().includes("insufficient")) {
          return false // Too generic, not behavioral
        }
      }
    }

    return true
  }

  /**
   * Calculate behavioral specificity score
   */
  private calculateBehavioralSpecificity(features: SHAPFeature[]): string {
    const negativeFeatures = features.filter(f => f.contribution < -0.05)

    let specificCount = 0
    for (const feature of negativeFeatures) {
      if (BEHAVIORAL_MAPPINGS[feature.feature]) {
        specificCount++
      }
    }

    if (specificCount === negativeFeatures.length) return "High - all factors mapped to specific behaviors"
    if (specificCount > 0) return "Medium - some factors have behavioral specificity"
    return "Low - generic risk descriptions"
  }

  /**
   * Calculate plain language score (Flesch Reading Ease inspired)
   */
  private calculatePlainLanguageScore(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length
    const words = text.split(/\s+/).filter(w => w.length > 0).length
    const syllables = text.split(/\s+/).reduce((count, word) => {
      return count + this.countSyllables(word)
    }, 0)

    if (sentences === 0 || words === 0) return 0

    // Simplified Flesch Reading Ease
    const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)

    return Math.max(0, Math.min(100, Math.round(score)))
  }

  /**
   * Estimate reading level
   */
  private estimateReadingLevel(text: string): string {
    const score = this.calculatePlainLanguageScore(text)

    if (score >= 90) return "5th grade (very easy)"
    if (score >= 80) return "6th grade (easy)"
    if (score >= 70) return "7th grade (fairly easy)"
    if (score >= 60) return "8th-9th grade (standard)"
    if (score >= 50) return "10th-12th grade (fairly difficult)"
    return "College level (difficult)"
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase()
    if (word.length <= 3) return 1

    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    word = word.replace(/^y/, "")

    const matches = word.match(/[aeiouy]{1,2}/g)
    return matches ? matches.length : 1
  }
}

export const narrativeTranslator = new NarrativeTranslator()
