import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env"

export interface CreateUserServerClientOptions {
  /** When true, response cookies can be set (required for auth sync). */
  writable?: boolean
}

/** User-scoped Supabase client backed by the request cookie jar. */
export async function createUserServerClient(
  options: CreateUserServerClientOptions = {}
) {
  const cookieStore = await cookies()
  const writable = options.writable ?? false

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        if (!writable) return
        cookiesToSet.forEach(({ name, value, options: cookieOptions }) => {
          cookieStore.set(name, value, cookieOptions)
        })
      },
    },
  })
}

/** True when a Supabase auth session cookie is present on the request. */
export function hasSupabaseAuthCookie(
  cookieList: { name: string; value: string }[]
): boolean {
  return cookieList.some(
    (c) => c.name.includes("-auth-token") && c.name.startsWith("sb-")
  )
}
