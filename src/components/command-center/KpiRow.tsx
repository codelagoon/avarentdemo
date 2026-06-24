"use client"

import { Line, LineChart, ResponsiveContainer } from "recharts"
import type {
  CommandCenterKpis,
  FairnessMetricReading,
} from "@/data/mockData"
import { MODEL_SPARKLINE_DATA } from "@/data/mockData"
import { cn } from "@/lib/utils"

export interface KpiRowProps {
  kpis: CommandCenterKpis
}

interface FairnessMetricLineProps {
  metric: FairnessMetricReading
}

interface PostureItemProps {
  label: string
  children: React.ReactNode
  detail?: string
  emphasis?: "default" | "alert"
}

function FairnessMetricLine({ metric }: FairnessMetricLineProps) {
  return (
    <p className="min-w-0 g-text-caption text-foreground">
      <span>{metric.plainLabel}</span>
      <span className="text-muted-foreground"> ({metric.technicalTerm})</span>
      <span className="text-muted-foreground"> — </span>
      <span
        className={cn(
          "font-mono-data font-semibold",
          metric.passing ? "text-foreground" : "text-destructive"
        )}
      >
        {metric.value.toFixed(2)}
      </span>
      <span className="text-muted-foreground"> — </span>
      <span className={cn(metric.passing ? "text-muted-foreground" : "text-destructive")}>
        {metric.thresholdStatus}
      </span>
    </p>
  )
}

function PostureItem({ label, children, detail, emphasis = "default" }: PostureItemProps) {
  return (
    <div className="min-w-0 px-0 lg:px-3 first:lg:pl-0 last:lg:pr-0">
      <p className="g-text-caption font-medium text-muted-foreground">{label}</p>
      <div
        className={cn(
          "mt-0.5",
          emphasis === "alert" ? "text-destructive" : "text-foreground"
        )}
      >
        {children}
      </div>
      {detail && (
        <p className="mt-0.5 g-text-caption text-muted-foreground">{detail}</p>
      )}
    </div>
  )
}

function ModelsSparkline() {
  return (
    <div className="h-6 w-14 shrink-0 min-w-[3.5rem]">
      <ResponsiveContainer width="100%" height="100%" minWidth={56} minHeight={24}>
        <LineChart data={MODEL_SPARKLINE_DATA}>
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--g-color-base-brand)"
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function KpiRow({ kpis }: KpiRowProps) {
  const { activeFindings, investigations, modelsMonitored, topBreachMetric } = kpis

  return (
    <div className="shrink-0 rounded-md border border-border bg-card shadow-surface">
      <div className="flex flex-col gap-2 border-b border-border px-3 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-1">
        <FairnessMetricLine metric={kpis.adverseImpactRatio} />
        <FairnessMetricLine metric={kpis.statisticalParityDifference} />
      </div>

      <div className="px-3 py-2.5">
        <p className="g-text-caption font-semibold uppercase tracking-wide text-muted-foreground">
          What needs attention now
        </p>

        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-0 lg:divide-x lg:divide-border">
          <PostureItem
            label="Critical findings"
            emphasis="alert"
            detail={activeFindings.trend}
          >
            <p className="g-text-header-1 font-semibold">{activeFindings.critical}</p>
          </PostureItem>

          <PostureItem
            label="Top breach metric"
            detail={topBreachMetric.context}
            emphasis="alert"
          >
            <p className="g-text-caption text-foreground">
              <span>{topBreachMetric.plainLabel}</span>
              <span className="text-muted-foreground"> ({topBreachMetric.technicalTerm})</span>
            </p>
            <p className="mt-0.5 g-text-caption">
              <span className="font-mono-data font-semibold text-destructive">
                {topBreachMetric.value.toFixed(2)}
              </span>
              <span className="text-muted-foreground"> — {topBreachMetric.thresholdStatus}</span>
            </p>
          </PostureItem>

          <PostureItem label="Exam readiness" detail={kpis.examTrend}>
            <p className="g-text-header-1 font-semibold">
              {kpis.examReadiness}
              <span className="g-text-caption font-normal text-muted-foreground">%</span>
            </p>
            <p className="g-text-caption text-muted-foreground">{kpis.examLabel}</p>
          </PostureItem>

          <PostureItem label="Investigations" detail={investigations.trend}>
            <p className="g-text-header-1 font-semibold">{investigations.total}</p>
            <p className="g-text-caption text-muted-foreground">
              {investigations.open} open · {investigations.inReview} in review
            </p>
          </PostureItem>

          <PostureItem label="Models monitored" detail={modelsMonitored.trend}>
            <div className="flex items-center justify-between gap-2">
              <p className="g-text-header-1 font-semibold">
                {modelsMonitored.active}
                <span className="g-text-caption font-normal text-muted-foreground">
                  {" "}
                  / {modelsMonitored.total}
                </span>
              </p>
              <ModelsSparkline />
            </div>
          </PostureItem>
        </div>

        <p className="mt-2 g-text-caption text-muted-foreground">{kpis.postureSummary}</p>
      </div>
    </div>
  )
}
