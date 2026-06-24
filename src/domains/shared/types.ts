/** Shared domain types — decoupled from mock seed data. */

export type ThreatSeverity = "critical" | "high" | "medium" | "low" | "nominal"
export type DecisionStatus = "approved" | "denied" | "under_review"
export type LedgerEventType =
  | "decision"
  | "intervention"
  | "alert"
  | "audit"
  | "proof_signed"

export interface LedgerEntry {
  id: string
  timestamp: string
  eventType: LedgerEventType
  applicantId: string
  applicantName: string
  hash: string
  prevHash: string
  decision?: DecisionStatus
  interventionType?: string
  severity?: ThreatSeverity
  modelVersion: string
  fairnessScore: number
  message: string
  nodeCount?: number
}

export interface ThreatEvent {
  id: string
  timestamp: string
  applicantId: string
  applicantName: string
  severity: ThreatSeverity
  attackVector: string
  proxyVariables: string[]
  confidence: number
  blocked: boolean
  modelScore: number
  zipCode?: string
  description: string
  /** Linked Command Center finding (e.g. FN-204) for deep-link navigation */
  findingId?: string
  /** Feature-level label for aggregate monitoring surfaces (no PII) */
  signalLabel?: string
}

export type FindingStatus =
  | "investigating"
  | "review"
  | "resolved"
  | "monitoring"

export interface CommandCenterFinding {
  id: string
  category: string
  issueDescription: string
  affectedGroup: string
  severity: ThreatSeverity
  ageDays: number
  status: FindingStatus
  detectedAt: string
  investigationId?: string
}

export interface ActivityFeedItem {
  id: string
  category: ActivityFeedCategory
  description: string
  severity?: ThreatSeverity
  referenceId?: string
  timestamp: string
}

export type ActivityFeedCategory =
  | "finding"
  | "investigation"
  | "audit"
  | "analysis"

export interface MonitoringSignal {
  id: string
  featureName: string
  technicalTerm: string
  correlation: number
  sampleSize: number
  severity: ThreatSeverity
  status: "active" | "resolved" | "monitoring"
  lastUpdated: string
}

export interface DisparityTrendPoint {
  date: string
  air: number
  spd: number
  threshold: number
}

export interface ExamReadinessCategory {
  id: string
  label: string
  percentage: number
  status: "complete" | "in_progress" | "at_risk"
}

export interface CommandCenterKpis {
  adverseImpactRatio: {
    technicalTerm: string
    plainLabel: string
    value: number
    threshold: number
    thresholdStatus: string
    passing: boolean
  }
  statisticalParityDifference: {
    technicalTerm: string
    plainLabel: string
    value: number
    threshold: number
    thresholdStatus: string
    passing: boolean
  }
  topBreachMetric: {
    plainLabel: string
    technicalTerm: string
    value: number
    context: string
    thresholdStatus: string
  }
  postureSummary: string
  examReadiness: number
  examLabel: string
  examTrend: string
  activeFindings: {
    total: number
    critical: number
    high: number
    medium: number
    low: number
    trend: string
  }
  investigations: {
    total: number
    open: number
    inReview: number
    resolved: number
    trend: string
  }
  modelsMonitored: {
    active: number
    total: number
    trend: string
  }
}
