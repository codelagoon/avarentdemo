import { NextResponse } from "next/server"
import type { ThreatEvent } from "@/domains/shared/types"
import { upsertThreatForOrganization } from "@/domains/workflows/supabaseWorkflowRepository"
import { resolveApplicationContext } from "@/lib/identity/resolve-context"

export async function PUT(request: Request) {
  const context = await resolveApplicationContext()

  if (!context.user_id || !context.organization_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { event: ThreatEvent }
  try {
    body = (await request.json()) as { event: ThreatEvent }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!body.event?.id) {
    return NextResponse.json({ error: "event.id is required" }, { status: 400 })
  }

  await upsertThreatForOrganization(context.organization_id, body.event)
  return NextResponse.json({ ok: true })
}
