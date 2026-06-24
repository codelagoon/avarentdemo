import type { DemoScenario, ScenarioConfig } from "@/data/mockData"
import { DEMO_SCENARIOS } from "@/data/mockData"
import { ledgerService } from "./ledgerService"
import { threatService } from "./threatService"
import { getAIDecision, type ApplicationData } from "./aiModelService"

export interface ScenarioResult {
  success: boolean
  outcome: "approved" | "denied" | "escalated" | "under_review"
  fairnessScore: number
  proxiesDetected: number
  interventionsApplied: string[]
  severedEdges: string[]
  ledgerEntryId: string
  threatEventId?: string
  aiDecision?: {
    provider: "openrouter" | "nvidia" | "local"
    modelUsed: string
    confidence: number
    reasoning: string
    latency: number
  }
}

export class ScenarioService {
  async runScenario(scenarioId: DemoScenario): Promise<ScenarioResult> {
    const scenario = DEMO_SCENARIOS[scenarioId]
    if (!scenario) {
      throw new Error(`Unknown scenario: ${scenarioId}`)
    }

    // Convert scenario data to application data for AI model
    const appData: ApplicationData = {
      applicantName: scenario.applicantName,
      applicantId: scenario.applicantId,
      age: scenario.age,
      income: scenario.income,
      creditScore: scenario.creditScore,
      loanAmount: scenario.loanAmount,
      loanType: scenario.loanType,
      employmentYears: scenario.employmentYears,
      zipCode: scenario.zipCode,
      debtToIncomeRatio: 0.3, // Default assumption
    }

    // Get AI decision from OpenRouter (free) → NVIDIA (fallback) → Local (final fallback)
    const aiDecision = await getAIDecision(appData)

    // Create threat event if proxies detected
    let threatEventId: string | undefined
    if (scenario.proxiesDetected > 0) {
      const threatEvent = threatService.add({
        applicantId: scenario.applicantId,
        applicantName: scenario.applicantName,
        severity: scenario.alertSeverity || "medium",
        attackVector: scenario.interventions[0] || "PROXY_INJECTION",
        proxyVariables: scenario.graphSeveredEdges,
        confidence: aiDecision.confidence,
        blocked: true,
        modelScore: aiDecision.fairnessScore,
        description: `${scenario.label}: ${scenario.description} | AI: ${aiDecision.reasoning.substring(0, 100)}`,
      })
      threatEventId = threatEvent.id
    }

    // Use AI decision outcome, but escalate if scenario has proxies
    const finalOutcome = scenario.proxiesDetected > 0
      ? "escalated"
      : aiDecision.decision === "under_review"
        ? "under_review"
        : aiDecision.decision

    // Create ledger entry with AI model info
    const ledgerEntry = await ledgerService.add({
      eventType: scenario.proxiesDetected > 0 ? "intervention" : "proof_signed",
      applicantId: scenario.applicantId,
      applicantName: scenario.applicantName,
      decision: finalOutcome,
      interventionType: scenario.interventions[0],
      severity: scenario.alertSeverity || undefined,
      modelVersion: `${aiDecision.provider}-${aiDecision.modelUsed}`,
      fairnessScore: aiDecision.fairnessScore,
      message: `${scenario.label}: ${scenario.description} | AI Decision: ${aiDecision.decision} (${(aiDecision.confidence * 100).toFixed(0)}% confidence)`,
      nodeCount: 12,
    })

    return {
      success: true,
      outcome: finalOutcome,
      fairnessScore: aiDecision.fairnessScore,
      proxiesDetected: scenario.proxiesDetected,
      interventionsApplied: scenario.interventions,
      severedEdges: scenario.graphSeveredEdges,
      ledgerEntryId: ledgerEntry.id,
      threatEventId,
      aiDecision: {
        provider: aiDecision.provider,
        modelUsed: aiDecision.modelUsed,
        confidence: aiDecision.confidence,
        reasoning: aiDecision.reasoning,
        latency: aiDecision.latency,
      },
    }
  }

  getScenario(id: DemoScenario): ScenarioConfig | null {
    return DEMO_SCENARIOS[id] || null
  }

  getAllScenarios(): ScenarioConfig[] {
    return Object.values(DEMO_SCENARIOS)
  }
}

export const scenarioService = new ScenarioService()
