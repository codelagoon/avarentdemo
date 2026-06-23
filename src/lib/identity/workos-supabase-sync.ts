import type { User as WorkOSUser } from "@workos-inc/node"
import { createAdminClient } from "@/lib/supabase/admin"
import { createServerClient } from "@supabase/ssr"
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env"
import { cookies } from "next/headers"

export interface SupabaseSyncResult {
  supabaseUserId: string
  created: boolean
}

/**
 * Links a WorkOS-authenticated user to a Supabase auth.users row and
 * establishes a Supabase session cookie for RLS-backed API access.
 *
 * Architecture: WorkOS (identity) → Supabase user (data/RLS) → Application
 */
export async function syncWorkOSUserToSupabase(
  workosUser: WorkOSUser
): Promise<SupabaseSyncResult> {
  if (!workosUser.email) {
    throw new Error("WorkOS user is missing an email address")
  }

  const admin = createAdminClient()
  const email = workosUser.email.toLowerCase()

  let supabaseUserId: string
  let created = false

  const { data: listData, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  if (listError) {
    throw new Error(`Failed to list Supabase users: ${listError.message}`)
  }

  const existing = listData.users.find(
    (u) => u.email?.toLowerCase() === email
  )

  if (existing) {
    supabaseUserId = existing.id
    await admin.auth.admin.updateUserById(supabaseUserId, {
      user_metadata: {
        ...existing.user_metadata,
        workos_user_id: workosUser.id,
        first_name: workosUser.firstName ?? existing.user_metadata?.first_name,
        last_name: workosUser.lastName ?? existing.user_metadata?.last_name,
      },
    })
  } else {
    const { data: createData, error: createError } =
      await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          workos_user_id: workosUser.id,
          first_name: workosUser.firstName,
          last_name: workosUser.lastName,
        },
      })

    if (createError || !createData.user) {
      throw new Error(
        `Failed to create Supabase user: ${createError?.message ?? "unknown"}`
      )
    }
    supabaseUserId = createData.user.id
    created = true
  }

  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    })

  if (linkError || !linkData.properties?.hashed_token) {
    throw new Error(
      `Failed to generate Supabase session link: ${linkError?.message ?? "missing token"}`
    )
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options)
        })
      },
    },
  })

  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "email",
  })

  if (verifyError) {
    throw new Error(`Failed to establish Supabase session: ${verifyError.message}`)
  }

  return { supabaseUserId, created }
}
