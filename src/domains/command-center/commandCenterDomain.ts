import {
  COMMAND_CENTER_ACTIVITY,
  COMMAND_CENTER_WORKFLOW,
  EXAM_READINESS_CATEGORIES,
  type ActivityFeedItem,
  type CommandCenterFinding,
  type CommandCenterKpis,
  type FindingStatus,
} from "@/data/mockData"
import { getInvestigations, getInvestigationStats } from "@/domains/investigations/investigationDomain"
import { getLedgerEntries, getLedgerStats } from "@/domains/audit/ledgerDomain"
import { getPacketHistory } from "@/domains/audit/auditPacketDomain"
import {
  getDisparityTrend,
  getMonitoringAlerts,
  getMonitoringSignals,
  getSeverityCounts,
  monitoringRepository,
} from "@/domains/fairness/monitoringDomain"
import { fairnessDriftService } from "@/services/fairnessDriftService"

export const COMMAND_CENTER_SYNC_CHANNELS = [
  "threat",
  "ledger",
  "fairnessDrift",
  "auditPacket",
] as const

function threatStatus(blocked: boolean): FindingStatus {
  return blocked ? "resolved" : "investigating"
}

function ageDaysFrom(iso: string): number {
  const diff = Date.now() - new Date(iso).getTime()
  return Math.max(1, Math.round(diff / (24 * 60 * 60 * 1000)))
}

export function getCommandCenterFindings(): CommandCenterFinding[] {
  monitoringRepository.ensureSeeded()
  const fromThreats: CommandCenterFinding[] = getInvestigations()
    .filter((t) => t.findingId)
    .map((threat) => ({
      id: threat.findingId!,
      category: threat.zipCode ? "Mortgage" : "Portfolio",
      issueDescription: threat.attackVector,
      affectedGroup: threat.signalLabel ?? threat.proxyVariables.join(" / "),
      severity: threat.severity,
      ageDays: ageDaysFrom(threat.timestamp),
      status: threatStatus(threat.blocked),
      detectedAt: threat.timestamp,
      investigationId: threat.id,
    }))

  if (fromThreats.length > 0) {
    return fromThreats.sort((a, b) => a.ageDays - b.ageDays)
  }

  return getInvestigations().slice(0, 5).map((threat, index) => ({
    id: `FN-${200 + index}`,
    category: "Mortgage",
    issueDescription: threat.attackVector,
    affectedGroup: threat.signalLabel ?? "Protected class cohort",
    severity: threat.severity,
    ageDays: ageDaysFrom(threat.timestamp),
    status: threatStatus(threat.blocked),
    detectedAt: threat.timestamp,
    investigationId: threat.id,
  }))
}

export function getCommandCenterKpis(): CommandCenterKpis {
  monitoringRepository.ensureSeeded()
  const threatStats = getInvestigationStats()
  const findings = getCommandCenterFindings()
  const parity = fairnessDriftService.getParityMonitor()
  const air = 1 - parity.currentDPD
  const spd = parity.currentDPD

  const critical = findings.filter((f) => f.severity === "critical").length
  const high = findings.filter((f) => f.severity === "high").length
  const medium = findings.filter((f) => f.severity === "medium").length
  const low = findings.filter((f) => f.severity === "low").length

  return {
    adverseImpactRatio: {
      technicalTerm: "AIR",
      plainLabel: "Adverse Impact Ratio",
      value: air,
      threshold: 0.8,
      thresholdStatus: air >= 0.8 ? "within 0.80 threshold" : "below 0.80 threshold",
      passing: air >= 0.8,
    },
    statisticalParityDifference: {
      technicalTerm: "SPD",
      plainLabel: "Statistical Parity Difference",
      value: spd,
      threshold: 0.1,
      thresholdStatus: spd <= 0.1 ? "within 0.10 threshold" : "above 0.10 threshold",
      passing: spd <= 0.1,
    },
    topBreachMetric: {
      plainLabel: "Approval Rate Disparity",
      technicalTerm: "Adverse Impact Ratio",
      value: air,
      context: "Hispanic / Latino — Mortgage",
      thresholdStatus: air >= 0.8 ? "within threshold" : "below 0.80 threshold",
    },
    postureSummary:
      critical > 0
        ? `${critical} critical finding${critical === 1 ? "" : "s"} need immediate review; mortgage AIR breach is the top priority.`
        : "Portfolio within monitored fairness thresholds; continue surveillance.",
    examReadiness: Math.min(99, 70 + getPacketHistory().length * 6),
    examLabel: air >= 0.8 ? "Strong" : "At risk",
    examTrend: parity.trend === "improving" ? "↑ improving" : "↓ degrading",
    activeFindings: {
      total: findings.length,
      critical,
      high,
      medium,
      low,
      trend: `${threatStats.active} active threats`,
    },
    investigations: {
      total: threatStats.total,
      open: threatStats.active,
      inReview: findings.filter((f) => f.status === "review").length,
      resolved: threatStats.blocked,
      trend: `Avg. age: ${findings.length ? (findings.reduce((s, f) => s + f.ageDays, 0) / findings.length).toFixed(1) : "0"} days`,
    },
    modelsMonitored: {
      active: 3,
      total: 12,
      trend: "↑ 2 new this month",
    },
  }
}

export function getCommandCenterActivity(): ActivityFeedItem[] {
  const fromLedger: ActivityFeedItem[] = getLedgerEntries()
    .slice(0, 8)
    .map((entry) => ({
      id: entry.id,
      category:
        entry.eventType === "proof_signed"
          ? "audit"
          : entry.eventType === "intervention"
            ? "investigation"
            : entry.eventType === "alert"
              ? "finding"
              : "analysis",
      description: entry.message,
      severity: entry.severity,
      referenceId: entry.id,
      timestamp: entry.timestamp,
    }))

  if (fromLedger.length > 0) return fromLedger
  return COMMAND_CENTER_ACTIVITY
}

export function getExamReadinessCategories() {
  const packets = getPacketHistory().length
  const ledger = getLedgerStats()
  return EXAM_READINESS_CATEGORIES.map((cat) => {
    if (cat.id === "documentation") {
      return { ...cat, percentage: Math.min(100, 60 + packets * 8) }
    }
    if (cat.id === "evidence") {
      return { ...cat, percentage: Math.min(100, Math.round(ledger.avgFairness * 100)) }
    }
    return cat
  })
}

export {
  getDisparityTrend,
  getMonitoringSignals,
  getSeverityCounts,
  COMMAND_CENTER_WORKFLOW,
}
