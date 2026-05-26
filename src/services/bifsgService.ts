import { toast } from "sonner"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase connection for persistent caching (Option B)
// Enforces a 24-hour TTL shared cache across all Next.js/Vercel serverless instances
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://zpjjoskdaouhzinijztf.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwampvc2tkYW91aHppbmlqenRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3OTc2NzEsImV4cCI6MjA4OTM3MzY3MX0.pYrFFQfM2IDg9r1rs-HLDUAeFXQ3fBGhJS6ZB9oenW4"
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface BIFSGInput {
  firstName: string
  surname: string
  zipCode: string
  censusTract?: string
}

export interface BIFSGResult {
  // Probabilities for race/ethnicity (Bayesian Improved estimates)
  probabilities: {
    white: number
    black: number
    hispanic: number
    asian: number
    other: number
  }
  // Gender probability
  genderProbability: {
    male: number
    female: number
  }
  // Confidence metrics
  confidence: number
  surnameMatch: boolean
  geoMatch: boolean
  // Privacy-safe aggregated data only
  censusBlockGroup: string
  // Never expose individual PII
}

export interface ProxyAuditResult {
  auditId: string
  timestamp: string
  proxyType: "ZIP_CODE" | "SURNAME" | "CENSUS_TRACT" | "COMBINATION" | "NONE"
  severity: "critical" | "high" | "medium" | "low"
  inferredProtectedClass: string
  confidence: number
  demographicImputed: boolean
  recommendedAction: "SEVER" | "FLAG" | "AUDIT" | "NONE"
  explanation: string
}

export interface FairnessDriftAlert {
  metric: string
  threshold: number
  currentValue: number
  delta: number
  timestamp: string
  severity: "critical" | "warning" | "info"
  recommendedAction: string
}

// BIFSG (Bayesian Improved First Name Surname Geocoding)
// Uses Census surname tables and block group demographics
class BIFSGService {
  private readonly SURNAME_DATABASE: Record<string, { race: string; prob: number }[]> = {
    // Simplified surname-race mapping (in production, use full Census data)
    "SMITH": [{ race: "white", prob: 0.73 }, { race: "black", prob: 0.22 }],
    "JOHNSON": [{ race: "white", prob: 0.62 }, { race: "black", prob: 0.33 }],
    "WILLIAMS": [{ race: "white", prob: 0.53 }, { race: "black", prob: 0.40 }],
    "BROWN": [{ race: "white", prob: 0.60 }, { race: "black", prob: 0.35 }],
    "GARCIA": [{ race: "hispanic", prob: 0.92 }],
    "RODRIGUEZ": [{ race: "hispanic", prob: 0.94 }],
    "MARTINEZ": [{ race: "hispanic", prob: 0.91 }],
    "LOPEZ": [{ race: "hispanic", prob: 0.93 }],
    "CHEN": [{ race: "asian", prob: 0.95 }],
    "WANG": [{ race: "asian", prob: 0.96 }],
    "LI": [{ race: "asian", prob: 0.94 }],
    "ZHANG": [{ race: "asian", prob: 0.97 }],
    "KIM": [{ race: "asian", prob: 0.93 }],
    "PATEL": [{ race: "asian", prob: 0.91 }],
  }

  private readonly FIRST_NAME_GENDER: Record<string, { male: number; female: number }> = {
    "JOHN": { male: 0.99, female: 0.01 },
    "MARY": { male: 0.01, female: 0.99 },
    "JAMES": { male: 0.99, female: 0.01 },
    "PATRICIA": { male: 0.01, female: 0.99 },
    "ROBERT": { male: 0.99, female: 0.01 },
    "JENNIFER": { male: 0.01, female: 0.99 },
    "MICHAEL": { male: 0.99, female: 0.01 },
    "LINDA": { male: 0.01, female: 0.99 },
  }

  // Census block group demographics (simplified)
  private readonly CENSUS_DEMOGRAPHICS: Record<string, { white: number; black: number; hispanic: number; asian: number }> = {
    "60601": { white: 0.75, black: 0.08, hispanic: 0.10, asian: 0.05 },
    "60602": { white: 0.70, black: 0.15, hispanic: 0.10, asian: 0.03 },
    "77001": { white: 0.25, black: 0.20, hispanic: 0.50, asian: 0.03 },
    "33101": { white: 0.15, black: 0.15, hispanic: 0.65, asian: 0.03 },
    "90001": { white: 0.10, black: 0.08, hispanic: 0.78, asian: 0.02 },
  }

  private readonly DPD_THRESHOLD = 0.05 // ΔDPD > 0.05 triggers alert
  private fairnessDriftHistory: Map<string, number[]> = new Map()

