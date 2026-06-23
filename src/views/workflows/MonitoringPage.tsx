"use client"

import { useMemo, useState } from "react"
import {
  MonitoringPanel,
  MonitoringPanelTabSwitcher,
  type MonitoringPanelTab,
} from "@/components/command-center/MonitoringPanel"
import { SeverityBadge } from "@/components/command-center/SeverityBadge"
import { ViewportPage } from "@/components/shell/ViewportPage"
import {
  COMMAND_CENTER_ACTIVITY,
  COMMAND_CENTER_KPIS,
  DAILY_STATS,
  DISPARITY_TREND_30D,
  MONITORING_SEVERITY_COUNTS,
  MONITORING_SIGNALS,
  THREAT_EVENTS,
  type ThreatSeverity,
} from "@/data/mockData"
import type { WorkflowId } from "@/lib/navigation"
import { cn } from "@/lib/utils"

export interface MonitoringPageProps {
  onNavigate?: (id: WorkflowId) => void
}

interface MonitoringAlert {
  id: string
  title: string
  detail: string
  time: string
  severity: ThreatSeverity
  referenceId: string
}

const SEVERITY_RANK: Record<ThreatSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

function formatRelativeTime(isoTimestamp: string): string {
  const diffMs = Date.now() - new Date(isoTimestamp).getTime()
  const minutes = Math.max(1, Math.round(diffMs / 60_000))
  if (minutes < 60) return `${minutes}m`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.round(hours / 24)}d`
}

function buildAlerts(): MonitoringAlert[] {
  const threatAlerts: MonitoringAlert[] = THREAT_EVENTS.filter((t) => t.blocked).map(
    (threat) => ({
      id: threat.id,
      title: threat.attackVector,
      detail: threat.description,
      time: formatRelativeTime(threat.timestamp),
      severity: threat.severity,
      referenceId: threat.id,
    })
  )

  const activityAlerts: MonitoringAlert[] = COMMAND_CENTER_ACTIVITY.filter(
    (item) => item.severity
  ).map((item) => ({
    id: item.id,
    title: item.description,
    detail: `Reference ${item.referenceId}`,
    time: formatRelativeTime(item.timestamp),
    severity: item.severity!,
    referenceId: item.referenceId,
  }))

  const airBreach = COMMAND_CENTER_KPIS.adverseImpactRatio
  const airAlert: MonitoringAlert = {
    id: "alert-air-floor",
    title: "Adverse Impact Ratio below regulatory floor",
    detail: `${COMMAND_CENTER_KPIS.topBreachMetric.context} — ${airBreach.plainLabel} (AIR) ${airBreach.value.toFixed(2)} (${airBreach.thresholdStatus})`,
    time: "1h",
    severity: "critical",
    referenceId: "FN-204",
  }

  return [...threatAlerts, ...activityAlerts, airAlert].sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
  )
}

const noopNavigate = () => {}

export function MonitoringPage({ onNavigate = noopNavigate }: MonitoringPageProps) {
  const alerts = useMemo(() => buildAlerts(), [])
  const emerging = THREAT_EVENTS.filter((risk) => !risk.blocked)
  const [monitoringTab, setMonitoringTab] = useState<MonitoringPanelTab>("overview")

  return (
    <ViewportPage testId="monitoring-page">
      <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
        <div className="flex shrink-0 items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
          <span
            className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 motion-reduce:animate-none"
            aria-hidden
          />
          <p className="g-text-caption text-foreground">
            <span className="font-semibold">Monitoring</span>
            <span className="text-muted-foreground">
              {" "}
              · {DAILY_STATS.openIncidents} active · {DAILY_STATS.systemHealth} ·{" "}
              {DAILY_STATS.modelVersion}
            </span>
          </p>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)_minmax(0,11rem)]">
          <section
            aria-labelledby="monitoring-alerts-heading"
            className="flex min-h-0 flex-col overflow-hidden rounded-md border border-border bg-card lg:row-span-2"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
              <h2
                id="monitoring-alerts-heading"
                className="g-text-caption font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Alerts
              </h2>
              <span className="g-text-caption text-muted-foreground">{alerts.length} open</span>
            </div>
            <ul className="min-h-0 flex-1 overflow-y-auto" role="list">
              {alerts.map((alert) => (
                <li key={alert.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate("investigations")}
                    className={cn(
                      "w-full border-b border-border px-3 py-2 text-left transition-colors last:border-b-0",
                      "hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                    )}
                    aria-label={`${alert.severity} alert: ${alert.title}. Open investigation ${alert.referenceId}`}
                  >
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={alert.severity} />
                      <span className="g-text-caption text-muted-foreground">{alert.time}</span>
                      <span className="g-text-caption ml-auto font-mono-data text-muted-foreground">
                        {alert.referenceId}
                      </span>
                    </div>
                    <p className="g-text-caption truncate font-medium text-foreground">{alert.title}</p>
                    <p className="g-text-caption line-clamp-2 text-muted-foreground">{alert.detail}</p>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-md border border-border bg-card">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
              <p className="g-text-caption font-semibold uppercase tracking-wide text-muted-foreground">
                Monitoring Center
              </p>
              <MonitoringPanelTabSwitcher
                compact
                activeTab={monitoringTab}
                onTabChange={setMonitoringTab}
              />
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <MonitoringPanel
                hideHeader
                tabbedView
                activeTab={monitoringTab}
                onTabChange={setMonitoringTab}
                severityCounts={MONITORING_SEVERITY_COUNTS}
                trendData={DISPARITY_TREND_30D}
                signals={MONITORING_SIGNALS}
              />
            </div>
          </section>

          <section
            aria-labelledby="emerging-risks-heading"
            className="flex min-h-0 flex-col overflow-hidden rounded-md border border-border bg-card lg:col-start-2"
          >
            <h2
              id="emerging-risks-heading"
              className="shrink-0 border-b border-border px-3 py-2 g-text-caption font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Emerging risks
            </h2>
            <ul className="min-h-0 flex-1 overflow-y-auto px-3 pb-2 pt-1" role="list">
              {emerging.map((risk) => (
                <li
                  key={risk.id}
                  className="border-b border-border py-2.5 last:border-b-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="g-text-caption font-medium text-foreground">
                        {risk.signalLabel ?? risk.proxyVariables.join(" · ")}
                      </p>
                      <p className="g-text-caption text-muted-foreground">{risk.attackVector}</p>
                    </div>
                    <SeverityBadge severity={risk.severity} className="shrink-0" />
                  </div>
                  <p className="mt-1 g-text-caption line-clamp-2 text-muted-foreground">
                    {risk.description}
                  </p>
                  <p className="mt-1 g-text-caption text-muted-foreground">
                    Signal confidence{" "}
                    <span className="font-mono-data text-foreground">
                      {risk.confidence.toFixed(2)}
                    </span>
                    {" · "}
                    Model score{" "}
                    <span className="font-mono-data text-foreground">
                      {risk.modelScore.toFixed(2)}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </ViewportPage>
  )
}
