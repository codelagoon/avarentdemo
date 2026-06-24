import { emit } from "@/lib/sync"
import { decisionRepository, DecisionRecord } from "@/repositories/DecisionRepository"

// We keep the LedgerEntry interface to prevent the UI from breaking until we refactor the views
export interface LedgerEntry {
  id: string
  timestamp: string
  applicantId: string
  applicantName: string
  eventType: "decision" | "alert" | "intervention"
  message: string
  details?: any
  hash: string
  prevHash: string
  fairnessScore: number
}

function mapToLedgerEntry(record: DecisionRecord): LedgerEntry {
  return {
    id: record.id,
    timestamp: record.created_at,
    applicantId: record.applicant_id,
    applicantName: record.applicant_name,
    eventType: record.circuit_breaker_triggered ? "intervention" : "decision",
    message: `Application ${record.outcome.toUpperCase()}`,
    details: { shap: record.shap_features, reasons: record.top_reasons },
    hash: record.id,
    prevHash: "0000000000000000000000000000000000000000000000000000000000000000",
    fairnessScore: record.fairness_score || 0.9
  }
}

export class LedgerService {
  private entries: LedgerEntry[] = []
  private isLoaded = false

  constructor() {
    this.initFromSupabase()
  }

  private async initFromSupabase() {
    if (typeof window === "undefined") return
    
    try {
      // Load directly from the new DecisionRepository which enforces tenant isolation
      const records = await decisionRepository.findRecent(500)
      this.entries = records.map(mapToLedgerEntry)
    } catch (err) {
      console.error("Failed to load ledger from Supabase via decisionRepository", err)
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

  async add(entry: any): Promise<LedgerEntry> {
    throw new Error("Cannot add to ledgerService directly. Use POST /api/v1/decisions instead.")
  }

  async update(id: string, updates: Partial<LedgerEntry>): Promise<LedgerEntry | null> {
    throw new Error("Ledger is immutable.")
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

  async reset() {
    await this.initFromSupabase()
  }
}

export const ledgerService = new LedgerService()