  /**
   * BIFSG Inference - Private Schema Only
   * Race/gender data NEVER exposed to public API
   */
  private inferDemographics(input: BIFSGInput): BIFSGResult {
    const surnameUpper = input.surname.toUpperCase()
    const firstNameUpper = input.firstName.toUpperCase()
    const zipPrefix = input.zipCode.substring(0, 5)

    // Step 1: Get surname probabilities
    const surnameProbs = this.SURNAME_DATABASE[surnameUpper] || [
      { race: "white", prob: 0.70 },
      { race: "black", prob: 0.13 },
      { race: "hispanic", prob: 0.13 },
      { race: "asian", prob: 0.04 },
    ]

    // Step 2: Get geography (census block) demographics
    const geoDemo = this.CENSUS_DEMOGRAPHICS[zipPrefix] || {
      white: 0.60,
      black: 0.13,
      hispanic: 0.18,
      asian: 0.06,
    }

    // Step 3: Bayesian Update
    // P(Race|Name,Geo) ∝ P(Name|Race) × P(Geo|Race) × P(Race)
    const surnameMap = Object.fromEntries(surnameProbs.map(s => [s.race, s.prob]))

    // Bayesian calculation
    const likelihood = {
      white: (surnameMap["white"] || 0.70) * geoDemo.white,
      black: (surnameMap["black"] || 0.13) * geoDemo.black,
      hispanic: (surnameMap["hispanic"] || 0.13) * geoDemo.hispanic,
      asian: (surnameMap["asian"] || 0.04) * geoDemo.asian,
      other: 0.03,
    }

    // Normalize
    const total = Object.values(likelihood).reduce((a, b) => a + b, 0)
    const probabilities = {
      white: likelihood.white / total,
      black: likelihood.black / total,
      hispanic: likelihood.hispanic / total,
      asian: likelihood.asian / total,
      other: likelihood.other / total,
    }

    // Gender inference from first name
    const genderPrior = this.FIRST_NAME_GENDER[firstNameUpper] || { male: 0.50, female: 0.50 }
    const genderProbability = {
      male: genderPrior.male,
      female: genderPrior.female,
    }

    // Calculate confidence based on match quality
    const surnameMatch = !!this.SURNAME_DATABASE[surnameUpper]
    const geoMatch = !!this.CENSUS_DEMOGRAPHICS[zipPrefix]
    const confidence = surnameMatch && geoMatch ? 0.85 : surnameMatch || geoMatch ? 0.60 : 0.40

    return {
      probabilities,
      genderProbability,
      confidence,
      surnameMatch,
      geoMatch,
      censusBlockGroup: input.zipCode.substring(0, 5),
    }
  }

