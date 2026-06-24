import { emit } from "@/lib/sync"
import { monitoringRepository, ThreatEvent as DomainThreatEvent } from "@/repositories/MonitoringRepository"

// Keep UI interface compatible
export interface ThreatEvent {
  id: string
  timestamp: string
  severity: "critical" | "high" | "medium" | "low"
  attackVector: string
  description: string
  sourceIp: string
  targetEndpoint: string
  blocked: boolean
}

function mapToUI(event: DomainThreatEvent): ThreatEvent {
  return {
    id: event.id,
    timestamp: event.timestamp || new Date().toISOString(),
    severity: event.severity,
    attackVector: event.type || "unknown",
    description: event.description,
    sourceIp: "192.168.1.1", // Mocked for UI compatibility until UI is refactored
    targetEndpoint: "/api/v1/decisions",
    blocked: event.status === "resolved",
  }
}

export class ThreatService {
  private events: ThreatEvent[] = []
  private isLoaded = false

  constructor() {
    this.initFromSupabase()
  }

  private async initFromSupabase() {
    if (typeof window === "undefined") return
    try {
      const data = await monitoringRepository.getActiveThreats()
      this.events = data.map(mapToUI)
    } catch (err) {
      console.error("Failed to load threats from repository", err)
    } finally {
      this.isLoaded = true
      emit("threat")
    }
  }

  getAll(): ThreatEvent[] {
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

  async add(event: Omit<ThreatEvent, "id" | "timestamp">): Promise<ThreatEvent> {
    try {
      const inserted = await monitoringRepository.insertThreatEvent({
        severity: event.severity,
        type: event.attackVector,
        description: event.description,
        affected_features: [],
        status: event.blocked ? "resolved" : "active"
      })
      const mapped = mapToUI(inserted as any)
      this.events.unshift(mapped)
      emit("threat")
      return mapped
    } catch (err) {
      console.error("Failed to insert threat", err)
      throw err
    }
  }

  async update(id: string, updates: Partial<ThreatEvent>): Promise<ThreatEvent | null> {
    const index = this.events.findIndex(e => e.id === id)
    if (index === -1) return null

    if (updates.blocked) {
      try {
        await monitoringRepository.resolveThreat(id)
        this.events[index].blocked = true
        emit("threat")
      } catch (err) {
        console.error("Failed to resolve threat", err)
      }
    }
    return this.events[index]
  }

  async block(id: string): Promise<ThreatEvent | null> {
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

  async reset() {
    await this.initFromSupabase()
  }
}

export const threatService = new ThreatService()
