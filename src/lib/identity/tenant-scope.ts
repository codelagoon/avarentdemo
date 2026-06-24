import type { ApplicationContext } from "@/lib/identity/types"
import type { TenantScope } from "@/domains/identity/tenant-requirements"

/** Build tenant scope from application context for future repository calls. */
export function toTenantScope(context: ApplicationContext): TenantScope | null {
  if (!context.user_id || !context.organization_id || !context.role) {
    return null
  }
  return {
    organization_id: context.organization_id,
    user_id: context.user_id,
    role: context.role,
  }
}
