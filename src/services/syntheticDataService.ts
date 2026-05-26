const STORAGE_KEY = "avarent_synthetic_studio"

export interface DemographicGroupStats {
  id: string
  group: string
  category: "Race" | "Gender" | "Age"
  currentCount: number
  targetCount: number
  representationRatio: number // percentage
  targetRatio: number // percentage
  approvalRateBefore: number
  approvalRateAfter: number
  falseRejectionRateBefore: number
  falseRejectionRateAfter: number
}

export interface ProxyFeature {
  id: string
  name: string
  originalCorrelation: number
  sanitizedCorrelation: number
  status: "active" | "quarantined" | "sanitized"
  riskScore: number // 0-100
  protectedAttribute: string
  impactPercentage: number
}

export interface GANMetrics {
  wassersteinDistance: number
  fidScore: number
  epochsRun: number
  generatorLoss: number
  discriminatorLoss: number
  privacyBudget: number // epsilon
}

export interface SyntheticStudioState {
  groups: DemographicGroupStats[]
  features: ProxyFeature[]
  ganMetrics: GANMetrics
  lastGenerated: string | null
}

const DEFAULT_GROUPS: DemographicGroupStats[] = [
  {
    id: "g1",
    group: "Black or African American",
    category: "Race",
    currentCount: 240,
    targetCount: 560,
    representationRatio: 12,
    targetRatio: 25,
    approvalRateBefore: 42.5,
    approvalRateAfter: 68.2,
    falseRejectionRateBefore: 28.4,
    falseRejectionRateAfter: 10.5,
  },
  {
    id: "g2",
    group: "Hispanic or Latino",
    category: "Race",
    currentCount: 300,
    targetCount: 500,
    representationRatio: 15,
    targetRatio: 22.5,
    approvalRateBefore: 48.0,
    approvalRateAfter: 70.5,
    falseRejectionRateBefore: 24.5,
    falseRejectionRateAfter: 9.8,
  },
  {
    id: "g3",
    group: "Female",
    category: "Gender",
    currentCount: 820,
    targetCount: 1100,
    representationRatio: 41,
    targetRatio: 50,
    approvalRateBefore: 51.2,
    approvalRateAfter: 72.8,
    falseRejectionRateBefore: 18.2,
    falseRejectionRateAfter: 8.0,
  },
  {
    id: "g4",
    group: "Age < 25 (Young Adults)",
    category: "Age",
    currentCount: 160,
    targetCount: 340,
    representationRatio: 8,
    targetRatio: 15,
    approvalRateBefore: 38.6,
    approvalRateAfter: 61.4,
    falseRejectionRateBefore: 32.1,
    falseRejectionRateAfter: 12.3,
  },
  {
    id: "g5",
    group: "Asian",
    category: "Race",
    currentCount: 280,
    targetCount: 280,
    representationRatio: 14,
    targetRatio: 14,
    approvalRateBefore: 76.5,
    approvalRateAfter: 76.8,
    falseRejectionRateBefore: 8.5,
    falseRejectionRateAfter: 8.2,
  },
  {
    id: "g6",
    group: "White (Majority Control)",
    category: "Race",
    currentCount: 1180,
    targetCount: 1180,
    representationRatio: 59,
    targetRatio: 38.5,
    approvalRateBefore: 78.2,
    approvalRateAfter: 75.4,
    falseRejectionRateBefore: 6.8,
    falseRejectionRateAfter: 7.2,
  },
]

const DEFAULT_FEATURES: ProxyFeature[] = [
  {
    id: "f1",
    name: "ZIP_Code_Latitude",
    originalCorrelation: 0.68,
    sanitizedCorrelation: 0.08,
    status: "sanitized",
    riskScore: 88,
    protectedAttribute: "Race (Black / Hispanic)",
    impactPercentage: 14.5,
  },
  {
    id: "f2",
    name: "Retail_Store_Subprime_Index",
    originalCorrelation: 0.54,
    sanitizedCorrelation: 0.54,
    status: "quarantined",
    riskScore: 76,
    protectedAttribute: "Race (Black / Hispanic)",
    impactPercentage: 9.8,
  },
  {
    id: "f3",
    name: "Utility_Payment_History_Missing",
    originalCorrelation: 0.47,
    sanitizedCorrelation: 0.12,
    status: "sanitized",
    riskScore: 65,
    protectedAttribute: "Age (Young Adults)",
    impactPercentage: 11.2,
  },
  {
    id: "f4",
    name: "Telecomm_Prepaid_Account_Age",
    originalCorrelation: 0.39,
    sanitizedCorrelation: 0.39,
    status: "active",
    riskScore: 48,
    protectedAttribute: "Race / Income Proxy",
    impactPercentage: 6.4,
  },
  {
    id: "f5",
    name: "Cash_Flow_Subscription_Count",
    originalCorrelation: 0.22,
    sanitizedCorrelation: 0.22,
    status: "active",
    riskScore: 28,
    protectedAttribute: "Age Proxy",
    impactPercentage: 3.1,
  },
  {
    id: "f6",
    name: "Weekly_Cash_Surplus_Stability",
    originalCorrelation: 0.15,
    sanitizedCorrelation: 0.15,
    status: "active",
    riskScore: 15,
    protectedAttribute: "None (Approved)",
    impactPercentage: 1.2,
  },
]

