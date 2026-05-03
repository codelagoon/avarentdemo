import { toast } from "sonner"

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
  recordMetrics(metrics: Omit<FairnessDriftMetrics, "timestamp">): FairnessDriftMetrics {
    const fullMetrics: FairnessDriftMetrics = {
      ...metrics,
      timestamp: new Date().toISOString(),
    }

    this.metrics.push(fullMetrics)

    // Keep only last 100 records
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }

    // Check for drift
    this.evaluateDrift(fullMetrics)

    return fullMetrics
  }

  /**
   * Check current drift status
   */
  private checkDrift() {
    if (this.metrics.length < 2) return

    const latest = this.metrics[this.metrics.length - 1]
    const previous = this.metrics[this.metrics.length - 2]

    const dpdDelta = Math.abs(latest.dpd - previous.dpd)

    if (dpdDelta > this.DPD_THRESHOLD) {
      this.createAlert({
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
      this.createAlert({
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
  private evaluateDrift(metrics: FairnessDriftMetrics) {
    // Calculate baseline from first 10 records
    const baselineRecords = this.metrics.slice(0, Math.min(10, this.metrics.length))
    const baselineDPD = baselineRecords.length > 0
      ? baselineRecords.reduce((sum, m) => sum + m.dpd, 0) / baselineRecords.length
      : 0

    const delta = Math.abs(metrics.dpd - baselineDPD)

    if (delta > this.DPD_THRESHOLD) {
      this.createAlert({
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

  private createAlert(params: Omit<DriftAlert, "id" | "timestamp" | "acknowledged">): DriftAlert {
    const alert: DriftAlert = {
      ...params,
      id: `ALERT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    }

    this.alerts.unshift(alert)

    // Show toast
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

  /**
   * Get current parity monitor status
   */
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
    void latest // Used for status calculation
    const historical = this.metrics.slice(-30).map(m => m.dpd)
    const baseline = this.metrics.slice(0, Math.min(10, this.metrics.length))
      .reduce((sum, m) => sum + m.dpd, 0) / Math.min(10, this.metrics.length)

    const status: ParityMonitor["status"] = latest.dpd > this.DPD_THRESHOLD * 2
      ? "critical"
      : latest.dpd > this.DPD_THRESHOLD
        ? "warning"
        : "normal"

    // Calculate trend
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

  /**
   * Get all unacknowledged alerts
   */
  getActiveAlerts(): DriftAlert[] {
    return this.alerts.filter(a => !a.acknowledged)
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
      toast.success(`Alert ${alertId} acknowledged`)
      return true
    }
    return false
  }

  /**
   * Get metrics for scatter plot (Accuracy vs Fairness)
   */
  getAccuracyFairnessData(): { x: number; y: number; label: string }[] {
    return this.metrics.flatMap(m =>
      m.accuracyFairnessPoints.map(p => ({
        x: p.accuracy,
        y: p.fairness,
        label: p.model,
      }))
    )
  }

  /**
   * Get all historical metrics
   */
  getMetrics(): FairnessDriftMetrics[] {
    return [...this.metrics]
  }

  /**
   * Get latest cohort metrics
   */
  getLatestMetrics(): FairnessDriftMetrics | null {
    return this.metrics[this.metrics.length - 1] || null
  }

  /**
   * Generate summary report
   */
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
