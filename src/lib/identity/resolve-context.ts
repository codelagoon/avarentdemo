import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { withAuth } from "@workos-inc/authkit-nextjs"
import {
  type ApplicationContext,
  normalizeMembershipRole,
} from "@/lib/identity/types"
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env"
import { isWorkOSConfigured } from "@/lib/workos/env"
import { getMembershipForUser } from "@/domains/identity/membershipDomain"

export async function resolveApplicationContext(): Promise<ApplicationContext> {
  let workosUserId: string | null = null
  let workosEmail: string | null = null

  if (isWorkOSConfigured()) {
    try {
      const { user } = await withAuth()
      if (user) {
        workosUserId = user.id
        workosEmail = user.email
      }
    } catch {
      // AuthKit middleware headers may be absent on direct API calls
    }
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll() {
        // read-only
      },
    },
  })

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

  const membership = await getMembershipForUser(supabaseUser.id)

  return {
    user_id: supabaseUser.id,
    workos_user_id: workosUserId ?? (supabaseUser.user_metadata?.workos_user_id as string | undefined) ?? null,
    email: workosEmail ?? supabaseUser.email ?? null,
    organization_id: membership?.organization_id ?? null,
    organization_name: membership?.organization_name ?? null,
    role: membership ? normalizeMembershipRole(membership.role) : null,
    needs_onboarding: !membership,
    is_loading: false,
  }
}
