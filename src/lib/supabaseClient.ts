import { createClient } from "@supabase/supabase-js"

const supabaseUrl =
  (typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_SUPABASE_URL : null) ||
  (import.meta.env?.VITE_SUPABASE_URL) ||
  ""
const supabaseAnonKey =
  (typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY : null) ||
  (import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  ""

const createMockSupabaseClient = () => ({
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
    signInWithPassword: async () => ({
      data: { session: null, user: null },
      error: new Error("Supabase auth is not configured for this environment."),
    }),
    signUp: async () => ({
      data: { session: null, user: null },
      error: new Error("Supabase auth is not configured for this environment."),
    }),
    signOut: async () => ({ error: null }),
  },
})

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createMockSupabaseClient()