export class SyntheticDataService {
  private state: SyntheticStudioState

  constructor() {
    this.state = this.loadFromStorage()
  }

  private loadFromStorage(): SyntheticStudioState {
    if (typeof window === "undefined") {
      return {
        groups: DEFAULT_GROUPS,
        features: DEFAULT_FEATURES,
        ganMetrics: {
          wassersteinDistance: 0.042,
          fidScore: 12.4,
          epochsRun: 500,
          generatorLoss: 0.65,
          discriminatorLoss: 0.68,
          privacyBudget: 1.5,
        },
        lastGenerated: null,
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
      groups: DEFAULT_GROUPS,
      features: DEFAULT_FEATURES,
      ganMetrics: {
        wassersteinDistance: 0.042,
        fidScore: 12.4,
        epochsRun: 500,
        generatorLoss: 0.65,
        discriminatorLoss: 0.68,
        privacyBudget: 1.5,
      },
      lastGenerated: null,
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
  }

  getState(): SyntheticStudioState {
    return { ...this.state }
  }

  updateGroupTargetCount(id: string, targetCount: number) {
    const group = this.state.groups.find(g => g.id === id)
    if (group) {
      group.targetCount = targetCount
      // Recompute target ratio based on sum of targets
      const totalTarget = this.state.groups
        .filter(g => g.category === group.category)
        .reduce((sum, g) => sum + g.targetCount, 0)

      this.state.groups
        .filter(g => g.category === group.category)
        .forEach(g => {
          g.targetRatio = Math.round((g.targetCount / totalTarget) * 100)
        })

      this.saveToStorage()
    }
    return this.getState()
  }

  toggleFeatureStatus(id: string, status: "active" | "quarantined" | "sanitized") {
    const feature = this.state.features.find(f => f.id === id)
    if (feature) {
      feature.status = status
      if (status === "sanitized") {
        feature.sanitizedCorrelation = Math.round((feature.originalCorrelation * 0.15) * 100) / 100
      } else if (status === "active") {
        feature.sanitizedCorrelation = feature.originalCorrelation
      } else if (status === "quarantined") {
        feature.sanitizedCorrelation = 0.00
      }
      this.saveToStorage()
    }
    return this.getState()
  }

  runGANSimulation(epochs: number, privacyBudget: number, quality: number) {
    // Simulate training progress and score metrics
    const wDistance = Math.max(0.008, 0.08 - (epochs / 10000) - (quality / 2000))
    const fid = Math.max(2.1, 24.5 - (epochs / 40) - (quality / 10) + (privacyBudget * 1.5))
    const genLoss = 0.5 + Math.random() * 0.2
    const discLoss = 0.5 + Math.random() * 0.2

    this.state.ganMetrics = {
      wassersteinDistance: Math.round(wDistance * 1000) / 1000,
      fidScore: Math.round(fid * 10) / 10,
      epochsRun: epochs,
      generatorLoss: Math.round(genLoss * 100) / 100,
      discriminatorLoss: Math.round(discLoss * 100) / 100,
      privacyBudget: privacyBudget,
    }

    // Improve the after metrics based on higher training quality
    this.state.groups = this.state.groups.map(g => {
      if (g.group.includes("Majority")) return g
      
      const liftFactor = (epochs / 1000) * (quality / 100)
      const targetApproval = Math.min(75, g.approvalRateBefore + (20 * liftFactor))
      const targetFRR = Math.max(5, g.falseRejectionRateBefore - (15 * liftFactor))

      return {
        ...g,
        approvalRateAfter: Math.round(targetApproval * 10) / 10,
        falseRejectionRateAfter: Math.round(targetFRR * 10) / 10,
      }
    })

    this.state.lastGenerated = new Date().toISOString()
    this.saveToStorage()
    return this.getState()
  }

  reset() {
    this.state = {
      groups: JSON.parse(JSON.stringify(DEFAULT_GROUPS)),
      features: JSON.parse(JSON.stringify(DEFAULT_FEATURES)),
      ganMetrics: {
        wassersteinDistance: 0.042,
        fidScore: 12.4,
        epochsRun: 500,
        generatorLoss: 0.65,
        discriminatorLoss: 0.68,
        privacyBudget: 1.5,
      },
      lastGenerated: null,
    }
    this.saveToStorage()
    return this.getState()
  }
}

export const syntheticDataService = new SyntheticDataService()
