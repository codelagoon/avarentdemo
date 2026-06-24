import { NextResponse } from "next/server"
import type { LedgerEntry } from "@/domains/shared/types"
import { upsertLedgerForOrganization } from "@/domains/workflows/supabaseWorkflowRepository"
import { resolveApplicationContext } from "@/lib/identity/resolve-context"

export async function PUT(request: Request) {
  const context = await resolveApplicationContext()

  if (!context.user_id || !context.organization_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { entry: LedgerEntry }
  try {
    body = (await request.json()) as { entry: LedgerEntry }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!body.entry?.id) {
    return NextResponse.json({ error: "entry.id is required" }, { status: 400 })
  }

  await upsertLedgerForOrganization(context.organization_id, body.entry)
  return NextResponse.json({ ok: true })
}
