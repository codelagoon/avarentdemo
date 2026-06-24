import type { LedgerEntry, ThreatEvent } from "@/domains/shared/types"
import {
  mapLedgerEntryToRow,
  mapLedgerRowToEntry,
  mapThreatEventToRow,
  mapThreatRowToEvent,
  type LedgerEventRow,
  type ThreatLogRow,
} from "@/domains/shared/adapters"
import { createUserServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const THREAT_PAGE_SIZE = 50
const LEDGER_PAGE_SIZE = 50

export async function listThreatsForOrganization(
  organizationId: string
): Promise<ThreatEvent[]> {
  const supabase = await createUserServerClient()
  const { data, error } = await supabase
    .from("threat_log")
    .select("*")
    .eq("company_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(THREAT_PAGE_SIZE)

  if (error) {
    throw new Error(`Failed to load investigations: ${error.message}`)
  }

  return (data as ThreatLogRow[]).map(mapThreatRowToEvent)
}

export async function listLedgerForOrganization(
  organizationId: string
): Promise<LedgerEntry[]> {
  const supabase = await createUserServerClient()
  const { data, error } = await supabase
    .from("ledger_events")
    .select("*")
    .eq("company_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(LEDGER_PAGE_SIZE)

  if (error) {
    throw new Error(`Failed to load ledger: ${error.message}`)
  }

  return (data as LedgerEventRow[]).map(mapLedgerRowToEntry)
}

export async function upsertThreatForOrganization(
  organizationId: string,
  event: ThreatEvent
): Promise<void> {
  const supabase = await createUserServerClient()
  const row = mapThreatEventToRow(event, organizationId)

  const { data: existing } = await supabase
    .from("threat_log")
    .select("id")
    .eq("company_id", organizationId)
    .eq("external_id", event.id)
    .maybeSingle()

  if (existing?.id) {
    const { error } = await supabase
      .from("threat_log")
      .update(row)
      .eq("id", existing.id)
    if (error) {
      throw new Error(`Failed to update investigation: ${error.message}`)
    }
    return
  }

  const { error } = await supabase.from("threat_log").insert(row)
  if (error) {
    throw new Error(`Failed to save investigation: ${error.message}`)
  }
}

export async function upsertLedgerForOrganization(
  organizationId: string,
  entry: LedgerEntry
): Promise<void> {
  const supabase = await createUserServerClient()
  const row = mapLedgerEntryToRow(entry, organizationId)

  const { data: existing } = await supabase
    .from("ledger_events")
    .select("id")
    .eq("company_id", organizationId)
    .eq("external_id", entry.id)
    .maybeSingle()

  if (existing?.id) {
    const { error } = await supabase
      .from("ledger_events")
      .update(row)
      .eq("id", existing.id)
    if (error) {
      throw new Error(`Failed to update ledger entry: ${error.message}`)
    }
    return
  }

  const { error } = await supabase.from("ledger_events").insert(row)
  if (error) {
    throw new Error(`Failed to save ledger entry: ${error.message}`)
  }
}

export async function seedWorkflowDataIfEmpty(
  organizationId: string,
  threats: ThreatEvent[],
  ledger: LedgerEntry[]
): Promise<{ seededThreats: number; seededLedger: number }> {
  const supabase = await createUserServerClient()
  return seedWorkflowDataIfEmptyWithClient(supabase, organizationId, threats, ledger)
}

/** Service-role seeding during onboarding bootstrap. */
export async function seedWorkflowDataIfEmptyAsAdmin(
  organizationId: string,
  threats: ThreatEvent[],
  ledger: LedgerEntry[]
): Promise<{ seededThreats: number; seededLedger: number }> {
  const supabase = createAdminClient()
  return seedWorkflowDataIfEmptyWithClient(supabase, organizationId, threats, ledger)
}

async function seedWorkflowDataIfEmptyWithClient(
  supabase: Awaited<ReturnType<typeof createUserServerClient>>,
  organizationId: string,
  threats: ThreatEvent[],
  ledger: LedgerEntry[]
): Promise<{ seededThreats: number; seededLedger: number }> {

  const { count: threatCount, error: threatCountError } = await supabase
    .from("threat_log")
    .select("*", { count: "exact", head: true })
    .eq("company_id", organizationId)

  if (threatCountError) {
    throw new Error(`Failed to check threat_log: ${threatCountError.message}`)
  }

  let seededThreats = 0
  if ((threatCount ?? 0) === 0 && threats.length > 0) {
    const rows = threats.map((t) => mapThreatEventToRow(t, organizationId))
    const { error } = await supabase.from("threat_log").insert(rows)
    if (error) {
      throw new Error(`Failed to seed investigations: ${error.message}`)
    }
    seededThreats = rows.length
  }

  const { count: ledgerCount, error: ledgerCountError } = await supabase
    .from("ledger_events")
    .select("*", { count: "exact", head: true })
    .eq("company_id", organizationId)

  if (ledgerCountError) {
    throw new Error(`Failed to check ledger_events: ${ledgerCountError.message}`)
  }

  let seededLedger = 0
  if ((ledgerCount ?? 0) === 0 && ledger.length > 0) {
    const rows = ledger.map((e) => mapLedgerEntryToRow(e, organizationId))
    const { error } = await supabase.from("ledger_events").insert(rows)
    if (error) {
      throw new Error(`Failed to seed ledger: ${error.message}`)
    }
    seededLedger = rows.length
  }

  return { seededThreats, seededLedger }
}
