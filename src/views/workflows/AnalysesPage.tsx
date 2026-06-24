"use client"

import { useEffect, useMemo, useState } from "react"
import { Database, Play, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ViewportPage } from "@/components/shell/ViewportPage"
import { FAIRNESS_METRICS, DATA_VOLUME } from "@/data/mockData"
import type { WorkflowId } from "@/lib/navigation"
import { cn } from "@/lib/utils"

const DATA_SOURCES = [
  { id: "credit-bureau", name: "Credit bureau feed", status: "ready" as const },
  { id: "internal-ledger", name: "Internal decision ledger", status: "ready" as const },
  { id: "alt-data", name: "Alternative data hub", status: "ready" as const },
]

const AIR_THRESHOLD = 0.8
const SPD_THRESHOLD = 0.1

export interface AnalysesPageProps {
  onNavigate?: (id: WorkflowId) => void
}

interface ThresholdStatus {
  passing: boolean
  label: string
}

function getAirStatus(air: number): ThresholdStatus {
  const passing = air >= AIR_THRESHOLD
  return {
    passing,
    label: passing ? "meets 0.80 threshold" : "below 0.80 threshold",
  }
}

function getSpdStatus(spd: number): ThresholdStatus {
  const passing = spd <= SPD_THRESHOLD
  return {
    passing,
    label: passing ? "within 0.10 threshold" : "above 0.10 threshold",
  }
}

function ThresholdChip({ status }: { status: ThresholdStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded px-1.5 py-0 text-[0.65rem] font-medium",
        status.passing
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : "border-destructive/30 bg-destructive/10 text-destructive"
      )}
    >
      {status.label}
    </Badge>
  )
}

function SourceStatusBadge({ status }: { status: "ready" | "pending" }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded px-1.5 py-0 text-[0.65rem] font-medium capitalize",
        status === "ready"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : "border-amber-500/30 bg-amber-500/10 text-amber-400"
      )}
    >
      {status}
    </Badge>
  )
}

const noopNavigate = () => {}

