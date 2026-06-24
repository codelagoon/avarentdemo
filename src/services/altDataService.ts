import { emit } from "@/lib/sync"
import { bindTenantInit } from "@/lib/tenant-init"
import { tenantSettingsRepository } from "@/repositories/TenantSettingsRepository"
import { companyService } from "./companyService"

export interface AltConnector {
  id: string
  name: string
  provider: "Plaid" | "Finicity" | "RentTrack" | "Experian"
  status: "connected" | "disconnected" | "syncing"
  lastSynced: string
  recordsProcessed: number
  category: "Bank Account" | "Asset Verification" | "Rental History" | "Utility History"
}

export interface AltFeature {
  id: string
  name: string
  source: string
  informationValue: number // Predictive power (IV: 0.1 to 0.6)
  proxyRiskScore: number // 0-100
  correlation: number // correlation with protected class
  status: "approved" | "quarantined" | "investigating"
  description: string
  proxyFor: string
}

export interface ThinFileApplicant {
  name: string
  traditionalScore: number | null // null means credit invisible
  altScore: number
  traditionalDecision: "REJECT" | "REFER"
  altDecision: "APPROVE" | "REFER"
  reasonTraditional: string
  reasonAlt: string
}

export interface AltDataState {
  connectors: AltConnector[]
  features: AltFeature[]
  applicantDemo: ThinFileApplicant
  quarantineCount: number
}

const DEFAULT_CONNECTORS: AltConnector[] = [
  {
    id: "c1",
    name: "Plaid Cash Flow API",
    provider: "Plaid",
    status: "connected",
    lastSynced: "2026-05-26T00:45:00Z",
    recordsProcessed: 12450,
    category: "Bank Account",
  },
  {
    id: "c2",
    name: "Finicity Asset Verify",
    provider: "Finicity",
    status: "connected",
    lastSynced: "2026-05-26T00:30:00Z",
    recordsProcessed: 8920,
    category: "Asset Verification",
  },
  {
    id: "c3",
    name: "RentTrack Rent Reporter",
    provider: "RentTrack",
    status: "connected",
    lastSynced: "2026-05-25T23:15:00Z",
    recordsProcessed: 3200,
    category: "Rental History",
  },
  {
    id: "c4",
    name: "Experian Boost Utility",
    provider: "Experian",
    status: "disconnected",
    lastSynced: "2026-05-18T12:00:00Z",
    recordsProcessed: 5600,
    category: "Utility History",
  },
]

const DEFAULT_FEATURES: AltFeature[] = [
  {
    id: "af1",
    name: "Rental_Payment_30Day_Consistency",
    source: "RentTrack",
    informationValue: 0.48,
    proxyRiskScore: 12,
    correlation: 0.05,
    status: "approved",
    description: "Consistency ratio of rent payments over past 24 months. Highly predictive.",
    proxyFor: "None",
  },
  {
    id: "af2",
    name: "Cash_Reserve_Safety_Buffer",
    source: "Plaid",
    informationValue: 0.42,
    proxyRiskScore: 18,
    correlation: 0.08,
    status: "approved",
    description: "Average liquid cash reserves relative to monthly debt commitments.",
    proxyFor: "None",
  },
  {
    id: "af3",
    name: "Overdraft_Fee_Count_L6M",
    source: "Plaid",
    informationValue: 0.35,
    proxyRiskScore: 78,
    correlation: 0.52,
    status: "quarantined",
    description: "Number of overdraft fees in last 6 months. High correlation with low-income zip codes.",
    proxyFor: "Protected Class Proxy (Race/Income)",
  },
  {
    id: "af4",
    name: "Cell_Phone_Bill_Consistency_L12M",
    source: "Experian Boost",
    informationValue: 0.28,
    proxyRiskScore: 32,
    correlation: 0.15,
    status: "approved",
    description: "Consistent utility bill payments recorded via telecommunications providers.",
    proxyFor: "None",
  },
  {
    id: "af5",
    name: "Payday_Loan_Deposit_Pattern",
    source: "Plaid",
    informationValue: 0.51,
    proxyRiskScore: 85,
    correlation: 0.58,
    status: "quarantined",
    description: "Algorithmic detection of direct deposits originating from high-interest subprime lenders.",
    proxyFor: "Protected Class Proxy (Race/Class)",
  },
  {
    id: "af6",
    name: "Subscription_Auto_Renewal_Ratio",
    source: "Plaid",
    informationValue: 0.19,
    proxyRiskScore: 42,
    correlation: 0.25,
    status: "approved",
    description: "Ratio of recurring SaaS/utility payments against total monthly cash outflows.",
    proxyFor: "None",
  },
]

