import { createClient } from "@supabase/supabase-js"

const supabaseUrl =
  (typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_SUPABASE_URL : null) ||
  import.meta.env?.VITE_SUPABASE_URL ||
  "https://zpjjoskdaouhzinijztf.supabase.co"
const supabaseAnonKey =
  (typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY : null) ||
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwampvc2tkYW91aHppbmlqenRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3OTc2NzEsImV4cCI6MjA4OTM3MzY3MX0.pYrFFQfM2IDg9r1rs-HLDUAeFXQ3fBGhJS6ZB9oenW4"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
