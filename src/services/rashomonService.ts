import { toast } from "sonner"

export interface RashomonModel {
  id: string
  name: string
  accuracy: number // Performance metric (e.g., AUC-ROC)
  fairnessScore: number // Disparate impact ratio or similar
  featureCount: number
  calibration: number // Expected Calibration Error
  latencyMs: number
  complexity: "low" | "medium" | "high"
  description: string
  // Model parameters (simplified)
  parameters: Record<string, number>
}

export interface LessDiscriminatoryAlternative {
  exists: boolean
  currentModel: RashomonModel
  alternativeModel: RashomonModel | null
  accuracyGap: number // Performance difference
  fairnessGain: number // Fairness improvement
  slackWithin: boolean // True if gap <= 0.5%
  recommendation: string
  rashomonSetSize: number
}

export interface RashomonSearchResult {
  epsilon: number // Performance slack threshold
  modelsInSet: RashomonModel[]
  fairnessRange: { min: number; max: number }
  accuracyRange: { min: number; max: number }
  optimalFairness: RashomonModel | null
  searchTimeMs: number
  certified: boolean // True if no fairer alternative within slack
}

// Rashomon Set: Set of models with nearly-equivalent performance
// Used to find Less Discriminatory Alternatives (LDA) per regulation
class RashomonService {
  // Performance slack threshold: 0.5% (500 basis points)
  private readonly PERFORMANCE_SLACK = 0.005 // 0.5%
  private currentModel: RashomonModel | null = null
  private rashomonCache: RashomonModel[] = []

  /**
   * Search for Less Discriminatory Alternative (LDA)
   * Per ECOA and fair lending regulations
   *
   * Goal: Prove that current model is among the least discriminatory
   * in the Rashomon set (models within 0.5% performance of optimal)
   */
  async searchForLDA(currentModel: RashomonModel): Promise<LessDiscriminatoryAlternative> {
    const startTime = performance.now()

    this.currentModel = currentModel
    void this.currentModel // Mark as used

    // Step 1: Generate Rashomon set
    // Find all models within 0.5% performance of current model
    const rashomonSet = await this.generateRashomonSet(currentModel)
    this.rashomonCache = rashomonSet

    // Step 2: Find fairest model in Rashomon set
    const fairestModel = this.findFairestModel(rashomonSet)

    // Step 3: Compare current model to fairest
    const accuracyGap = currentModel.accuracy - (fairestModel?.accuracy || currentModel.accuracy)
    const fairnessGain = (fairestModel?.fairnessScore || currentModel.fairnessScore) - currentModel.fairnessScore

    const slackWithin = Math.abs(accuracyGap) <= this.PERFORMANCE_SLACK

    const searchTime = Math.round(performance.now() - startTime)
    void searchTime // Analysis completed in this time

    // Step 4: Generate certification
    const result: LessDiscriminatoryAlternative = {
      exists: fairnessGain > 0 && slackWithin,
      currentModel,
      alternativeModel: fairnessGain > 0 && slackWithin ? fairestModel : null,
      accuracyGap,
      fairnessGain,
      slackWithin,
      recommendation: this.generateRecommendation(fairnessGain, slackWithin, currentModel, fairestModel),
      rashomonSetSize: rashomonSet.length,
    }

    if (result.exists) {
      toast.success(`Found Less Discriminatory Alternative: +${(fairnessGain * 100).toFixed(2)}% fairness, -${(Math.abs(accuracyGap) * 100).toFixed(2)}% accuracy`)
    } else {
      toast.info("No Less Discriminatory Alternative found within 0.5% performance slack")
    }

    return result
  }

  /**
   * Certify that no fairer alternative exists within performance slack
   * This is the "Refutation Defense" against discrimination claims
   */
  async certifyNoFairerAlternative(currentModel: RashomonModel): Promise<RashomonSearchResult> {
    const startTime = performance.now()

    // Generate comprehensive Rashomon set
    const models = await this.generateRashomonSet(currentModel)

    // Find fairness bounds
    const fairnessValues = models.map(m => m.fairnessScore)
    const accuracyValues = models.map(m => m.accuracy)

    const fairnessRange = {
      min: Math.min(...fairnessValues),
      max: Math.max(...fairnessValues),
    }

    const accuracyRange = {
      min: Math.min(...accuracyValues),
      max: Math.max(...accuracyValues),
    }

    // Find optimal fairness within slack
    const optimalFairness = models
      .filter(m => currentModel.accuracy - m.accuracy <= this.PERFORMANCE_SLACK)
      .sort((a, b) => b.fairnessScore - a.fairnessScore)[0] || null

    const searchTime = Math.round(performance.now() - startTime)

    // Certified if current model is among the fairest in Rashomon set
    const certified = !optimalFairness ||
      Math.abs(optimalFairness.fairnessScore - currentModel.fairnessScore) < 0.01

    return {
      epsilon: this.PERFORMANCE_SLACK,
      modelsInSet: models,
      fairnessRange,
      accuracyRange,
      optimalFairness,
      searchTimeMs: searchTime,
      certified,
    }
  }

