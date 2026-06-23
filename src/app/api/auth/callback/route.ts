import { handleAuth } from "@workos-inc/authkit-nextjs"
import { syncWorkOSUserToSupabase } from "@/lib/identity/workos-supabase-sync"
import { logAuthEvent } from "@/lib/security/auth-events"

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
