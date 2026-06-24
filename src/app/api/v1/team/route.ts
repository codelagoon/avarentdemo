import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')

  if (!companyId) {
    return NextResponse.json({ error: "companyId is required" }, { status: 400 })
  }

  // Fetch the active organization roles. In a real app we'd join auth.users 
  // to get names/emails, but Supabase auth.users isn't easily joinable without a public profile table.
  // For the pilot autonomy sprint, we'll return the role mappings and mock the email representation
  // or fetch it if we have a public.users table.
  const { data, error } = await supabaseAdmin
    .from('organization_roles')
    .select('*')
    .eq('company_id', companyId)

  if (error) {
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 })
  }

  // Mocking the user profile enrichment for the pilot UI
  const enrichedData = data.map(role => ({
    ...role,
    email: `user_${role.user_id.split('-')[0]}@company.com`,
    name: `Team Member ${role.user_id.split('-')[0]}`
  }))

  return NextResponse.json(enrichedData)
}

export async function POST(req: Request) {
  try {
    const { email, role, companyId } = await req.json()
    if (!email || !role || !companyId) {
      return NextResponse.json({ error: "Email, role, and companyId are required" }, { status: 400 })
    }

    // In a real app, this would trigger an email invite via WorkOS or Supabase Admin Auth
    // For this pilot, we simulate creating the user and assigning the role.
    const mockUserId = crypto.randomUUID()

    const { data, error } = await supabaseAdmin
      .from('organization_roles')
      .insert({
        company_id: companyId,
        user_id: mockUserId,
        role: role
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to invite user" }, { status: 500 })
    }

    return NextResponse.json({
      ...data,
      email,
      name: "Pending Invite"
    })

  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { id, role } = await req.json()
    
    const { data, error } = await supabaseAdmin
      .from('organization_roles')
      .update({ role })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('organization_roles')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: "Failed to remove user" }, { status: 500 })
  return NextResponse.json({ success: true })
}
