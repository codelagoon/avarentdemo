/**
 * Centralized Supabase environment configuration.
 * Fails fast when required variables are missing — no hardcoded fallbacks.
 */

function requireEnv(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}. See .env.example for configuration.`
    )
  }
  return value
}

/** Public Supabase project URL (safe for browser). */
export function getSupabaseUrl(): string {
  return requireEnv(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL
  )
}

/** Public anon/publishable key (safe for browser; RLS enforces access). */
export function getSupabaseAnonKey(): string {
  return requireEnv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

/** Service role key — server-only. Never expose to the client. */
export function getSupabaseServiceRoleKey(): string {
  return requireEnv(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}
