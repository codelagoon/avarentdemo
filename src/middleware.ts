import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { authkit, handleAuthkitHeaders } from "@workos-inc/authkit-nextjs"
import { isWorkOSConfigured } from "@/lib/workos/env"
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env"

/**
 * Refreshes Supabase auth cookies and applies WorkOS AuthKit headers when configured.
 * Does NOT redirect unauthenticated users — login gate is client-side at `/`.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  await supabase.auth.getUser()

  if (!isWorkOSConfigured()) {
    return response
  }

  const { headers } = await authkit(request)
  const workosResponse = handleAuthkitHeaders(request, headers)

  response.cookies.getAll().forEach((cookie) => {
    workosResponse.cookies.set(cookie.name, cookie.value)
  })

  return workosResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|monitoring|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