export function AnalysesPage({ onNavigate = noopNavigate }: AnalysesPageProps) {
  const [running, setRunning] = useState(false)
  const [complete, setComplete] = useState(false)
  const [progress, setProgress] = useState(0)

  const readyCount = DATA_SOURCES.filter((s) => s.status === "ready").length
  const hasPendingSource = DATA_SOURCES.some((source) => source.status === "pending")
  const pendingSources = DATA_SOURCES.filter((source) => source.status === "pending")

  const baselineApprovalRate = useMemo(
    () =>
      FAIRNESS_METRICS.find((metric) => metric.disparateImpact === 1)?.approvalRate ??
      FAIRNESS_METRICS[0].approvalRate,
    []
  )

  useEffect(() => {
    if (!running) return

    setProgress(12)
    const interval = window.setInterval(() => {
      setProgress((current) => (current >= 92 ? current : current + 18))
    }, 250)

    const timeout = window.setTimeout(() => {
      setProgress(100)
      setRunning(false)
      setComplete(true)
    }, 1500)

    return () => {
      window.clearInterval(interval)
      window.clearTimeout(timeout)
    }
  }, [running])

  const handleRun = () => {
    if (hasPendingSource) return
    setComplete(false)
    setProgress(0)
    setRunning(true)
  }

  return (
    <ViewportPage testId="analyses-page">
      <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
        {/* Posture strip — sources, scope, protected classes */}
        <div className="grid shrink-0 grid-cols-3 gap-3">
          <div className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2">
            <Database className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0">
              <p className="g-text-caption text-muted-foreground">Data sources ready</p>
              <p className="font-mono-data g-text-caption font-semibold text-foreground">
                {readyCount}/{DATA_SOURCES.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2">
            <Shield className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0">
              <p className="g-text-caption text-muted-foreground">Observations in scope</p>
              <p className="font-mono-data g-text-caption font-semibold text-foreground">
                {DATA_VOLUME.causalDiscoveryObservations.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2">
            <Shield className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0">
              <p className="g-text-caption text-muted-foreground">Protected classes</p>
              <p className="font-mono-data g-text-caption font-semibold text-foreground">
                {FAIRNESS_METRICS.length}
              </p>
            </div>
          </div>
        </div>

        {/* Pipeline: controls left, findings right */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[280px_1fr]">
          {/* Control rail */}
          <aside className="flex min-h-0 flex-col overflow-hidden rounded-md border border-border bg-card">
            <p className="shrink-0 border-b border-border px-3 py-2 g-text-caption font-semibold uppercase tracking-wide text-muted-foreground">
              Analysis pipeline
            </p>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <p className="border-b border-border px-3 py-2 g-text-caption font-medium text-muted-foreground">
                Data sources
              </p>
              {DATA_SOURCES.map((source, index) => (
                <div
                  key={source.id}
                  className={cn(
                    "flex items-center justify-between gap-2 px-3 py-2",
                    index < DATA_SOURCES.length - 1 && "border-b border-border"
                  )}
                >
                  <span className="g-text-caption text-foreground">{source.name}</span>
                  <SourceStatusBadge status={source.status} />
                </div>
              ))}
            </div>

            <div className="shrink-0 space-y-2 border-t border-border p-3">
              {running ? (
                <div className="space-y-1.5">
                  <p
                    id="analysis-progress-label"
                    className="g-text-caption font-medium text-foreground"
                  >
                    Analysis progress
                  </p>
                  <Progress
                    value={progress}
                    aria-labelledby="analysis-progress-label"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              ) : null}

              <Button
                variant="default"
                size="default"
                className="w-full"
                disabled={running || hasPendingSource}
                loading={running}
                onClick={handleRun}
                data-testid="run-audit-button"
              >
                <Play className="size-3.5" aria-hidden />
                {complete ? "Re-run fairness analysis" : "Run fairness analysis"}
              </Button>

              {hasPendingSource ? (
                <p className="g-text-caption text-destructive" role="status">
                  {pendingSources.map((source) => source.name).join(", ")}{" "}
                  {pendingSources.length === 1 ? "sync" : "syncs"} in progress.
                </p>
              ) : null}
            </div>
          </aside>

          {/* Findings panel */}
          <section
            className="flex min-h-0 flex-col overflow-hidden rounded-md border border-border bg-card"
            aria-live={complete ? "polite" : undefined}
            aria-atomic={complete ? "true" : undefined}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
              <p className="g-text-caption font-semibold uppercase tracking-wide text-muted-foreground">
                Generated findings
              </p>
              {complete && !running ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Export
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onNavigate("investigations")}>
                    Investigate
                  </Button>
                </div>
              ) : null}
            </div>

            {complete && !running ? (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border g-text-caption text-muted-foreground">
                      <th scope="col" className="px-3 py-2 text-left font-medium">
                        Protected class
                      </th>
                      <th scope="col" className="px-3 py-2 text-right font-medium">
                        Sample size
                      </th>
                      <th scope="col" className="px-3 py-2 text-right font-medium">
                        Adverse Impact Ratio (AIR)
                      </th>
                      <th scope="col" className="px-3 py-2 text-right font-medium">
                        Statistical Parity Difference (SPD)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {FAIRNESS_METRICS.map((metric) => {
                      const airStatus = getAirStatus(metric.disparateImpact)
                      const spd = Math.abs(metric.approvalRate - baselineApprovalRate)
                      const spdStatus = getSpdStatus(spd)

                      return (
                        <tr
                          key={metric.group}
                          className="border-b border-border last:border-b-0"
                        >
                          <td className="px-3 py-2">
                            <p className="g-text-caption font-medium text-foreground">
                              {metric.group}
                            </p>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span className="font-mono-data g-text-caption text-foreground">
                              {metric.sampleSize.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex flex-col items-end gap-1">
                              <span
                                className={cn(
                                  "font-mono-data g-text-caption font-semibold",
                                  airStatus.passing ? "text-foreground" : "text-destructive"
                                )}
                              >
                                {metric.disparateImpact.toFixed(2)}
                              </span>
                              <ThresholdChip status={airStatus} />
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex flex-col items-end gap-1">
                              <span
                                className={cn(
                                  "font-mono-data g-text-caption font-semibold",
                                  spdStatus.passing ? "text-foreground" : "text-destructive"
                                )}
                              >
                                {spd.toFixed(2)}
                              </span>
                              <ThresholdChip status={spdStatus} />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : running ? (
              <div className="flex flex-1 items-center justify-center p-6">
                <p className="g-text-caption text-muted-foreground">
                  Running statistical analysis across protected classes…
                </p>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center p-6">
                <p className="g-text-caption text-muted-foreground">
                  Run analysis to generate findings
                </p>
              </div>
            )}

            {complete && !running ? (
              <footer className="flex shrink-0 gap-2 border-t border-border px-3 py-2">
                <Button variant="outline" size="sm" onClick={() => onNavigate("monitoring")}>
                  View monitoring
                </Button>
              </footer>
            ) : null}
          </section>
        </div>
      </div>
    </ViewportPage>
  )
}
