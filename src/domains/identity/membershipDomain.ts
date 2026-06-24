import type { SupabaseClient } from "@supabase/supabase-js"
import type { Membership, MembershipRole, Organization } from "@/lib/identity/types"
import { normalizeMembershipRole } from "@/lib/identity/types"
import { createAdminClient } from "@/lib/supabase/admin"
import { createUserServerClient } from "@/lib/supabase/server"

export interface CreateOrganizationInput {
  name: string
  short_name?: string
  industry?: string
  size?: string
  regulatory_body?: string
  primary_use_case?: string
  data_volume_estimate?: string
  compliance_needs?: string[]
  email?: string
  phone?: string
  address?: string
  created_by: string
}

export interface CreateMembershipInput {
  user_id: string
  organization_id: string
  role: MembershipRole
}

/** companies table row mapped to Organization type. */
function mapCompanyRow(row: Record<string, unknown>): Organization {
  return {
    organization_id: row.id as string,
    name: row.name as string,
    status: (row.status as Organization["status"]) ?? "active",
    created_by: (row.created_by as string | null) ?? null,
    created_at: row.created_at as string,
    short_name: (row.short_name as string | null) ?? null,
    regulatory_body: (row.regulatory_body as string | null) ?? null,
    primary_use_case: (row.primary_use_case as string | null) ?? null,
  }
}

export async function createOrganization(
  input: CreateOrganizationInput
): Promise<Organization> {
  const supabase = await createUserServerClient()
  return insertOrganization(supabase, input)
}

/** Bootstrap onboarding with service role after the caller verified the user session. */
export async function createOrganizationAsAdmin(
  input: CreateOrganizationInput
): Promise<Organization> {
  const supabase = createAdminClient()
  return insertOrganization(supabase, input)
}

async function insertOrganization(
  supabase: SupabaseClient,
  input: CreateOrganizationInput
): Promise<Organization> {
  const { data, error } = await supabase
    .from("companies")
    .insert({
      name: input.name,
      short_name: input.short_name ?? input.name.slice(0, 10),
      email: input.email ?? null,
      phone: input.phone ?? null,
      address: input.address ?? null,
      industry: input.industry ?? "banking",
      size: input.size ?? "medium",
      regulatory_body: input.regulatory_body ?? "CFPB",
      primary_use_case: input.primary_use_case ?? "personal",
      data_volume_estimate: input.data_volume_estimate ?? "medium",
      compliance_needs: input.compliance_needs ?? [],
      status: "active",
      created_by: input.created_by,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to create organization: ${error?.message ?? "unknown"}`)
  }

  return mapCompanyRow(data as Record<string, unknown>)
}

export async function getOrganizationById(
  organizationId: string
): Promise<Organization | null> {
  const supabase = await createUserServerClient()
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", organizationId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch organization: ${error.message}`)
  }
  return data ? mapCompanyRow(data as Record<string, unknown>) : null
}

export async function createMembership(
  input: CreateMembershipInput
): Promise<Membership> {
  const supabase = await createUserServerClient()
  return insertMembership(supabase, input)
}

/** Bootstrap onboarding membership with service role. */
export async function createMembershipAsAdmin(
  input: CreateMembershipInput
): Promise<Membership> {
  const supabase = createAdminClient()
  return insertMembership(supabase, input)
}

async function insertMembership(
  supabase: SupabaseClient,
  input: CreateMembershipInput
): Promise<Membership> {
  const { data, error } = await supabase
    .from("company_members")
    .insert({
      user_id: input.user_id,
      company_id: input.organization_id,
      role: input.role,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to create membership: ${error?.message ?? "unknown"}`)
  }

  return {
    user_id: data.user_id,
    organization_id: data.company_id,
    role: normalizeMembershipRole(data.role) ?? input.role,
    created_at: data.created_at,
  }
}

export async function getMembershipForUser(
  userId: string
): Promise<(Membership & { organization_name: string; organization_status: string }) | null> {
  const supabase = await createUserServerClient()

  const { data, error } = await supabase
    .from("company_members")
    .select("user_id, company_id, role, created_at, companies(name, status)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch membership: ${error.message}`)
  }
  if (!data) return null

  const company = data.companies as { name: string; status: string } | null

  return {
    user_id: data.user_id,
    organization_id: data.company_id,
    role: normalizeMembershipRole(data.role) ?? "ANALYST",
    created_at: data.created_at,
    organization_name: company?.name ?? "",
    organization_status: company?.status ?? "active",
  }
}

export async function updateMembershipRole(
  userId: string,
  organizationId: string,
  role: MembershipRole
): Promise<Membership> {
  const supabase = await createUserServerClient()

  const { data, error } = await supabase
    .from("company_members")
    .update({ role })
    .eq("user_id", userId)
    .eq("company_id", organizationId)
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to update membership: ${error?.message ?? "unknown"}`)
  }

  return {
    user_id: data.user_id,
    organization_id: data.company_id,
    role: normalizeMembershipRole(data.role) ?? role,
    created_at: data.created_at,
  }
}

export async function validateMembership(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const supabase = await createUserServerClient()
  const { data, error } = await supabase
    .from("company_members")
    .select("id")
    .eq("user_id", userId)
    .eq("company_id", organizationId)
    .maybeSingle()

  if (error) {
    throw new Error(`Membership validation failed: ${error.message}`)
  }
  return Boolean(data)
}

/** Admin-only bootstrap (WorkOS sync). Not for routine domain reads/writes. */
export function createMembershipAdminClient() {
  return createAdminClient()
}
