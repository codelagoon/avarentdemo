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
  getDisparityTrend,
  getEmergingRisks,
  getMonitoringAlerts,
  getMonitoringDailyStats,
  getMonitoringSignals,
  getSeverityCounts,
  MONITORING_SYNC_CHANNELS,
} from "@/domains/fairness/monitoringDomain"
import { useLiveData } from "@/hooks/useLiveData"
import type { WorkflowId } from "@/lib/navigation"
import { cn } from "@/lib/utils"

export interface MonitoringPageProps {
  onNavigate?: (id: WorkflowId) => void
}

const noopNavigate = () => {}

export function MonitoringPage({ onNavigate = noopNavigate }: MonitoringPageProps) {
  const syncChannels = [...MONITORING_SYNC_CHANNELS]
  const alerts = useLiveData(() => getMonitoringAlerts(), syncChannels)
  const emerging = useLiveData(() => getEmergingRisks(), syncChannels)
  const dailyStats = useLiveData(() => getMonitoringDailyStats(), syncChannels)
  const trendData = useLiveData(() => getDisparityTrend(), syncChannels)
  const signals = useLiveData(() => getMonitoringSignals(), syncChannels)
  const severityCounts = useLiveData(() => getSeverityCounts(), syncChannels)
  const [monitoringTab, setMonitoringTab] = useState<MonitoringPanelTab>("overview")

  const openIncidentCount = useMemo(
    () => alerts.filter((a) => a.severity === "critical" || a.severity === "high").length,
    [alerts]
  )

  return (
    <ViewportPage testId="monitoring-page">
      <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
        <div className="flex shrink-0 items-center gap-2 rounded-md border border-border bg-card shadow-surface px-3 py-2">
          <span
            className="h-2 w-2 animate-pulse rounded-full bg-status-pass motion-reduce:animate-none"
            aria-hidden
          />
          <p className="g-text-caption text-foreground">
            <span className="font-semibold">Monitoring</span>
            <span className="text-muted-foreground">
              {" "}
              · {openIncidentCount || dailyStats.openIncidents} active · {dailyStats.systemHealth} ·{" "}
              {dailyStats.modelVersion}
            </span>
          </p>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)_minmax(0,11rem)]">
          <section
            aria-labelledby="monitoring-alerts-heading"
            className="flex min-h-0 flex-col overflow-hidden rounded-md border border-border bg-card shadow-surface lg:row-span-2"
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

          <section className="flex min-h-0 flex-col overflow-hidden rounded-md border border-border bg-card shadow-surface">
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
                severityCounts={severityCounts}
                trendData={trendData}
                signals={signals}
              />
            </div>
          </section>

          <section
            aria-labelledby="emerging-risks-heading"
            className="flex min-h-0 flex-col overflow-hidden rounded-md border border-border bg-card shadow-surface lg:col-start-2"
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