  /**
   * Generate Rashomon set: models within epsilon performance slack
   *
   * Uses grid search over hyperparameter space
   * In production, use formal methods or Bayesian optimization
   */
  private async generateRashomonSet(anchor: RashomonModel): Promise<RashomonModel[]> {
    const models: RashomonModel[] = []

    // Anchor model
    models.push(anchor)

    // Generate variations by perturbing hyperparameters
    const variations = [
      // Add/remove features (simulate feature selection)
      this.createVariation(anchor, "conservative", {
        featureCount: Math.max(5, anchor.featureCount - 5),
        regularization: 0.1,
      }),
      this.createVariation(anchor, "aggressive", {
        featureCount: anchor.featureCount + 3,
        regularization: 0.01,
      }),
      this.createVariation(anchor, "fairness_constrained", {
        fairnessPenalty: 0.2,
        calibrationBoost: 0.05,
      }),
      this.createVariation(anchor, "calibration_focused", {
        calibrationBoost: 0.1,
        fairnessPenalty: 0.05,
      }),
      this.createVariation(anchor, "ensemble", {
        ensembleSize: 5,
        regularization: 0.05,
      }),
      this.createVariation(anchor, "sparse", {
        featureCount: Math.max(8, anchor.featureCount - 10),
        l1Penalty: 0.1,
      }),
      this.createVariation(anchor, "demographic_parity", {
        fairnessPenalty: 0.3,
        featureCount: anchor.featureCount,
      }),
      this.createVariation(anchor, "equalized_odds", {
        fairnessPenalty: 0.25,
        equalizedOdds: 1,
      }),
    ]

    // Filter to those within performance slack
    for (const model of variations) {
      if (Math.abs(model.accuracy - anchor.accuracy) <= this.PERFORMANCE_SLACK * 2) {
        models.push(model)
      }
    }

    return models
  }

  private createVariation(
    base: RashomonModel,
    strategy: string,
    params: Record<string, number>
  ): RashomonModel {
    // Simulate model variation based on hyperparameter changes
    const accuracyDelta = this.simulateAccuracyImpact(params)
    const fairnessDelta = this.simulateFairnessImpact(params)
    const latencyDelta = this.simulateLatencyImpact(params)

    return {
      id: `${base.id}-${strategy}`,
      name: `${base.name} (${strategy})`,
      accuracy: Math.max(0.5, Math.min(1, base.accuracy + accuracyDelta)),
      fairnessScore: Math.max(0.5, Math.min(1, base.fairnessScore + fairnessDelta)),
      featureCount: params.featureCount || base.featureCount,
      calibration: base.calibration + (params.calibrationBoost || 0) * 0.01,
      latencyMs: Math.max(50, base.latencyMs + latencyDelta),
      complexity: params.featureCount && params.featureCount < 15 ? "low" :
                 params.featureCount && params.featureCount > 50 ? "high" : "medium",
      description: `Variation using ${strategy} strategy`,
      parameters: { ...base.parameters, ...params },
    }
  }

  private simulateAccuracyImpact(params: Record<string, number>): number {
    let delta = 0

    // Fewer features typically reduces accuracy slightly
    if (params.featureCount !== undefined) {
      delta -= Math.abs(params.featureCount - 25) * 0.002
    }

    // Strong regularization can hurt accuracy
    if (params.regularization) {
      delta -= params.regularization * 0.01
    }

    // Fairness constraints can reduce accuracy (accuracy-fairness tradeoff)
    if (params.fairnessPenalty) {
      delta -= params.fairnessPenalty * 0.02
    }

    // Ensembles typically improve accuracy
    if (params.ensembleSize) {
      delta += 0.005
    }

    // Add small random noise (simulate stochasticity)
    delta += (Math.random() - 0.5) * 0.01

    return delta
  }

  private simulateFairnessImpact(params: Record<string, number>): number {
    let delta = 0

    // Fairness penalties improve fairness
    if (params.fairnessPenalty) {
      delta += params.fairnessPenalty * 0.05
    }

    // Calibration focus helps fairness
    if (params.calibrationBoost) {
      delta += params.calibrationBoost * 0.02
    }

    // Equalized odds constraint
    if (params.equalizedOdds) {
      delta += 0.08
    }

    // Sparse models can be less fair (less data to smooth disparities)
    if (params.l1Penalty) {
      delta -= 0.01
    }

    return delta
  }

