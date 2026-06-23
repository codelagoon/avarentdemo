import {
  DISPARITY_TREND_30D,
  MONITORING_SEVERITY_COUNTS,
  MONITORING_SIGNALS,
  type ThreatSeverity,
} from "@/data/mockData"
import type { MonitoringSignal, DisparityTrendPoint } from "@/data/mockData"
import { fairnessDriftService, type DriftAlert } from "@/services/fairnessDriftService"
import { threatService } from "@/services/threatService"
import { ledgerService } from "@/services/ledgerService"
import type { MonitoringRepository } from "@/domains/shared/repositories"

export const MONITORING_SYNC_CHANNELS = ["fairnessDrift", "threat", "ledger"] as const

const SEED_KEY = "avarent_fairness_drift_seeded"

function seedMonitoringIfNeeded(): void {
  if (typeof window === "undefined") return
  if (localStorage.getItem(SEED_KEY)) return
  if (fairnessDriftService.getMetrics().length > 0) {
    localStorage.setItem(SEED_KEY, "true")
    return
  }

  DISPARITY_TREND_30D.forEach((point, index) => {
    const mortgageAir = point.mortgage
    fairnessDriftService.recordMetrics({
      cohortId: `cohort-${point.day}`,
      psi: 0.08 + index * 0.002,
      psiThreshold: 0.25,
      dpd: Math.max(0, 1 - mortgageAir),
      dpdThreshold: 0.05,
      demographicBreakdown: [
        {
          group: "Hispanic / Latino",
          approvalRate: mortgageAir,
          sampleSize: 1200 + index * 10,
          disparateImpact: mortgageAir,
        },
        {
          group: "Black / African American",
          approvalRate: point.auto,
          sampleSize: 980 + index * 8,
          disparateImpact: point.auto,
        },
      ],
      accuracyFairnessPoints: [
        {
          model: "FNB-FAIR-v4.2.1",
          accuracy: 0.81 + index * 0.0005,
          fairness: mortgageAir,
          timestamp: new Date().toISOString(),
        },
      ],
    })
  })

  localStorage.setItem(SEED_KEY, "true")
}

export const monitoringRepository: MonitoringRepository = {
  getMetrics: () => {
    seedMonitoringIfNeeded()
    return fairnessDriftService.getMetrics()
  },
  getActiveAlerts: () => {
    seedMonitoringIfNeeded()
    return fairnessDriftService.getActiveAlerts()
  },
  ensureSeeded: seedMonitoringIfNeeded,
}

export interface MonitoringPageAlert {
  id: string
  title: string
  detail: string
  time: string
  severity: ThreatSeverity
  referenceId: string
}

function formatRelativeTime(isoTimestamp: string): string {
  const diffMs = Date.now() - new Date(isoTimestamp).getTime()
  const minutes = Math.max(1, Math.round(diffMs / 60_000))
  if (minutes < 60) return `${minutes}m`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.round(hours / 24)}d`
}

function driftSeverity(severity: DriftAlert["severity"]): ThreatSeverity {
  if (severity === "critical") return "critical"
  if (severity === "high") return "high"
  return "medium"
}

export function getMonitoringAlerts(): MonitoringPageAlert[] {
  seedMonitoringIfNeeded()
  const driftAlerts: MonitoringPageAlert[] = monitoringRepository
    .getActiveAlerts()
    .map((alert) => ({
      id: alert.id,
      title: `Fairness drift — ${alert.metric}`,
      detail: alert.recommendedAction,
      time: formatRelativeTime(alert.timestamp),
      severity: driftSeverity(alert.severity),
      referenceId: alert.cohortId,
    }))

  const threatAlerts: MonitoringPageAlert[] = threatService
    .getAll()
    .filter((t) => t.blocked)
    .map((threat) => ({
      id: threat.id,
      title: threat.attackVector,
      detail: threat.description,
      time: formatRelativeTime(threat.timestamp),
      severity: threat.severity,
      referenceId: threat.findingId ?? threat.id,
    }))

  const parity = fairnessDriftService.getParityMonitor()
  if (parity.status !== "normal") {
    driftAlerts.unshift({
      id: "alert-air-floor",
      title: "Adverse Impact Ratio below regulatory floor",
      detail: `Demographic parity difference (DPD) ${(parity.currentDPD * 100).toFixed(2)}% — ${parity.trend}`,
      time: "1h",
      severity: parity.status === "critical" ? "critical" : "high",
      referenceId: "FN-204",
    })
  }

  const rank: Record<ThreatSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  }

  return [...driftAlerts, ...threatAlerts].sort(
    (a, b) => rank[a.severity] - rank[b.severity]
  )
}

export function getEmergingRisks() {
  return threatService.getAll().filter((t) => !t.blocked)
}

export function getDisparityTrend(): DisparityTrendPoint[] {
  seedMonitoringIfNeeded()
  const metrics = fairnessDriftService.getMetrics()
  if (metrics.length === 0) return DISPARITY_TREND_30D

  return metrics.slice(-30).map((m, index) => ({
    day: `D${index + 1}`,
    mortgage: 1 - m.dpd,
    auto: m.demographicBreakdown[1]?.disparateImpact ?? 0.8,
    personal: m.demographicBreakdown[0]?.disparateImpact ?? 0.82,
    creditCard: m.psi < 0.15 ? 0.88 : 0.79,
  }))
}

export function getMonitoringSignals(): MonitoringSignal[] {
  seedMonitoringIfNeeded()
  const latest = fairnessDriftService.getLatestMetrics()
  if (!latest) return MONITORING_SIGNALS

  return [
    {
      id: "air",
      metricName: "Approval rate parity",
      technicalTerm: "Adverse Impact Ratio (AIR)",
      value: 1 - latest.dpd,
      trend: latest.dpd > 0.05 ? "down" : "flat",
      severity: latest.dpd > 0.08 ? "critical" : latest.dpd > 0.05 ? "high" : "medium",
    },
    {
      id: "spd",
      metricName: "Statistical parity gap",
      technicalTerm: "Statistical Parity Difference (SPD)",
      value: latest.dpd,
      trend: latest.dpd > 0.05 ? "up" : "flat",
      severity: latest.dpd > 0.08 ? "critical" : "high",
    },
    ...MONITORING_SIGNALS.slice(2),
  ]
}

export function getSeverityCounts() {
  const alerts = getMonitoringAlerts()
  return {
    critical: alerts.filter((a) => a.severity === "critical").length,
    high: alerts.filter((a) => a.severity === "high").length,
    medium: alerts.filter((a) => a.severity === "medium").length,
    low: alerts.filter((a) => a.severity === "low").length,
  }
}

export function getMonitoringDailyStats() {
  const stats = threatService.getStats()
  const ledger = ledgerService.getStats()
  return {
    openIncidents: stats.active,
    systemHealth: ledger.avgFairness > 0.85 ? "Operational" : "Degraded",
    modelVersion: "FNB-FAIR-v4.2.1",
  }
}
