import { createClient } from "@supabase/supabase-js"

const supabaseUrl =
  (typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_SUPABASE_URL : null) ||
  (import.meta.env?.VITE_SUPABASE_URL) ||
  "http://localhost:54321"

const supabaseAnonKey =
  (typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY : null) ||
  (import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZmF1bHQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY3MzY1ODMyMCwiZXhwIjoxOTg5MjM0MzIwfQ.2X7QY4Xz8...dummy"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
