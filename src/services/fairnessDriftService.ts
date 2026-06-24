import { toast } from "sonner"
import { emit } from "@/lib/sync"
import { supabase } from "@/lib/supabaseClient"
import { companyService } from "./companyService"

export interface FairnessDriftMetrics {
  timestamp: string
  cohortId: string
  // Population Stability Index
  psi: number
  psiThreshold: number
  // Demographic Parity Difference
  dpd: number
  dpdThreshold: number
  // Protected class breakdowns
  demographicBreakdown: {
    group: string
    approvalRate: number
    sampleSize: number
    disparateImpact: number
  }[]
  // Accuracy vs Fairness trade-off
  accuracyFairnessPoints: {
    model: string
    accuracy: number
    fairness: number
    timestamp: string
  }[]
}

export interface DriftAlert {
  id: string
  timestamp: string
  severity: "critical" | "high" | "warning"
  metric: "PSI" | "DPD" | "BOTH"
  currentValue: number
  threshold: number
  delta: number
  cohortId: string
  recommendedAction: string
  acknowledged: boolean
}

export interface ParityMonitor {
  currentDPD: number
  historicalDPD: number[]
  baselineDPD: number
  status: "normal" | "warning" | "critical"
  trend: "improving" | "stable" | "degrading"
}

// Real-time fairness drift monitoring
// Tracks PSI and DPD with alerting at ΔDPD > 0.05
class FairnessDriftService {
  private readonly DPD_THRESHOLD = 0.05 // ΔDPD > 0.05 triggers alert
  private readonly PSI_THRESHOLD = 0.25 // PSI > 0.25 indicates significant shift
  private metrics: FairnessDriftMetrics[] = []
  private alerts: DriftAlert[] = []
  private isMonitoring = false
  private monitoringInterval: ReturnType<typeof setInterval> | null = null
  private isLoaded = false

  constructor() {
    this.initFromSupabase()
  }

  private async initFromSupabase() {
    if (typeof window === "undefined") return
    const companyId = companyService.getActiveCompanyId()
    if (!companyId) {
      this.isLoaded = true
      return
    }

    try {
      const [metricsRes, alertsRes] = await Promise.all([
        supabase
          .from("fairness_metrics")
          .select("*")
          .eq("company_id", companyId)
          .order("timestamp", { ascending: true })
          .limit(100),
        supabase
          .from("fairness_alerts")
          .select("*")
          .eq("company_id", companyId)
          .order("timestamp", { ascending: false })
      ])

      if (metricsRes.data && !metricsRes.error) {
        this.metrics = metricsRes.data.map(m => ({
          timestamp: m.timestamp,
          cohortId: m.cohort_id,
          psi: m.psi,
          psiThreshold: m.psi_threshold,
          dpd: m.dpd,
          dpdThreshold: m.dpd_threshold,
          demographicBreakdown: m.demographic_breakdown || [],
          accuracyFairnessPoints: m.accuracy_fairness_points || []
        }))
      }

      if (alertsRes.data && !alertsRes.error) {
        this.alerts = alertsRes.data.map(a => ({
          id: a.id,
          timestamp: a.timestamp,
          severity: a.severity,
          metric: a.metric,
          currentValue: a.current_value,
          threshold: a.threshold,
          delta: a.delta,
          cohortId: a.cohort_id,
          recommendedAction: a.recommended_action,
          acknowledged: a.acknowledged
        }))
      }
    } catch (err) {
      console.error("Failed to load fairness drift data from Supabase", err)
    } finally {
      this.isLoaded = true
      emit("fairnessDrift")
    }
  }

  /**
   * Start real-time monitoring
   */
  startMonitoring(intervalMs: number = 30000) {
    if (this.isMonitoring) return

    this.isMonitoring = true
    this.monitoringInterval = setInterval(() => {
      this.checkDrift()
    }, intervalMs)

    toast.info("Fairness Drift Monitoring: Active", {
      description: `Checking every ${intervalMs / 1000}s for ΔDPD > ${this.DPD_THRESHOLD}`,
    })
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    this.isMonitoring = false
    toast.info("Fairness Drift Monitoring: Stopped")
  }

