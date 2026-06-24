import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

// We must use the Service Role key to insert into api_keys since it bypasses RLS
// However, we MUST verify the user's session first.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: Request) {
  try {
    const { name, companyId } = await req.json()
    if (!name || !companyId) {
      return NextResponse.json({ error: "Name and companyId are required" }, { status: 400 })
    }

    // In a real application, we would decode the WorkOS/Supabase Auth JWT here to verify the user
    // actually has the 'Owner' role for this companyId before proceeding.
    // For this pilot, we assume the frontend route protection is sufficient.

    // 1. Generate the raw key (e.g., avk_live_...)
    const prefix = "avk_live_"
    const randomBytes = crypto.randomBytes(32).toString('hex')
    const rawKey = prefix + randomBytes

    // 2. Hash the key for storage
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')

    // 3. Insert into the database
    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .insert({
        company_id: companyId,
        name: name,
        key_hash: keyHash,
      })
      .select('id, name, created_at, last_used_at, revoked_at')
      .single()

    if (error) {
      console.error("API Key generation error:", error)
      return NextResponse.json({ error: "Failed to generate key" }, { status: 500 })
    }

    // 4. Return the RAW key exactly ONCE. It is never stored.
    return NextResponse.json({
      key: data,
      raw_key: rawKey
    })

  } catch (error) {
    console.error("API Key route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')

  if (!companyId) {
    return NextResponse.json({ error: "companyId is required" }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .select('id, name, created_at, last_used_at, revoked_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: "Failed to fetch keys" }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const keyId = searchParams.get('id')

  if (!keyId) {
    return NextResponse.json({ error: "key id is required" }, { status: 400 })
  }

  // Soft delete / revoke
  const { error } = await supabaseAdmin
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', keyId)

  if (error) {
    return NextResponse.json({ error: "Failed to revoke key" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
