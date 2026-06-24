export interface Company {
  id: string
  name: string
  short_name?: string
  email?: string
  phone?: string
  address?: string
  industry: "banking" | "lending" | "fintech" | "credit_union" | "other"
  size: "small" | "medium" | "large" | "enterprise"
  regulatory_body: "CFPB" | "OCC" | "FDIC" | "NCUA" | "SEC" | "state" | "other"
  primary_use_case: "mortgage" | "auto" | "personal" | "business" | "credit_cards" | "all"
  data_volume_estimate: "low" | "medium" | "high" | "enterprise"
  compliance_needs: string[]
  fairness_threshold: number
  alert_email?: string
  retention_period_years: number
  model_version: string
  created_at: string
  owner_id?: string
}

import { emit } from "@/lib/sync"
import { supabase } from "@/lib/supabaseClient"

export class CompanyService {
  private company: Company | null = null
  private isLoaded = false
  private currentUserId: string | null = null

  constructor() {
    this.initFromSupabase()
    
    // Subscribe to auth state changes
    if (typeof window !== "undefined") {
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session) {
          this.currentUserId = session.user.id
          this.fetchUserCompany()
        } else if (event === "SIGNED_OUT") {
          this.reset()
        }
      })
    }
  }

  private async initFromSupabase() {
    if (typeof window === "undefined") return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        this.currentUserId = session.user.id
        await this.fetchUserCompany()
      } else {
        this.isLoaded = true
      }
    } catch (err) {
      console.error("Failed to init auth session", err)
      this.isLoaded = true
    }
  }

  private async fetchUserCompany() {
    if (!this.currentUserId) return
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("owner_id", this.currentUserId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
      
      if (data && !error) {
        this.company = data as Company
      } else {
        this.company = null
      }
    } catch (err) {
      this.company = null
    } finally {
      this.isLoaded = true
      emit("company")
    }
  }

  get(): Company | null {
    return this.company
  }
  
  getActiveCompanyId(): string | null {
    return this.company?.id || null
  }

  async create(data: Omit<Company, "id" | "created_at" | "fairness_threshold" | "retention_period_years" | "model_version" | "owner_id">): Promise<Company> {
    if (!this.currentUserId) {
      throw new Error("Cannot create company: No authenticated user session.")
    }

    const { data: inserted, error } = await supabase
      .from("companies")
      .insert({
        ...data,
        owner_id: this.currentUserId
      })
      .select()
      .single()

    if (error) throw error

    this.company = inserted as Company
    emit("company")
    return this.company
  }

  async update(data: Partial<Company>): Promise<Company | null> {
    if (!this.company) return null
    
    const { data: updated, error } = await supabase
      .from("companies")
      .update(data)
      .eq("id", this.company.id)
      .select()
      .single()
      
    if (error) throw error
    
    this.company = updated as Company
    emit("company")
    return this.company
  }

  async completeOnboarding() {
    // In production, update user metadata or a dedicated profile row
    if (this.currentUserId) {
      await supabase.auth.updateUser({
        data: { onboarding_complete: true }
      })
      emit("company")
    }
  }

  async checkOnboardingStatus(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.user_metadata?.onboarding_complete === true
  }

  reset() {
    this.company = null
    this.currentUserId = null
    emit("company")
  }

  exists(): boolean {
    return this.company !== null
  }
}

export const companyService = new CompanyService()
