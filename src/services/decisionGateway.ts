import { toast } from "sonner"

export type DecisionOutcome = "approved" | "denied" | "referred"
export type DecisionTower = "primary" | "fairness" | "circuit_breaker"

export interface DecisionInput {
  applicantId: string
  applicantName: string
  creditScore: number
  debtToIncome: number
  loanAmount: number
  income: number
  employmentYears: number
  zipCode: string
  hasDelinquencies: boolean
  inquiriesLast6Months: number
}

export interface SHAPFeature {
  feature: string
  value: number
  contribution: number
  description: string
}

export interface DecisionResult {
  outcome: DecisionOutcome
  finalDecision: "Pass" | "Refer"
  primaryScore: number
  fairnessScore: number
  latencyMs: number
  tower: DecisionTower
  shapFeatures: SHAPFeature[]
  top3Reasons: string[]
  circuitBreakerTriggered?: boolean
  adverseActionNotice?: string
  timestamp: string
}

export interface CircuitBreakerState {
  failures: number
  lastFailureTime: number
  isOpen: boolean
  consecutiveSuccesses: number
}

const CIRCUIT_BREAKER_THRESHOLD = 3
const CIRCUIT_BREAKER_TIMEOUT = 30000 // 30 seconds
const FAIRNESS_AUDIT_TIMEOUT = 150 // ms
const MAX_LATENCY = 400 // ms

class DecisionGateway {
  private circuitBreaker: CircuitBreakerState = {
    failures: 0,
    lastFailureTime: 0,
    isOpen: false,
    consecutiveSuccesses: 0,
  }

  private primaryModelLatency = 80 // Simulated latency
  private fairnessAuditLatency = 120 // Simulated latency