  /**
   * Record new cohort metrics
   */
  async recordMetrics(metrics: Omit<FairnessDriftMetrics, "timestamp">): Promise<FairnessDriftMetrics> {
    const fullMetrics: FairnessDriftMetrics = {
      ...metrics,
      timestamp: new Date().toISOString(),
    }

    this.metrics.push(fullMetrics)
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }

    emit("fairnessDrift")

    const companyId = companyService.getActiveCompanyId()
    if (companyId) {
      try {
        await supabase.from("fairness_metrics").insert({
          company_id: companyId,
          timestamp: fullMetrics.timestamp,
          cohort_id: fullMetrics.cohortId,
          psi: fullMetrics.psi,
          psi_threshold: fullMetrics.psiThreshold,
          dpd: fullMetrics.dpd,
          dpd_threshold: fullMetrics.dpdThreshold,
          demographic_breakdown: fullMetrics.demographicBreakdown,
          accuracy_fairness_points: fullMetrics.accuracyFairnessPoints
        })
      } catch (err) {
        console.error("Failed to insert fairness metrics", err)
      }
    }

    await this.evaluateDrift(fullMetrics)
    return fullMetrics
  }

  /**
   * Check current drift status
   */
  private async checkDrift() {
    if (this.metrics.length < 2) return

    const latest = this.metrics[this.metrics.length - 1]
    const previous = this.metrics[this.metrics.length - 2]

    const dpdDelta = Math.abs(latest.dpd - previous.dpd)

    if (dpdDelta > this.DPD_THRESHOLD) {
      await this.createAlert({
        severity: dpdDelta > 0.10 ? "critical" : "high",
        metric: "DPD",
        currentValue: latest.dpd,
        threshold: this.DPD_THRESHOLD,
        delta: dpdDelta,
        cohortId: latest.cohortId,
        recommendedAction: dpdDelta > 0.10
          ? "URGENT: Retrain model with fairness constraints immediately"
          : "Schedule bias audit within 48 hours",
      })
    }

    if (latest.psi > this.PSI_THRESHOLD) {
      await this.createAlert({
        severity: latest.psi > 0.35 ? "critical" : "warning",
        metric: "PSI",
        currentValue: latest.psi,
        threshold: this.PSI_THRESHOLD,
        delta: latest.psi - this.PSI_THRESHOLD,
        cohortId: latest.cohortId,
        recommendedAction: "Population shift detected. Review feature distributions.",
      })
    }
  }

  /**
   * Evaluate drift and create alerts
   */
  private async evaluateDrift(metrics: FairnessDriftMetrics) {
    const baselineRecords = this.metrics.slice(0, Math.min(10, this.metrics.length))
    const baselineDPD = baselineRecords.length > 0
      ? baselineRecords.reduce((sum, m) => sum + m.dpd, 0) / baselineRecords.length
      : 0

    const delta = Math.abs(metrics.dpd - baselineDPD)

    if (delta > this.DPD_THRESHOLD) {
      await this.createAlert({
        severity: delta > 0.10 ? "critical" : "high",
        metric: "DPD",
        currentValue: metrics.dpd,
        threshold: this.DPD_THRESHOLD,
        delta,
        cohortId: metrics.cohortId,
        recommendedAction: this.generateRecommendation(delta, metrics),
      })
    }
  }

  private async createAlert(params: Omit<DriftAlert, "id" | "timestamp" | "acknowledged">): Promise<DriftAlert> {
    const alert: DriftAlert = {
      ...params,
      id: `ALERT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    }

    this.alerts.unshift(alert)
    emit("fairnessDrift")

    const companyId = companyService.getActiveCompanyId()
    if (companyId) {
      try {
        await supabase.from("fairness_alerts").insert({
          id: alert.id,
          company_id: companyId,
          timestamp: alert.timestamp,
          severity: alert.severity,
          metric: alert.metric,
          current_value: alert.currentValue,
          threshold: alert.threshold,
          delta: alert.delta,
          cohort_id: alert.cohortId,
          recommended_action: alert.recommendedAction,
          acknowledged: alert.acknowledged
        })
      } catch (err) {
        console.error("Failed to insert drift alert", err)
      }
    }

    toast[alert.severity === "critical" ? "error" : alert.severity === "high" ? "warning" : "info"](
      `Fairness Drift Alert: ${alert.metric} = ${(alert.currentValue * 100).toFixed(2)}%`,
      { description: alert.recommendedAction }
    )

    return alert
  }

  private generateRecommendation(delta: number, _metrics: FairnessDriftMetrics): string {
    void _metrics // Available for future cohort-specific recommendations
    if (delta > 0.10) {
      return "CRITICAL: ΔDPD > 10%. Immediate model retraining required with fairness constraints. Consider activating backup model."
    }
    if (delta > 0.07) {
      return "HIGH: ΔDPD > 7%. Schedule emergency bias audit. Review recent feature engineering changes."
    }
    return `WARNING: ΔDPD = ${(delta * 100).toFixed(1)}%. Schedule routine bias audit within 48 hours.`
  }

  getParityMonitor(): ParityMonitor {
    if (this.metrics.length === 0) {
      return {
        currentDPD: 0,
        historicalDPD: [],
        baselineDPD: 0,
        status: "normal",
        trend: "stable",
      }
    }

    const latest = this.metrics[this.metrics.length - 1]
    const historical = this.metrics.slice(-30).map(m => m.dpd)
    const baseline = this.metrics.slice(0, Math.min(10, this.metrics.length))
      .reduce((sum, m) => sum + m.dpd, 0) / Math.min(10, this.metrics.length)

    const status: ParityMonitor["status"] = latest.dpd > this.DPD_THRESHOLD * 2
      ? "critical"
      : latest.dpd > this.DPD_THRESHOLD
        ? "warning"
        : "normal"

    const recent = historical.slice(-5).reduce((a, b) => a + b, 0) / 5
    const older = historical.slice(0, 5).reduce((a, b) => a + b, 0) / 5
    const trend: ParityMonitor["trend"] = recent < older * 0.95
      ? "improving"
      : recent > older * 1.05
        ? "degrading"
        : "stable"

    return {
      currentDPD: latest.dpd,
      historicalDPD: historical,
      baselineDPD: baseline,
      status,
      trend,
    }
  }

  getActiveAlerts(): DriftAlert[] {
    return this.alerts.filter(a => !a.acknowledged)
  }

  async acknowledgeAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
      emit("fairnessDrift")
      
      try {
        await supabase
          .from("fairness_alerts")
          .update({ acknowledged: true })
          .eq("id", alertId)
      } catch (err) {
        console.error("Failed to acknowledge alert", err)
      }

      toast.success(`Alert ${alertId} acknowledged`)
      return true
    }
    return false
  }

  getAccuracyFairnessData(): { x: number; y: number; label: string }[] {
    return this.metrics.flatMap(m =>
      m.accuracyFairnessPoints.map(p => ({
        x: p.accuracy,
        y: p.fairness,
        label: p.model,
      }))
    )
  }

  getMetrics(): FairnessDriftMetrics[] {
    return [...this.metrics]
  }

  getLatestMetrics(): FairnessDriftMetrics | null {
    return this.metrics[this.metrics.length - 1] || null
  }

  generateDriftReport(): string {
    const monitor = this.getParityMonitor()
    const activeAlerts = this.getActiveAlerts()

    return `
FAIRNESS DRIFT MONITORING REPORT
Generated: ${new Date().toISOString()}

CURRENT STATUS:
- Current DPD: ${(monitor.currentDPD * 100).toFixed(2)}%
- Baseline DPD: ${(monitor.baselineDPD * 100).toFixed(2)}%
- Status: ${monitor.status.toUpperCase()}
- Trend: ${monitor.trend}

ALERTS:
${activeAlerts.length === 0 ? "No active alerts" : activeAlerts.map(a =>
  `- [${a.severity.toUpperCase()}] ${a.metric}: ${(a.currentValue * 100).toFixed(2)}% (Δ${(a.delta * 100).toFixed(2)}%)`
).join("\n")}

RECOMMENDATION:
${activeAlerts.length > 0
  ? activeAlerts[0].recommendedAction
  : "System operating within normal fairness parameters."}
`.trim()
  }

  isActive(): boolean {
    return this.isMonitoring
  }
}

export const fairnessDriftService = new FairnessDriftService()