  /**
   * Proxy Audit - Detects if ZIP/surname combination creates proxy
   * Data isolation: Demographics stay in private schema
   */
  auditForProxy(
    input: BIFSGInput,
    _creditDecision: { approved: boolean; score: number }
  ): ProxyAuditResult {
    // Infer demographics (private schema only)
    const demo = this.inferDemographics(input)

    // Check for high-confidence demographic inference
    const maxProb = Math.max(...Object.values(demo.probabilities))
    const dominantRace = Object.entries(demo.probabilities)
      .sort((a, b) => b[1] - a[1])[0][0]

    let proxyType: ProxyAuditResult["proxyType"] = "NONE"
    let severity: ProxyAuditResult["severity"] = "low"
    let recommendedAction: ProxyAuditResult["recommendedAction"] = "NONE"

    // Detect surname proxy
    if (demo.surnameMatch && maxProb > 0.80) {
      proxyType = "SURNAME"
      severity = "high"
      recommendedAction = "SEVER"
    }

    // Detect ZIP code proxy (high geo match + race concentration)
    if (demo.geoMatch) {
      const geoRaceMax = Math.max(
        this.CENSUS_DEMOGRAPHICS[input.zipCode.substring(0, 5)]?.white || 0.60,
        this.CENSUS_DEMOGRAPHICS[input.zipCode.substring(0, 5)]?.black || 0.13,
        this.CENSUS_DEMOGRAPHICS[input.zipCode.substring(0, 5)]?.hispanic || 0.18,
        this.CENSUS_DEMOGRAPHICS[input.zipCode.substring(0, 5)]?.asian || 0.06,
      )

      if (geoRaceMax > 0.70) {
        proxyType = proxyType === "NONE" ? "ZIP_CODE" : "COMBINATION"
        severity = severity === "high" ? "critical" : "high"
        recommendedAction = recommendedAction === "SEVER" ? "SEVER" : "FLAG"
      }
    }

    // Combined surname + ZIP is most dangerous
    if (demo.surnameMatch && demo.geoMatch && maxProb > 0.75) {
      proxyType = "COMBINATION"
      severity = "critical"
      recommendedAction = "SEVER"
    }

    return {
      auditId: `AUDIT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      proxyType,
      severity,
      inferredProtectedClass: dominantRace,
      confidence: maxProb,
      demographicImputed: true,
      recommendedAction,
      explanation: this.generateProxyExplanation(proxyType, dominantRace, maxProb),
    }
  }

  /**
   * Monitor Fairness Drift
   * Alert if ΔDPD (Delta in Default Probability by Demographic) > 0.05
   */
  monitorFairnessDrift(
    demographicGroup: string,
    currentDPD: number
  ): FairnessDriftAlert | null {
    const history = this.fairnessDriftHistory.get(demographicGroup) || []

    // Add current value
    history.push(currentDPD)
    if (history.length > 30) history.shift() // Keep 30 observations
    this.fairnessDriftHistory.set(demographicGroup, history)

    if (history.length < 2) return null

    // Calculate delta from baseline (first 10 observations average)
    const baseline = history.slice(0, Math.min(10, history.length)).reduce((a, b) => a + b, 0) / Math.min(10, history.length)
    const delta = Math.abs(currentDPD - baseline)

    if (delta > this.DPD_THRESHOLD) {
      const alert: FairnessDriftAlert = {
        metric: "DPD (Default Probability by Demographic)",
        threshold: this.DPD_THRESHOLD,
        currentValue: currentDPD,
        delta,
        timestamp: new Date().toISOString(),
        severity: delta > 0.10 ? "critical" : "warning",
        recommendedAction: delta > 0.10
          ? "Immediate: Retrain model with fairness constraints"
          : "Schedule bias audit within 48 hours",
      }

      toast.warning(`Fairness Drift Alert: ${demographicGroup} ΔDPD = ${(delta * 100).toFixed(2)}%`)
      return alert
    }

    return null
  }

  /**
   * Private Schema Accessor
   * All BIFSG data isolated here, never exposed to public API
   */
  getPrivateDemographics(input: BIFSGInput): BIFSGResult {
    return this.inferDemographics(input)
  }

  /**
   * Check if data is in private schema (for audit logging)
   */
  isPrivateSchema(): boolean {
    return true // Always returns true - this is the private schema
  }

  /**
   * Fetch from Supabase BISG cache table (Option B - Persistent Caching)
   * Surname + Zip Code composite key cache, with 24-hour TTL expiration constraint.
   */
  async getCachedResult(surname: string, zipCode: string): Promise<{ calculated_air: number; calculated_spd: number } | null> {
    try {
      const { data, error } = await supabase
        .from("bisg_cache")
        .select("calculated_air, calculated_spd")
        .eq("surname", surname.toUpperCase())
        .eq("zip_code", zipCode)
        .gt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .single()

      if (error || !data) return null
      return {
        calculated_air: Number(data.calculated_air),
        calculated_spd: Number(data.calculated_spd)
      }
    } catch (e) {
      console.warn("Failed to read from Supabase bisg_cache table:", e)
      return null
    }
  }

  /**
   * Write to Supabase BISG cache table (Option B - Persistent Caching)
   */
  async setCachedResult(surname: string, zipCode: string, air: number, spd: number): Promise<void> {
    try {
      await supabase
        .from("bisg_cache")
        .upsert({
          surname: surname.toUpperCase(),
          zip_code: zipCode,
          calculated_air: air,
          calculated_spd: spd,
          created_at: new Date().toISOString()
        })
    } catch (e) {
      console.warn("Failed to write to Supabase bisg_cache table:", e)
    }
  }

  private generateProxyExplanation(
    proxyType: ProxyAuditResult["proxyType"],
    race: string,
    confidence: number
  ): string {
    const explanations: Record<ProxyAuditResult["proxyType"], string> = {
      ZIP_CODE: `ZIP code strongly correlates with ${race} demographic (${(confidence * 100).toFixed(0)}% confidence). May proxy for race in credit decisions.`,
      SURNAME: `Surname strongly indicates ${race} ethnicity (${(confidence * 100).toFixed(0)}% confidence). Potential proxy variable detected.`,
      CENSUS_TRACT: `Census tract demographics show high ${race} concentration. Geographic proxy risk.`,
      COMBINATION: `CRITICAL: Combined surname and ZIP code create high-confidence proxy for ${race} (${(confidence * 100).toFixed(0)}%). Sever immediately.`,
      NONE: `No significant proxy variables detected.`,
    }
    return explanations[proxyType]
  }
}

export const bifsgService = new BIFSGService()