  async evaluate(input: DecisionInput): Promise<DecisionResult> {
    const startTime = performance.now()

    // Check circuit breaker
    if (this.isCircuitBreakerOpen()) {
      return this.createCircuitBreakerResult(input, startTime)
    }

    try {
      // Tower 1: Primary Risk Assessment (< 200ms)
      const primaryResult = await this.runPrimaryModel(input)

      // Tower 2: Fairness Audit with timeout
      let fairnessResult: { score: number; passed: boolean; features: SHAPFeature[] } | null = null
      let fairnessTimeout = false

      try {
        fairnessResult = await Promise.race([
          this.runFairnessAudit(input, primaryResult),
          this.createTimeout(FAIRNESS_AUDIT_TIMEOUT),
        ])
      } catch (timeout) {
        fairnessTimeout = true
        this.recordFailure()
      }

      const latency = Math.round(performance.now() - startTime)

      // Circuit breaker: If fairness audit hangs, refer to manual underwriting
      if (fairnessTimeout || !fairnessResult) {
        return this.createReferralResult(input, primaryResult, latency, "fairness_audit_timeout")
      }

      // Check total latency constraint
      if (latency > MAX_LATENCY) {
        return this.createReferralResult(input, primaryResult, latency, "latency_exceeded")
      }

      // Calculate final decision
      const finalScore = this.calibrateScore(primaryResult.score, fairnessResult.score)
      const outcome = this.determineOutcome(finalScore, primaryResult, fairnessResult)

      // Record success
      this.recordSuccess()

      return {
        outcome,
        finalDecision: outcome === "approved" ? "Pass" : "Refer",
        primaryScore: primaryResult.score,
        fairnessScore: fairnessResult.score,
        latencyMs: latency,
        tower: outcome === "referred" ? "circuit_breaker" : "fairness",
        shapFeatures: fairnessResult.features,
        top3Reasons: this.extractTop3Reasons(fairnessResult.features),
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      this.recordFailure()
      const latency = Math.round(performance.now() - startTime)
      return this.createReferralResult(input, { score: 0.5, riskLevel: "medium" }, latency, "error")
    }
  }

  private async runPrimaryModel(input: DecisionInput): Promise<{ score: number; riskLevel: string }> {
    // Simulate primary model latency
    await this.delay(this.primaryModelLatency)

    // Calculate base risk score (simplified model)
    let score = 0.5

    // Credit score weight: 35%
    score += (input.creditScore - 600) / 300 * 0.35

    // DTI weight: 30%
    score += (1 - input.debtToIncome) * 0.30

    // Income weight: 20%
    score += Math.min(input.income / 100000, 1) * 0.20

    // Employment stability: 10%
    score += Math.min(input.employmentYears / 5, 1) * 0.10

    // Delinquency penalty: -5%
    if (input.hasDelinquencies) score -= 0.05

    // Inquiry penalty: -2% per inquiry
    score -= input.inquiriesLast6Months * 0.02

    // Clamp to [0, 1]
    score = Math.max(0, Math.min(1, score))

    const riskLevel = score > 0.7 ? "low" : score > 0.4 ? "medium" : "high"

    return { score, riskLevel }
  }

  private async runFairnessAudit(
    input: DecisionInput,
    _primaryResult: { score: number; riskLevel: string }
  ): Promise<{ score: number; passed: boolean; features: SHAPFeature[] }> {
    // Simulate fairness audit latency
    await this.delay(this.fairnessAuditLatency)

    // Generate SHAP-like feature attributions
    const features: SHAPFeature[] = [
      {
        feature: "debt_to_income",
        value: input.debtToIncome,
        contribution: -0.25,
        description: "Debt-to-income ratio",
      },
      {
        feature: "credit_score",
        value: input.creditScore,
        contribution: 0.35,
        description: "Credit score",
      },
      {
        feature: "income",
        value: input.income,
        contribution: 0.20,
        description: "Annual income",
      },
      {
        feature: "employment_stability",
        value: input.employmentYears,
        contribution: 0.15,
        description: "Employment history",
      },
      {
        feature: "recent_inquiries",
        value: input.inquiriesLast6Months,
        contribution: -0.10,
        description: "Recent credit inquiries",
      },
      {
        feature: "delinquency_history",
        value: input.hasDelinquencies ? 1 : 0,
        contribution: input.hasDelinquencies ? -0.05 : 0.02,
        description: "Delinquency history",
      },
    ]

    // Check for proxy variables (simplified)
    const proxyDetected = this.detectProxyVariables(input)
    if (proxyDetected) {
      features.push({
        feature: "proxy_variable",
        value: 1,
        contribution: -0.15,
        description: `Proxy detected: ${proxyDetected}`,
      })
    }

    // Calculate fairness score
    const rawScore = features.reduce((sum, f) => sum + f.contribution, 0.5)
    const score = Math.max(0, Math.min(1, rawScore))

    // Pass if no proxies and score > 0.6
    const passed = !proxyDetected && score > 0.6

    return { score, passed, features }
  }

  private detectProxyVariables(input: DecisionInput): string | null {
    // Check ZIP code as potential proxy for race/income
    const proxyZipPrefixes = ["606", "770", "331", "900"] // Simplified proxy detection
    if (proxyZipPrefixes.some(prefix => input.zipCode.startsWith(prefix))) {
      if (input.income < 50000) {
        return "ZIP_CODE_INCOME_PROXY"
      }
    }

    // Simulate occasional surname proxy detection
    if (input.applicantName.length > 15 && Math.random() > 0.9) {
      return "SURNAME_ENTROPY_PROXY"
    }

    return null
  }

  private calibrateScore(primaryScore: number, fairnessScore: number): number {
    // Probit-inspired calibration: y* = α + r + θ·φ(s) + ε
    // Simplified: weighted combination with fairness penalty
    const alpha = 0.3 // Base intercept
    const theta = 0.6 // Primary weight
    const phi = 0.4   // Fairness weight

    // Calibrated score
    const calibrated = alpha + theta * primaryScore + phi * fairnessScore

    // Apply probit-like transformation (s-curve)
    const probit = 1 / (1 + Math.exp(-4 * (calibrated - 0.5)))

    return Math.max(0, Math.min(1, probit))
  }

  private determineOutcome(
    score: number,
    _primary: { score: number; riskLevel: string },
    fairness: { score: number; passed: boolean }
  ): DecisionOutcome {
    // Pass if score > 0.65 and fairness passed
    if (score > 0.65 && fairness.passed) return "approved"

    // Deny if score < 0.35
    if (score < 0.35) return "denied"

    // Refer if fairness failed or borderline score
    if (!fairness.passed || (score >= 0.35 && score <= 0.65)) return "referred"

    return "referred"
  }

  private extractTop3Reasons(features: SHAPFeature[]): string[] {
    // Sort by absolute contribution and get top 3
    return features
      .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
      .slice(0, 3)
      .map(f => `${f.description}: ${f.contribution > 0 ? "Positive" : "Negative"} contribution (${(f.contribution * 100).toFixed(1)}%)`)
  }

  private createReferralResult(
    _input: DecisionInput,
    _primaryResult: { score: number; riskLevel: string },
    latency: number,
    reason: string
  ): DecisionResult {
    return {
      outcome: "referred",
      finalDecision: "Refer",
      primaryScore: _primaryResult.score,
      fairnessScore: 0,
      latencyMs: latency,
      tower: "circuit_breaker",
      shapFeatures: [],
      top3Reasons: [`Circuit breaker triggered: ${reason}`, "Referred to manual underwriting", "Fairness audit incomplete"],
      circuitBreakerTriggered: true,
      timestamp: new Date().toISOString(),
    }
  }

  private createCircuitBreakerResult(_input: DecisionInput, startTime: number): DecisionResult {
    const latency = Math.round(performance.now() - startTime)

    return {
      outcome: "referred",
      finalDecision: "Refer",
      primaryScore: 0,
      fairnessScore: 0,
      latencyMs: latency,
      tower: "circuit_breaker",
      shapFeatures: [],
      top3Reasons: [
        "Circuit breaker OPEN - fairness audit unavailable",
        "Automatic referral to manual underwriting",
        "System temporarily in safe mode",
      ],
      circuitBreakerTriggered: true,
      timestamp: new Date().toISOString(),
    }
  }

  private isCircuitBreakerOpen(): boolean {
    if (this.circuitBreaker.isOpen) {
      const now = Date.now()
      // Check if timeout has elapsed
      if (now - this.circuitBreaker.lastFailureTime > CIRCUIT_BREAKER_TIMEOUT) {
        this.circuitBreaker.isOpen = false
        this.circuitBreaker.failures = 0
        return false
      }
      return true
    }
    return this.circuitBreaker.failures >= CIRCUIT_BREAKER_THRESHOLD
  }

  private recordFailure() {
    this.circuitBreaker.failures++
    this.circuitBreaker.lastFailureTime = Date.now()
    this.circuitBreaker.consecutiveSuccesses = 0

    if (this.circuitBreaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
      this.circuitBreaker.isOpen = true
      toast.warning("Circuit breaker opened - fairness audit failing")
    }
  }

  private recordSuccess() {
    this.circuitBreaker.consecutiveSuccesses++
    if (this.circuitBreaker.consecutiveSuccesses >= 5) {
      this.circuitBreaker.failures = 0
      this.circuitBreaker.isOpen = false
    }
  }

  private async createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    })
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  getCircuitBreakerStatus() {
    return {
      isOpen: this.circuitBreaker.isOpen,
      failures: this.circuitBreaker.failures,
      lastFailure: this.circuitBreaker.lastFailureTime,
    }
  }
}

export const decisionGateway = new DecisionGateway()
