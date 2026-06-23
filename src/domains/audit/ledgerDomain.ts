import type { LedgerEntry } from "@/data/mockData"
import { ledgerService } from "@/services/ledgerService"
import type { LedgerRepository } from "@/domains/shared/repositories"

export const ledgerRepository: LedgerRepository = {
  getAll: () => ledgerService.getAll(),
  getRecent: (count) => ledgerService.getRecent(count),
  filterByType: (type) => ledgerService.filterByType(type),
  search: (query) => ledgerService.search(query),
}

export const LEDGER_SYNC_CHANNELS = ["ledger"] as const

export function getLedgerEntries(): LedgerEntry[] {
  return ledgerRepository.getAll()
}

export function getLedgerStats() {
  return ledgerService.getStats()
}

export function exportLedgerExcerpt(): LedgerEntry[] {
  return ledgerRepository.getAll()
}
