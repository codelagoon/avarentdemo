import { NextResponse } from "next/server"
import { THREAT_EVENTS, LEDGER_ENTRIES } from "@/data/mockData"
import {
  listLedgerForOrganization,
  listThreatsForOrganization,
  seedWorkflowDataIfEmpty,
} from "@/domains/workflows/supabaseWorkflowRepository"
import { resolveApplicationContext } from "@/lib/identity/resolve-context"

export async function GET() {
  const context = await resolveApplicationContext()

  if (!context.user_id || !context.organization_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const organizationId = context.organization_id

  await seedWorkflowDataIfEmpty(
    organizationId,
    THREAT_EVENTS.slice(0, 12),
    LEDGER_ENTRIES.slice(0, 12)
  )

  const [threats, ledger] = await Promise.all([
    listThreatsForOrganization(organizationId),
    listLedgerForOrganization(organizationId),
  ])

  return NextResponse.json({
    organization_id: organizationId,
    threats,
    ledger,
  })
}
