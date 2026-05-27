import { createClient } from "@supabase/supabase-js"

const supabaseUrl =
  (typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_SUPABASE_URL : null) ||
  (import.meta.env?.VITE_SUPABASE_URL) ||
  ""
const supabaseAnonKey =
  (typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY : null) ||
  (import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  ""

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
