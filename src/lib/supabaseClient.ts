/**
 * Unified Supabase client entry for browser and legacy imports.
 * Browser: SSR-aware client via `@/lib/supabase/client`.
 * Server/build: anon client with env vars or static-build fallbacks (main branch).
 */
import {
  createClient as createSupabaseJsClient,
  type SupabaseClient,
} from "@supabase/supabase-js"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const BUILD_FALLBACK_URL = "https://zpjjoskdaouhzinijztf.supabase.co"
const BUILD_FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwampvc2tkYW91aHppbmlqenRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3OTc2NzEsImV4cCI6MjA4OTM3MzY3MX0.pYrFFQfM2IDg9r1rs-HLDUAeFXQ3fBGhJS6ZB9oenW4"

let serverClient: SupabaseClient | null = null

function getServerClient(): SupabaseClient {
  if (!serverClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || BUILD_FALLBACK_URL
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || BUILD_FALLBACK_ANON_KEY
    serverClient = createSupabaseJsClient(url, key)
  }
  return serverClient
}

export function getSupabaseClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    return getSupabaseBrowserClient()
  }
  return getServerClient()
}

/** @deprecated Prefer getSupabaseClient() — kept for main-branch repository imports. */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient()
    const value = client[prop as keyof SupabaseClient]
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value
  },
})
