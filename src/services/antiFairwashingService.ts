import { emit } from "@/lib/sync"

const STORAGE_KEY = "avarent_anti_fairwashing"

export interface KSTestResult {
  groupName: string
  dStatistic: number // KS distance
  pValue: number
  isIdenticalDistribution: boolean
  status: "pass" | "warning" | "failed"
}

export interface KLDivergenceResult {
  groupName: string
  klDivergenceValue: number // 0 to infinity
  status: "nominal" | "drift" | "severe"
  claimedFairness: number // percentage
  actualFairness: number // percentage
}

export interface ManipulationAlert {
  id: string
  ruleName: string
  description: string
  labelFlipRate: number // percentage
  suspectClusterCount: number
  riskLevel: "critical" | "high" | "low"
  timestamp: string
  resolved: boolean
}

export interface RobustnessDisparity {
  groupName: string
  fgsmAccuracy: number // percentage under Fast Gradient Sign Method
  pgdAccuracy: number // percentage under Projected Gradient Descent
  cleanAccuracy: number // standard accuracy
  robustnessDisparityIndex: number // 0-1
}

export interface AntiFairwashingState {
  ksTests: KSTestResult[]
  klDivergences: KLDivergenceResult[]
  alerts: ManipulationAlert[]
  robustness: RobustnessDisparity[]
}

const DEFAULT_KS_TESTS: KSTestResult[] = [
  {
    groupName: "Black or African American vs. White",
    dStatistic: 0.28,
    pValue: 0.002,
    isIdenticalDistribution: false,
    status: "failed",
  },
  {
    groupName: "Hispanic or Latino vs. White",
    dStatistic: 0.19,
    pValue: 0.045,
    isIdenticalDistribution: false,
    status: "warning",
  },
  {
    groupName: "Female vs. Male",
    dStatistic: 0.08,
    pValue: 0.420,
    isIdenticalDistribution: true,
    status: "pass",
  },
]

const DEFAULT_KL_DIVERGENCES: KLDivergenceResult[] = [
  {
    groupName: "Black or African American",
    klDivergenceValue: 0.42,
    status: "drift",
    claimedFairness: 82.5,
    actualFairness: 68.4,
  },
  {
    groupName: "Hispanic or Latino",
    klDivergenceValue: 0.26,
    status: "nominal",
    claimedFairness: 84.0,
    actualFairness: 78.5,
  },
  {
    groupName: "Female",
    klDivergenceValue: 0.05,
    status: "nominal",
    claimedFairness: 89.2,
    actualFairness: 88.9,
  },
]

const DEFAULT_ALERTS: ManipulationAlert[] = [
  {
    id: "a1",
    ruleName: "Adversarial Label Flipping Detected",
    description: "System flagged 4.2% of borderline minority profiles flipped to 'approved' near decision boundary without corresponding feature improvements, suggesting synthetic fairwashing.",
    labelFlipRate: 4.2,
    suspectClusterCount: 3,
    riskLevel: "critical",
    timestamp: "2026-05-26T00:10:00Z",
    resolved: false,
  },
  {
    id: "a2",
    ruleName: "Coarse Group Stratification",
    description: "Claimed demographic parity is inflated due to artificial binning of income variables. True underlying continuous distribution reveals 11.2% disparity drift.",
    labelFlipRate: 2.1,
    suspectClusterCount: 1,
    riskLevel: "high",
    timestamp: "2026-05-25T18:45:00Z",
    resolved: false,
  },
]

const DEFAULT_ROBUSTNESS: RobustnessDisparity[] = [
  {
    groupName: "White (Majority)",
    fgsmAccuracy: 88.5,
    pgdAccuracy: 82.4,
    cleanAccuracy: 94.2,
    robustnessDisparityIndex: 0.05,
  },
  {
    groupName: "Black or African American",
    fgsmAccuracy: 64.2,
    pgdAccuracy: 52.8,
    cleanAccuracy: 92.1,
    robustnessDisparityIndex: 0.36,
  },
  {
    groupName: "Hispanic or Latino",
    fgsmAccuracy: 71.5,
    pgdAccuracy: 62.0,
    cleanAccuracy: 91.8,
    robustnessDisparityIndex: 0.24,
  },
  {
    groupName: "Female",
    fgsmAccuracy: 82.0,
    pgdAccuracy: 76.5,
    cleanAccuracy: 93.8,
    robustnessDisparityIndex: 0.08,
  },
]

export class AntiFairwashingService {
  private state: AntiFairwashingState

  constructor() {
    this.state = this.loadFromStorage()
  }

  private loadFromStorage(): AntiFairwashingState {
    if (typeof window === "undefined") {
      return {
        ksTests: DEFAULT_KS_TESTS,
        klDivergences: DEFAULT_KL_DIVERGENCES,
        alerts: DEFAULT_ALERTS,
        robustness: DEFAULT_ROBUSTNESS,
      }
    }
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        // Fallback
      }
    }
    return {
      ksTests: DEFAULT_KS_TESTS,
      klDivergences: DEFAULT_KL_DIVERGENCES,
      alerts: DEFAULT_ALERTS,
      robustness: DEFAULT_ROBUSTNESS,
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
    emit("antiFairwashing")
  }

  getState(): AntiFairwashingState {
    this.state = this.loadFromStorage()
    return { ...this.state }
  }

  resolveAlert(id: string) {
    const alert = this.state.alerts.find(a => a.id === id)
    if (alert) {
      alert.resolved = true
      this.saveToStorage()
    }
    return this.getState()
  }

  runAdversarialAudit() {
    // Simulate auditing process, slightly adjust metrics to show progress
    this.state.ksTests = this.state.ksTests.map(t => {
      if (t.groupName.includes("Black")) {
        return { ...t, dStatistic: 0.25, pValue: 0.005, status: "failed" }
      }
      return t
    })

    this.state.klDivergences = this.state.klDivergences.map(k => {
      if (k.groupName.includes("Black")) {
        return { ...k, actualFairness: 72.1, klDivergenceValue: 0.35 }
      }
      return k
    })

    // Reduce label flip rates slightly as a simulation of auditing/fixing things
    this.state.alerts = this.state.alerts.map(a => {
      if (!a.resolved) {
        return { ...a, labelFlipRate: Math.max(0.5, Math.round((a.labelFlipRate * 0.85) * 10) / 10) }
      }
      return a
    })

    this.saveToStorage()
    return this.getState()
  }

  reset() {
    this.state = {
      ksTests: JSON.parse(JSON.stringify(DEFAULT_KS_TESTS)),
      klDivergences: JSON.parse(JSON.stringify(DEFAULT_KL_DIVERGENCES)),
      alerts: JSON.parse(JSON.stringify(DEFAULT_ALERTS)),
      robustness: JSON.parse(JSON.stringify(DEFAULT_ROBUSTNESS)),
    }
    this.saveToStorage()
    return this.getState()
  }
}

export const antiFairwashingService = new AntiFairwashingService()
