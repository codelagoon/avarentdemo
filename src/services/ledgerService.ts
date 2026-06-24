import type { LedgerEntry } from "@/data/mockData"
import { LEDGER_ENTRIES, generateHash } from "@/data/mockData"
import { emit } from "@/lib/sync"
import { supabase } from "@/lib/supabaseClient"
import { companyService } from "./companyService"

export class LedgerService {
  private entries: LedgerEntry[] = []
  private isLoaded = false

  constructor() {
    this.initFromSupabase()
  }

  private async initFromSupabase() {
    if (typeof window === "undefined") return
    
    // We start with mock data, then merge/override with Supabase data
    this.entries = [...LEDGER_ENTRIES]
    
    const companyId = companyService.getActiveCompanyId()
    if (!companyId) {
      this.isLoaded = true
      return
    }

    try {
      const { data, error } = await supabase
        .from("ledger_events")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })

      if (data && !error) {
        // Parse the decision_event JSON strings back into LedgerEntries
        const remoteEntries = data.map(row => {
          try {
            const entry = JSON.parse(row.decision_event) as LedgerEntry
            // Override with actual DB hashes
            return {
              ...entry,
              hash: row.current_hash,
              prevHash: row.previous_hash,
            }
          } catch {
            return null
          }
        }).filter(Boolean) as LedgerEntry[]

        // Merge remote entries with local mock entries (remote taking precedence)
        // For a real app, you might only use remote entries, but for demo we mix them
        const remoteIds = new Set(remoteEntries.map(e => e.id))
        this.entries = [...remoteEntries, ...this.entries.filter(e => !remoteIds.has(e.id))]
      }
    } catch (err) {
      console.error("Failed to load ledger from Supabase", err)
    } finally {
      this.isLoaded = true
      emit("ledger")
    }
  }

  getAll(): LedgerEntry[] {
    return [...this.entries].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }

  getRecent(count: number): LedgerEntry[] {
    return this.getAll().slice(0, count)
  }

  getById(id: string): LedgerEntry | undefined {
    return this.entries.find(e => e.id === id)
  }

  async add(entry: Omit<LedgerEntry, "id" | "timestamp" | "hash" | "prevHash">): Promise<LedgerEntry> {
    const now = new Date()
    const id = `EVT-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${String(this.entries.length + 1).padStart(4, "0")}`
    const prevEntry = this.entries[0]

    // Pre-calculate hash locally for optimistic UI updates
    const prevHash = prevEntry?.hash ?? "0".repeat(64)
    const newEntry: LedgerEntry = {
      ...entry,
      id,
      timestamp: now.toISOString(),
      hash: generateHash(id + entry.applicantId + now.toISOString()),
      prevHash,
    }

    this.entries.unshift(newEntry)
    emit("ledger") // Optimistic update

    // Persist to Supabase
    const companyId = companyService.getActiveCompanyId()
    if (companyId) {
      try {
        const { data, error } = await supabase
          .from("ledger_events")
          .insert({
            company_id: companyId,
            applicant_id: newEntry.applicantId,
            decision_event: JSON.stringify(newEntry),
            // The DB trigger `chain_ledger_event` actually computes the hashes
            // But we pass dummy values to satisfy NOT NULL constraints if needed
            previous_hash: prevHash,
            current_hash: newEntry.hash,
            seal_signature: "optimistic_signature"
          })
          .select()
          .single()

        if (data && !error) {
          // Update local entry with server-generated hashes from trigger
          newEntry.hash = data.current_hash
          newEntry.prevHash = data.previous_hash
          emit("ledger")
        }
      } catch (err) {
        console.error("Failed to persist ledger event to Supabase", err)
      }
    }

    return newEntry
  }

  async update(id: string, updates: Partial<LedgerEntry>): Promise<LedgerEntry | null> {
    const index = this.entries.findIndex(e => e.id === id)
    if (index === -1) return null

    this.entries[index] = { ...this.entries[index], ...updates }
    emit("ledger") // Optimistic update

    const companyId = companyService.getActiveCompanyId()
    if (companyId) {
      // Find the row to update based on applicant_id and decision_event content (hacky, ideally we have an id column)
      // Since ledger is immutable, updates shouldn't really happen, but for demo we'll just update memory
      console.warn("Ledger updates are not persisted to Supabase as it's an append-only ledger")
    }

    return this.entries[index]
  }

  search(query: string): LedgerEntry[] {
    const lower = query.toLowerCase()
    return this.getAll().filter(e =>
      e.applicantName.toLowerCase().includes(lower) ||
      e.applicantId.toLowerCase().includes(lower) ||
      e.message.toLowerCase().includes(lower) ||
      e.id.toLowerCase().includes(lower)
    )
  }

  filterByType(type: string): LedgerEntry[] {
    if (type === "all") return this.getAll()
    return this.getAll().filter(e => e.eventType === type)
  }

  getStats() {
    const all = this.getAll()
    return {
      total: all.length,
      interventions: all.filter(e => e.eventType === "intervention").length,
      alerts: all.filter(e => e.eventType === "alert").length,
      decisions: all.filter(e => e.eventType === "decision").length,
      avgFairness: all.length > 0
        ? all.reduce((sum, e) => sum + e.fairnessScore, 0) / all.length
        : 0,
    }
  }

  reset() {
    this.entries = [...LEDGER_ENTRIES]
    emit("ledger")
  }
}

export const ledgerService = new LedgerService()
