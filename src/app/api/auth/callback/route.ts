import { handleAuth } from "@workos-inc/authkit-nextjs"
import { syncWorkOSUserToSupabase } from "@/lib/identity/workos-supabase-sync"
import { logAuthEvent } from "@/lib/security/auth-events"
import { getPostHogClient } from "@/lib/posthog-server"

export const GET = handleAuth({
  returnPathname: "/",
  onSuccess: async ({ user }) => {
    try {
      const result = await syncWorkOSUserToSupabase(user)
      logAuthEvent({
        type: "auth.sign_in.success",
        userId: result.supabaseUserId,
        email: user.email,
        reason: result.created
          ? "workos_supabase_user_created"
          : "workos_supabase_user_linked",
      })
      const posthog = getPostHogClient()
      posthog.identify({
        distinctId: result.supabaseUserId,
        properties: { email: user.email, name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || undefined },
      })
      posthog.capture({
        distinctId: result.supabaseUserId,
        event: "user_signed_in",
        properties: {
          email: user.email,
          is_new_user: result.created,
          provider: "workos",
        },
      })
    } catch (error) {
      logAuthEvent({
        type: "auth.sign_in.failure",
        email: user.email,
        reason: error instanceof Error ? error.message : "supabase_sync_failed",
      })
      throw error
    }
  },
})
