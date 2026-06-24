/**
 * Canonical identity types for Meridian.
 * organization_id is an alias for companies.id in the database.
 */

export const MEMBERSHIP_ROLES = ["ADMIN", "ANALYST", "REVIEWER"] as const
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number]

export const ORGANIZATION_STATUSES = ["active", "pending", "suspended"] as const
export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number]

export interface Organization {
  organization_id: string
  name: string
  status: OrganizationStatus
  created_by: string | null
  created_at: string
  short_name?: string | null
  regulatory_body?: string | null
  primary_use_case?: string | null
}

export interface Membership {
  user_id: string
  organization_id: string
  role: MembershipRole
  created_at: string
}

/** Session context exposed to all workflows via IdentityProvider. */
export interface ApplicationContext {
  user_id: string
  workos_user_id: string | null
  email: string | null
  organization_id: string | null
  organization_name: string | null
  role: MembershipRole | null
  needs_onboarding: boolean
  is_loading: boolean
}

export const EMPTY_APPLICATION_CONTEXT: ApplicationContext = {
  user_id: "",
  workos_user_id: null,
  email: null,
  organization_id: null,
  organization_name: null,
  role: null,
  needs_onboarding: true,
  is_loading: true,
}

/** Map legacy DB role strings to canonical membership roles. */
export function normalizeMembershipRole(
  role: string | null | undefined
): MembershipRole | null {
  if (!role) return null
  const upper = role.toUpperCase()
  if (upper === "ADMIN" || upper === "OWNER") return "ADMIN"
  if (upper === "ANALYST" || upper === "MEMBER") return "ANALYST"
  if (upper === "REVIEWER" || upper === "VIEWER") return "REVIEWER"
  if (role === "admin" || role === "owner") return "ADMIN"
  if (role === "member") return "ANALYST"
  if (role === "viewer") return "REVIEWER"
  return null
}