const DEFAULT_APPLICANT: ThinFileApplicant = {
  name: "Marcus A. Robinson",
  traditionalScore: null,
  altScore: 685,
  traditionalDecision: "REJECT",
  altDecision: "APPROVE",
  reasonTraditional: "No established tradelines in past 7 years. Thin-file applicant.",
  reasonAlt: "24 months consistent rent ($1,400/mo) and positive cash-flow buffer ($650 avg) verified.",
}

const DEFAULT_STATE: AltDataState = {
  connectors: DEFAULT_CONNECTORS,
  features: DEFAULT_FEATURES,
  applicantDemo: DEFAULT_APPLICANT,
  quarantineCount: 2,
}

export class AltDataService {
  private state: AltDataState
  private isLoaded = false

  constructor() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE))
    bindTenantInit(() => this.initFromSupabase())
  }

  private async initFromSupabase() {
    if (typeof window === "undefined") return
    const companyId = companyService.getActiveCompanyId()
    if (!companyId) {
      this.isLoaded = true
      return
    }

    try {
      const { data, error } = await tenantSettingsRepository.query().single()

      if (data && !error && data.alt_data_state && Object.keys(data.alt_data_state).length > 0) {
        this.state = data.alt_data_state as AltDataState
      } else {
        // If not found, use defaults
        this.state = JSON.parse(JSON.stringify(DEFAULT_STATE))
      }
    } catch (err) {
      console.error("Failed to load alt data state from Supabase", err)
    } finally {
      this.isLoaded = true
      emit("altData")
    }
  }

  private async saveToSupabase() {
    if (typeof window === "undefined") return
    emit("altData") // Optimistic update
    
    const companyId = companyService.getActiveCompanyId()
    if (!companyId) return

    try {
      const { data, error } = await tenantSettingsRepository.query().single()
      if (data && !error) {
        await tenantSettingsRepository.update(data.id, { alt_data_state: this.state })
      } else {
        await tenantSettingsRepository.insert({ alt_data_state: this.state } as any)
      }
    } catch (err) {
      console.error("Failed to save alt data state to Supabase", err)
    }
  }

  getState(): AltDataState {
    return { ...this.state }
  }

  async toggleConnectorStatus(id: string) {
    const conn = this.state.connectors.find(c => c.id === id)
    if (conn) {
      if (conn.status === "connected") {
        conn.status = "disconnected"
      } else {
        conn.status = "connected"
        conn.lastSynced = new Date().toISOString()
      }
      await this.saveToSupabase()
    }
    return this.getState()
  }

  async toggleFeatureQuarantine(id: string, status: "approved" | "quarantined") {
    const feat = this.state.features.find(f => f.id === id)
    if (feat) {
      feat.status = status
      this.state.quarantineCount = this.state.features.filter(f => f.status === "quarantined").length
      await this.saveToSupabase()
    }
    return this.getState()
  }

  async screenNewFeature(name: string, source: string, correlation: number, iv: number) {
    const riskScore = Math.round(correlation * 120)
    const id = `af-${Date.now()}`
    const newFeature: AltFeature = {
      id,
      name,
      source,
      informationValue: iv,
      proxyRiskScore: Math.min(riskScore, 100),
      correlation,
      status: correlation > 0.45 ? "quarantined" : "approved",
      description: "Dynamically screened bank transactional stream vector.",
      proxyFor: correlation > 0.45 ? "Suspected Demographic Proxy" : "None",
    }
    this.state.features.unshift(newFeature)
    this.state.quarantineCount = this.state.features.filter(f => f.status === "quarantined").length
    await this.saveToSupabase()
    return { state: this.getState(), feature: newFeature }
  }

  async reset() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE))
    await this.saveToSupabase()
    return this.getState()
  }
}

export const altDataService = new AltDataService()
