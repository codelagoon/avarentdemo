import { BaseRepository } from "./BaseRepository"

export interface FairnessAlert {
  id: string
  company_id: string
  metric: string
  severity: "high" | "medium" | "low"
  current_value: number
  threshold: number
  description: string
  is_resolved: boolean
  created_at: string
}

export interface ThreatEvent {
  id: string
  company_id: string
  severity: "critical" | "high" | "medium" | "low"
  type: string
  description: string
  affected_features: string[]
  timestamp: string
  status: "active" | "investigating" | "resolved"
}

export class MonitoringRepository {
  private fairnessRepo = new BaseRepository<FairnessAlert>("fairness_alerts") {}
  private threatRepo = new BaseRepository<ThreatEvent>("threat_log") {}
  private metricsRepo = new BaseRepository<any>("fairness_metrics") {}

  // Fairness Alerts & Metrics
  async getRecentFairnessMetrics() {
    const { data, error } = await this.metricsRepo.query().order("timestamp", { ascending: true }).limit(100)
    if (error) throw error
    return data
  }

  async insertFairnessMetrics(metrics: any) {
    return this.metricsRepo.insert(metrics)
  }

  async insertFairnessAlert(alert: Omit<FairnessAlert, "id" | "company_id" | "created_at">) {
    return this.fairnessRepo.insert(alert)
  }

  async getActiveFairnessAlerts() {
    const { data, error } = await this.fairnessRepo.query().eq("is_resolved", false).order("created_at", { ascending: false })
    if (error) throw error
    return data as FairnessAlert[]
  }

  async resolveFairnessAlert(id: string) {
    return this.fairnessRepo.update(id, { is_resolved: true })
  }

  // Threat Events
  async insertThreatEvent(threat: Omit<ThreatEvent, "id" | "company_id" | "timestamp">) {
    // Note: threat_log might use 'created_at', but if it uses 'timestamp' we override insert manually or rename
    return this.threatRepo.insert(threat as any)
  }

  async getActiveThreats() {
    const { data, error } = await this.threatRepo.query().neq("status", "resolved").order("created_at", { ascending: false })
    if (error) throw error
    return data as ThreatEvent[]
  }

  async resolveThreat(id: string) {
    return this.threatRepo.update(id, { status: "resolved" })
  }
}

export const monitoringRepository = new MonitoringRepository()
