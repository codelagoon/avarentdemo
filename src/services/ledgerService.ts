import type { LedgerEntry } from "@/domains/shared/types"
import { LEDGER_ENTRIES, generateHash } from "@/data/mockData"
import { emit } from "@/lib/sync"
import {
  getCachedLedger,
  getCachedOrganizationId,
  upsertLedgerInCache,
} from "@/lib/workflows/client-store"
import { toast } from "sonner"

const STORAGE_KEY = "avarent_ledger_entries"

async function persistLedgerToApi(entry: LedgerEntry): Promise<void> {
  if (typeof window === "undefined" || !getCachedOrganizationId()) return
  try {
    const response = await fetch("/api/workflows/ledger", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entry }),
    })
    if (!response.ok) {
      throw new Error(`Ledger sync failed (${response.status})`)
    }
    upsertLedgerInCache(entry)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sync ledger entry"
    toast.error(message)
  }
}

export class LedgerService {
  private entries: LedgerEntry[]

  constructor() {
    this.entries = this.loadFromStorage()
  }

  private loadFromStorage(): LedgerEntry[] {
    if (typeof window === "undefined") return LEDGER_ENTRIES
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return LEDGER_ENTRIES
      }
    }
    return LEDGER_ENTRIES
  }

  /** Single source for reads and writes — prefers Supabase-hydrated cache. */
  private resolveEntries(): LedgerEntry[] {
    const cached = getCachedLedger()
    if (cached) {
      this.entries = [...cached]
      return this.entries
    }
    this.entries = this.loadFromStorage()
    return this.entries
  }

  private saveToStorage() {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries))
    emit("ledger")
  }

  getAll(): LedgerEntry[] {
    return [...this.resolveEntries()].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }

  getRecent(count: number): LedgerEntry[] {
    return this.getAll().slice(0, count)
  }

  getById(id: string): LedgerEntry | undefined {
    return this.resolveEntries().find((e) => e.id === id)
  }

  add(entry: Omit<LedgerEntry, "id" | "timestamp" | "hash" | "prevHash">): LedgerEntry {
    const now = new Date()
    const sorted = this.getAll()
    const id = `EVT-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${String(sorted.length + 1).padStart(4, "0")}`
    const prevEntry = sorted[0]

    const newEntry: LedgerEntry = {
      ...entry,
      id,
      timestamp: now.toISOString(),
      hash: generateHash(id + entry.applicantId + now.toISOString()),
      prevHash: prevEntry?.hash ?? "0".repeat(64),
    }

    const entries = this.resolveEntries()
    entries.unshift(newEntry)
    this.saveToStorage()
    upsertLedgerInCache(newEntry)
    void persistLedgerToApi(newEntry)
    return newEntry
  }

  update(id: string, updates: Partial<LedgerEntry>): LedgerEntry | null {
    const entries = this.resolveEntries()
    const index = entries.findIndex((e) => e.id === id)
    if (index === -1) return null

    entries[index] = { ...entries[index], ...updates }
    this.saveToStorage()
    upsertLedgerInCache(entries[index])
    return entries[index]
  }

  search(query: string): LedgerEntry[] {
    const lower = query.toLowerCase()
    return this.getAll().filter(
      (e) =>
        e.applicantName.toLowerCase().includes(lower) ||
        e.applicantId.toLowerCase().includes(lower) ||
        e.message.toLowerCase().includes(lower) ||
        e.id.toLowerCase().includes(lower)
    )
  }

  filterByType(type: string): LedgerEntry[] {
    if (type === "all") return this.getAll()
    return this.getAll().filter((e) => e.eventType === type)
  }

  getStats() {
    const all = this.getAll()
    return {
      total: all.length,
      interventions: all.filter((e) => e.eventType === "intervention").length,
      alerts: all.filter((e) => e.eventType === "alert").length,
      decisions: all.filter((e) => e.eventType === "decision").length,
      avgFairness:
        all.length > 0
          ? all.reduce((sum, e) => sum + e.fairnessScore, 0) / all.length
          : 0,
    }
  }

  reset() {
    this.entries = [...LEDGER_ENTRIES]
    this.saveToStorage()
  }
}

export const ledgerService = new LedgerService()
