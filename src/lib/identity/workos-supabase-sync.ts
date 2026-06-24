import type { User as WorkOSUser } from "@workos-inc/node"
import { createAdminClient } from "@/lib/supabase/admin"
import { createUserServerClient } from "@/lib/supabase/server"

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

  const { data: existingUserData, error: lookupError } =
    await admin.auth.admin.getUserByEmail(email)

  if (lookupError) {
    throw new Error(`Failed to look up Supabase user: ${lookupError.message}`)
  }

  const existing = existingUserData.user

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

  const supabase = await createUserServerClient({ writable: true })

  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "email",
  })

  if (verifyError) {
    throw new Error(`Failed to establish Supabase session: ${verifyError.message}`)
  }

  return { supabaseUserId, created }
}
