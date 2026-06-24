import { supabase } from "@/lib/supabaseClient"
import { companyService } from "@/services/companyService"

/**
 * BaseRepository enforces tenant isolation across all database operations.
 * It automatically injects the `company_id` into queries.
 */
export abstract class BaseRepository<T> {
  protected tableName: string
  protected serverTenantId?: string

  constructor(tableName: string, serverTenantId?: string) {
    this.tableName = tableName
    this.serverTenantId = serverTenantId
  }

  /**
   * Retrieves the current tenant's company_id securely.
   * Throws an error if no tenant is active, preventing accidental cross-tenant queries.
   */
  protected getTenantId(): string {
    if (this.serverTenantId) return this.serverTenantId
    
    if (typeof window === "undefined") {
      throw new Error(`Tenant Isolation Violation: Attempted to query ${this.tableName} on the server without injecting a tenant context.`)
    }

    const companyId = companyService.getActiveCompanyId()
    if (!companyId) {
      throw new Error(`Tenant Isolation Violation: Attempted to query ${this.tableName} without an active tenant context.`)
    }
    return companyId
  }

  /**
   * Returns a Supabase query builder pre-filtered by the active tenant.
   */
  public query() {
    return supabase.from(this.tableName).select("*").eq("company_id", this.getTenantId())
  }

  /**
   * Inserts a record, automatically injecting the tenant ID.
   */
  async insert(data: Omit<T, "id" | "company_id" | "created_at">): Promise<T> {
    const payload = { ...data, company_id: this.getTenantId() }
    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return result as T
  }

  /**
   * Updates a record, enforcing tenant isolation.
   */
  async update(id: string, data: Partial<Omit<T, "id" | "company_id" | "created_at">>): Promise<T> {
    const { data: result, error } = await supabase
      .from(this.tableName)
      .update(data)
      .eq("id", id)
      .eq("company_id", this.getTenantId()) // Double-check tenant scoping
      .select()
      .single()

    if (error) throw error
    return result as T
  }

  /**
   * Deletes a record safely.
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq("id", id)
      .eq("company_id", this.getTenantId())

    if (error) throw error
  }
}
