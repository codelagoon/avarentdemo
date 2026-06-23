import { signOut } from "@workos-inc/authkit-nextjs"
import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env"
import { isWorkOSConfigured } from "@/lib/workos/env"
import { logAuthEvent } from "@/lib/security/auth-events"

export async function GET() {
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

  await supabase.auth.signOut()
  logAuthEvent({ type: "auth.sign_out" })

  if (isWorkOSConfigured()) {
    return signOut({ returnTo: "/" })
  }

  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:5173"))
}
