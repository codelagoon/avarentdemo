import type { DemoScenario, ScenarioConfig } from "@/data/mockData"
import { DEMO_SCENARIOS } from "@/data/mockData"
import { ledgerService } from "./ledgerService"
import { threatService } from "./threatService"

export interface ScenarioResult {
  success: boolean
  outcome: "approved" | "denied" | "escalated" | "under_review"
  fairnessScore: number
  proxiesDetected: number
  interventionsApplied: string[]
  severedEdges: string[]
  ledgerEntryId: string
  threatEventId?: string
}

export class ScenarioService {
  async runScenario(scenarioId: DemoScenario): Promise<ScenarioResult> {
    const scenario = DEMO_SCENARIOS[scenarioId]
    if (!scenario) {
      throw new Error(`Unknown scenario: ${scenarioId}`)
    }

    // Simulate processing steps
    await this.delay(600)

    // Create threat event if proxies detected
    let threatEventId: string | undefined
    if (scenario.proxiesDetected > 0) {
      await this.delay(800)

      const threatEvent = threatService.add({
        applicantId: scenario.applicantId,
        applicantName: scenario.applicantName,
        severity: scenario.alertSeverity || "medium",
        attackVector: scenario.interventions[0] || "PROXY_INJECTION",
        proxyVariables: scenario.graphSeveredEdges,
        confidence: scenario.fairnessScore,
        blocked: true,
        modelScore: 0.85,
        description: `${scenario.label}: ${scenario.description}`,
      })
      threatEventId = threatEvent.id
    }

    await this.delay(700)

    // Create ledger entry
    const ledgerEntry = ledgerService.add({
      eventType: scenario.proxiesDetected > 0 ? "intervention" : "proof_signed",
      applicantId: scenario.applicantId,
      applicantName: scenario.applicantName,
      decision: scenario.expectedOutcome,
      interventionType: scenario.interventions[0],
      severity: scenario.alertSeverity || undefined,
      modelVersion: "FNB-FAIR-v4.2.1",
      fairnessScore: scenario.fairnessScore,
      message: `${scenario.label}: ${scenario.description}`,
      nodeCount: 12,
    })

    return {
      success: true,
      outcome: scenario.expectedOutcome,
      fairnessScore: scenario.fairnessScore,
      proxiesDetected: scenario.proxiesDetected,
      interventionsApplied: scenario.interventions,
      severedEdges: scenario.graphSeveredEdges,
      ledgerEntryId: ledgerEntry.id,
      threatEventId,
    }
  }

  getScenario(id: DemoScenario): ScenarioConfig | null {
    return DEMO_SCENARIOS[id] || null
  }

  getAllScenarios(): ScenarioConfig[] {
    return Object.values(DEMO_SCENARIOS)
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export const scenarioService = new ScenarioService()
