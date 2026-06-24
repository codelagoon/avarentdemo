/**
 * Ensures the local demo login account exists with a known password.
 * Run: npx tsx scripts/seed-demo-user.ts
 */
import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const DEMO_EMAIL = "test@example.com"
const DEMO_PASSWORD = "197704"

function loadEnvLocal(): Record<string, string> {
  const path = resolve(process.cwd(), ".env.local")
  const raw = readFileSync(path, "utf8")
  return Object.fromEntries(
    raw
      .split("\n")
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=")
        return [line.slice(0, index), line.slice(index + 1)]
      })
  )
}

async function main() {
  const env = loadEnvLocal()
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: listed, error: listError } = await admin.auth.admin.listUsers({
    perPage: 1000,
  })
  if (listError) throw listError

  const existing = listed.users.find((user) => user.email === DEMO_EMAIL)

  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password: DEMO_PASSWORD,
      email_confirm: true,
    })
    if (error) throw error
    console.log(`Updated password for ${DEMO_EMAIL} (${existing.id})`)
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
    })
    if (error) throw error
    console.log(`Created ${DEMO_EMAIL} (${data.user?.id})`)
  }

  const anon = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const { error: signInError } = await anon.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  })
  if (signInError) throw signInError

  console.log("Demo login verified successfully.")
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
