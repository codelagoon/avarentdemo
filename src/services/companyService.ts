export interface Company {
  id: string
  name: string
  shortName: string
  email: string
  phone: string
  address: string
  industry: "banking" | "lending" | "fintech" | "credit_union" | "other"
  size: "small" | "medium" | "large" | "enterprise"
  regulatoryBody: "CFPB" | "OCC" | "FDIC" | "NCUA" | "SEC" | "state" | "other"
  primaryUseCase: "mortgage" | "auto" | "personal" | "business" | "credit_cards" | "all"
  dataVolumeEstimate: "low" | "medium" | "high" | "enterprise"
  complianceNeeds: string[]
  onboardingComplete: boolean
  createdAt: string
  settings: {
    autoAudit: boolean
    alertThreshold: number
    retentionDays: number
    enableML: boolean
  }
}

const STORAGE_KEY = "avarent_company"
const ONBOARDING_KEY = "avarent_onboarding_complete"

const DEFAULT_SETTINGS = {
  autoAudit: true,
  alertThreshold: 0.8,
  retentionDays: 2555, // 7 years
  enableML: true,
}

export class CompanyService {
  private company: Company | null = null

  constructor() {
    this.company = this.loadFromStorage()
  }

  private loadFromStorage(): Company | null {
    if (typeof window === "undefined") return null
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return null
      }
    }
    return null
  }

  private saveToStorage() {
    if (typeof window === "undefined") return
    if (this.company) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.company))
    }
  }

  get(): Company | null {
    return this.company
  }

  create(data: Omit<Company, "id" | "createdAt" | "onboardingComplete" | "settings">): Company {
    const company: Company = {
      ...data,
      id: `COMP-${Date.now()}`,
      createdAt: new Date().toISOString(),
      onboardingComplete: false,
      settings: { ...DEFAULT_SETTINGS },
    }
    this.company = company
    this.saveToStorage()
    return company
  }

  update(data: Partial<Company>): Company | null {
    if (!this.company) return null
    this.company = { ...this.company, ...data }
    this.saveToStorage()
    return this.company
  }

  completeOnboarding(): Company | null {
    return this.update({ onboardingComplete: true })
  }

  isOnboardingComplete(): boolean {
    if (typeof window === "undefined") return false
    return localStorage.getItem(ONBOARDING_KEY) === "true" || this.company?.onboardingComplete === true
  }

  setOnboardingComplete(complete: boolean = true) {
    if (typeof window === "undefined") return
    localStorage.setItem(ONBOARDING_KEY, complete ? "true" : "false")
    if (complete) {
      this.completeOnboarding()
    }
  }

  reset() {
    this.company = null
    if (typeof window === "undefined") return
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(ONBOARDING_KEY)
  }

  exists(): boolean {
    return this.company !== null
  }
}

export const companyService = new CompanyService()