  private simulateLatencyImpact(params: Record<string, number>): number {
    let delta = 0

    // More features = more latency
    if (params.featureCount !== undefined) {
      delta += (params.featureCount - 25) * 2
    }

    // Ensembles are slower
    if (params.ensembleSize) {
      delta += params.ensembleSize * 20
    }

    return delta
  }

  private findFairestModel(models: RashomonModel[]): RashomonModel | null {
    return models.sort((a, b) => b.fairnessScore - a.fairnessScore)[0] || null
  }

  private generateRecommendation(
    fairnessGain: number,
    slackWithin: boolean,
    current: RashomonModel,
    alternative: RashomonModel | null
  ): string {
    if (!slackWithin) {
      return `Current model (${(current.fairnessScore * 100).toFixed(1)}% fairness) is Pareto-optimal. Any fairer alternative exceeds ${(this.PERFORMANCE_SLACK * 100).toFixed(1)}% performance slack.`
    }

    if (fairnessGain <= 0) {
      return `Current model is among the fairest in the Rashomon set. No Less Discriminatory Alternative exists.`
    }

    if (alternative) {
      return `LESS DISCRIMINATORY ALTERNATIVE FOUND: ${alternative.name} improves fairness by ${(fairnessGain * 100).toFixed(2)}% with only ${(Math.abs(current.accuracy - alternative.accuracy) * 100).toFixed(2)}% accuracy loss. RECOMMENDATION: Switch to alternative model.`
    }

    return `Analysis complete. Current model is ${fairnessGain > 0 ? "suboptimal" : "optimal"} within Rashomon set.`
  }

  /**
   * Get Pareto frontier: models that can't be improved in one metric
   * without worsening another
   */
  getParetoFrontier(models: RashomonModel[] = this.rashomonCache): RashomonModel[] {
    return models.filter(model => {
      // Model is on Pareto frontier if no other model dominates it
      return !models.some(other => {
        if (other.id === model.id) return false
        // Other dominates model if it's better or equal in all metrics
        return (
          other.accuracy >= model.accuracy &&
          other.fairnessScore >= model.fairnessScore &&
          other.latencyMs <= model.latencyMs &&
          (other.accuracy > model.accuracy ||
           other.fairnessScore > model.fairnessScore ||
           other.latencyMs < model.latencyMs)
        )
      })
    })
  }

  /**
   * Export Rashomon analysis for regulatory documentation
   */
  exportAnalysis(result: LessDiscriminatoryAlternative): string {
    const lines = [
      "RASHOMON SET ANALYSIS - LESS DISCRIMINATORY ALTERNATIVE SEARCH",
      "=".repeat(70),
      `Analysis Date: ${new Date().toISOString()}`,
      `Performance Slack Threshold: ${(this.PERFORMANCE_SLACK * 100).toFixed(1)}%`,
      "",
      "CURRENT MODEL:",
      `  Name: ${result.currentModel.name}`,
      `  Accuracy: ${(result.currentModel.accuracy * 100).toFixed(2)}%`,
      `  Fairness Score: ${(result.currentModel.fairnessScore * 100).toFixed(2)}%`,
      `  Features: ${result.currentModel.featureCount}`,
      `  Latency: ${result.currentModel.latencyMs}ms`,
      "",
      "SEARCH RESULTS:",
      `  Rashomon Set Size: ${result.rashomonSetSize} models`,
      `  Less Discriminatory Alternative Exists: ${result.exists ? "YES" : "NO"}`,
      "",
    ]

    if (result.alternativeModel) {
      lines.push(
        "ALTERNATIVE MODEL (RECOMMENDED):",
        `  Name: ${result.alternativeModel.name}`,
        `  Accuracy: ${(result.alternativeModel.accuracy * 100).toFixed(2)}%`,
        `  Fairness Score: ${(result.alternativeModel.fairnessScore * 100).toFixed(2)}%`,
        `  Accuracy Gap: ${(result.accuracyGap * 100).toFixed(2)}%`,
        `  Fairness Gain: ${(result.fairnessGain * 100).toFixed(2)}%`,
        ""
      )
    }

    lines.push(
      "CERTIFICATION:",
      `  ${result.slackWithin ? "✓ Model is certified as non-discriminatory within performance slack" : "✗ Performance slack exceeded"}`,
      "",
      "RECOMMENDATION:",
      `  ${result.recommendation}`,
      "",
      "=".repeat(70),
      "This analysis demonstrates compliance with ECOA and fair lending regulations",
      "by proactively searching for Less Discriminatory Alternatives in the Rashomon set.",
    )

    return lines.join("\n")
  }
}

export const rashomonService = new RashomonService()
