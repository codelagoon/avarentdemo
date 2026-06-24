import { supabase } from "@/lib/supabaseClient"
import { getCachedOrganizationId } from "@/lib/workflows/client-store"
import { companyService } from "@/services/companyService"

/** Impossible UUID — used for no-op reads before tenant context exists. */
const EMPTY_TENANT_SENTINEL = "00000000-0000-0000-0000-000000000000"

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
   * Resolves tenant scope. Server routes must pass `serverTenantId`.
   * Client reads return null (not throw) when org context is not ready yet.
   */
  protected resolveTenantId(required: boolean): string | null {
    if (this.serverTenantId) return this.serverTenantId

    if (typeof window === "undefined") {
      if (required) {
        throw new Error(
          `Tenant Isolation Violation: Attempted to query ${this.tableName} on the server without injecting a tenant context.`
        )
      }
      return null
    }

    const companyId =
      companyService.getActiveCompanyId() ?? getCachedOrganizationId()

    if (!companyId && required) {
      throw new Error(
        `Tenant Isolation Violation: Attempted to query ${this.tableName} without an active tenant context.`
      )
    }

    return companyId
  }

  /**
   * Retrieves the current tenant's company_id securely.
   * Throws on mutations or server reads without injected tenant context.
   */
  protected getTenantId(): string {
    return this.resolveTenantId(true) as string
  }

  /**
   * Returns a Supabase query builder pre-filtered by the active tenant.
   * Before tenant context exists on the client, returns an empty-result query.
   */
  public query() {
    const tenantId = this.resolveTenantId(false)
    if (!tenantId) {
      return supabase
        .from(this.tableName)
        .select("*")
        .eq("company_id", EMPTY_TENANT_SENTINEL)
    }
    return supabase.from(this.tableName).select("*").eq("company_id", tenantId)
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
