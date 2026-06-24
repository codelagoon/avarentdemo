import type { ThreatEvent } from "@/domains/shared/types"
import { THREAT_EVENTS } from "@/data/mockData"
import { emit } from "@/lib/sync"
import {
  getCachedOrganizationId,
  getCachedThreats,
} from "@/lib/workflows/client-store"

const STORAGE_KEY = "avarent_threat_events"

async function persistThreatToApi(event: ThreatEvent): Promise<void> {
  if (typeof window === "undefined" || !getCachedOrganizationId()) return
  try {
    await fetch("/api/workflows/investigations", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event }),
    })
  } catch {
    // localStorage remains source of truth until API succeeds
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

  private saveToStorage() {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.events))
    emit("threat")
  }

  getAll(): ThreatEvent[] {
    const cached = getCachedThreats()
    if (cached) return [...cached]

    this.events = this.loadFromStorage()
    return [...this.events].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }

  getRecent(count: number): ThreatEvent[] {
    return this.getAll().slice(0, count)
  }

  getById(id: string): ThreatEvent | undefined {
    return this.events.find(e => e.id === id)
  }

  add(event: Omit<ThreatEvent, "id" | "timestamp">): ThreatEvent {
    const now = new Date()
    const id = `THREAT-${now.getTime()}`

    const newEvent: ThreatEvent = {
      ...event,
      id,
      timestamp: now.toISOString(),
    }

    this.events.unshift(newEvent)
    this.saveToStorage()
    void persistThreatToApi(newEvent)
    return newEvent
  }

  update(id: string, updates: Partial<ThreatEvent>): ThreatEvent | null {
    const index = this.events.findIndex(e => e.id === id)
    if (index === -1) return null

    this.events[index] = { ...this.events[index], ...updates }
    this.saveToStorage()
    void persistThreatToApi(this.events[index])
    return this.events[index]
  }

  block(id: string): ThreatEvent | null {
    return this.update(id, { blocked: true })
  }

  getStats() {
    const all = this.getAll()
    const blocked = all.filter(e => e.blocked).length
    return {
      total: all.length,
      blocked,
      active: all.length - blocked,
      critical: all.filter(e => e.severity === "critical" && !e.blocked).length,
      high: all.filter(e => e.severity === "high" && !e.blocked).length,
      byVector: this.groupByVector(all),
    }
  }

  private groupByVector(events: ThreatEvent[]) {
    return events.reduce((acc, e) => {
      acc[e.attackVector] = (acc[e.attackVector] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  reset() {
    this.events = [...THREAT_EVENTS]
    this.saveToStorage()
  }
}

export const threatService = new ThreatService()
