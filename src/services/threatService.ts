import type { ThreatEvent } from "@/domains/shared/types"
import { THREAT_EVENTS } from "@/data/mockData"
import { emit } from "@/lib/sync"
import {
  getCachedOrganizationId,
  getCachedThreats,
  upsertThreatInCache,
} from "@/lib/workflows/client-store"
import { toast } from "sonner"

const STORAGE_KEY = "avarent_threat_events"

async function persistThreatToApi(event: ThreatEvent): Promise<void> {
  if (typeof window === "undefined" || !getCachedOrganizationId()) return
  try {
    const response = await fetch("/api/workflows/investigations", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event }),
    })
    if (!response.ok) {
      throw new Error(`Investigation sync failed (${response.status})`)
    }
    upsertThreatInCache(event)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sync investigation"
    toast.error(message)
  }
}

export class ThreatService {
  private events: ThreatEvent[]

  constructor() {
    this.events = this.loadFromStorage()
  }

  private loadFromStorage(): ThreatEvent[] {
    if (typeof window === "undefined") return THREAT_EVENTS
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return THREAT_EVENTS
      }
    }
    return THREAT_EVENTS
  }

  /** Single source for reads and writes — prefers Supabase-hydrated cache. */
  private resolveEvents(): ThreatEvent[] {
    const cached = getCachedThreats()
    if (cached) {
      this.events = [...cached]
      return this.events
    }
    this.events = this.loadFromStorage()
    return this.events
  }

  private saveToStorage() {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.events))
    emit("threat")
  }

  getAll(): ThreatEvent[] {
    return [...this.resolveEvents()].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }

  getRecent(count: number): ThreatEvent[] {
    return this.getAll().slice(0, count)
  }

  getById(id: string): ThreatEvent | undefined {
    return this.resolveEvents().find((e) => e.id === id)
  }

  add(event: Omit<ThreatEvent, "id" | "timestamp">): ThreatEvent {
    const now = new Date()
    const id = `THREAT-${now.getTime()}`

    const newEvent: ThreatEvent = {
      ...event,
      id,
      timestamp: now.toISOString(),
    }

    const events = this.resolveEvents()
    events.unshift(newEvent)
    this.saveToStorage()
    upsertThreatInCache(newEvent)
    void persistThreatToApi(newEvent)
    return newEvent
  }

  update(id: string, updates: Partial<ThreatEvent>): ThreatEvent | null {
    const events = this.resolveEvents()
    const index = events.findIndex((e) => e.id === id)
    if (index === -1) return null

    events[index] = { ...events[index], ...updates }
    this.saveToStorage()
    upsertThreatInCache(events[index])
    void persistThreatToApi(events[index])
    return events[index]
  }

  block(id: string): ThreatEvent | null {
    return this.update(id, { blocked: true })
  }

  getStats() {
    const all = this.getAll()
    const blocked = all.filter((e) => e.blocked).length
    return {
      total: all.length,
      blocked,
      active: all.length - blocked,
      critical: all.filter((e) => e.severity === "critical" && !e.blocked).length,
      high: all.filter((e) => e.severity === "high" && !e.blocked).length,
      byVector: this.groupByVector(all),
    }
  }

  private groupByVector(events: ThreatEvent[]) {
    return events.reduce(
      (acc, e) => {
        acc[e.attackVector] = (acc[e.attackVector] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
  }

  reset() {
    this.events = [...THREAT_EVENTS]
    this.saveToStorage()
  }
}

export const threatService = new ThreatService()
