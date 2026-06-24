import { withAuth } from "@workos-inc/authkit-nextjs"
import {
  type ApplicationContext,
  normalizeMembershipRole,
} from "@/lib/identity/types"
import { isWorkOSConfigured } from "@/lib/workos/env"
import { getMembershipForUser } from "@/domains/identity/membershipDomain"
import { syncWorkOSUserToSupabase } from "@/lib/identity/workos-supabase-sync"
import {
  createUserServerClient,
} from "@/lib/supabase/server"

async function buildContextFromSupabaseUser(
  supabaseUser: {
    id: string
    email?: string
    user_metadata?: Record<string, unknown>
  },
  workosUserId: string | null,
  workosEmail: string | null
): Promise<ApplicationContext> {
  const membership = await getMembershipForUser(supabaseUser.id)

  return {
    user_id: supabaseUser.id,
    workos_user_id:
      workosUserId ??
      (supabaseUser.user_metadata?.workos_user_id as string | undefined) ??
      null,
    email: workosEmail ?? supabaseUser.email ?? null,
    organization_id: membership?.organization_id ?? null,
    organization_name: membership?.organization_name ?? null,
    role: membership ? normalizeMembershipRole(membership.role) : null,
    needs_onboarding: !membership,
    is_loading: false,
  }
}

export async function resolveApplicationContext(): Promise<ApplicationContext> {
  let workosUserId: string | null = null
  let workosEmail: string | null = null
  let workosUser: Awaited<ReturnType<typeof withAuth>>["user"] | null = null

  if (isWorkOSConfigured()) {
    try {
      const auth = await withAuth()
      workosUser = auth.user
      if (auth.user) {
        workosUserId = auth.user.id
        workosEmail = auth.user.email
      }
    } catch {
      // AuthKit middleware headers may be absent on direct API calls
    }
  }

  const supabase = await createUserServerClient({ writable: false })

  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser()

  if (!supabaseUser && !workosUserId) {
    return {
      user_id: "",
      workos_user_id: null,
      email: null,
      organization_id: null,
      organization_name: null,
      role: null,
      needs_onboarding: false,
      is_loading: false,
    }
  }

  if (!supabaseUser && workosUserId && workosUser) {
    try {
      await syncWorkOSUserToSupabase(workosUser)
      const linkedClient = await createUserServerClient({ writable: false })
      const {
        data: { user: linkedUser },
      } = await linkedClient.auth.getUser()
      if (linkedUser) {
        return buildContextFromSupabaseUser(linkedUser, workosUserId, workosEmail)
      }
    } catch {
      // Fall through to WorkOS-only context; mutations use ensureSupabaseUserLinked.
    }

    return {
      user_id: "",
      workos_user_id: workosUserId,
      email: workosEmail,
      organization_id: null,
      organization_name: null,
      role: null,
      needs_onboarding: true,
      is_loading: false,
    }
  }

  if (!supabaseUser) {
    return {
      user_id: "",
      workos_user_id: workosUserId,
      email: workosEmail,
      organization_id: null,
      organization_name: null,
      role: null,
      needs_onboarding: true,
      is_loading: false,
    }
  }

  return buildContextFromSupabaseUser(supabaseUser, workosUserId, workosEmail)
}

/** Ensures WorkOS-authenticated users have a linked Supabase session before mutations. */
export async function ensureSupabaseUserLinked(): Promise<ApplicationContext> {
  const context = await resolveApplicationContext()

  if (context.user_id || !context.workos_user_id || !isWorkOSConfigured()) {
    return context
  }

  const { user } = await withAuth()
  if (!user) {
    return context
  }

  await syncWorkOSUserToSupabase(user)
  return resolveApplicationContext()
}
