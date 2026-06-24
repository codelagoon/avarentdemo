"use client"

import { useState, type ReactNode } from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts"
import { CircleHelp, TrendingDown, TrendingUp, Minus } from "lucide-react"
import { SeverityBadge } from "@/components/command-center/SeverityBadge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { DisparityTrendPoint, MonitoringSignal } from "@/data/mockData"
import { cn } from "@/lib/utils"

export type MonitoringPanelTab = "overview" | "signals"

export interface MonitoringPanelProps {
  severityCounts: {
    critical: number
    high: number
    medium: number
    low: number
  }
  trendData: DisparityTrendPoint[]
  signals: MonitoringSignal[]
  hideHeader?: boolean
  /** Split severity/trend vs signals into tabbed halves — no scroll needed */
  tabbedView?: boolean
  /** Tighter layout when sharing vertical space with exam readiness */
  dense?: boolean
  activeTab?: MonitoringPanelTab
  onTabChange?: (tab: MonitoringPanelTab) => void
}

const SEVERITY_BOX_STYLES = {
  critical: "border-destructive/30 bg-destructive/5",
  high: "border-orange-500/30 bg-orange-500/10",
  medium: "border-amber-500/30 bg-amber-500/10",
  low: "border-emerald-500/30 bg-emerald-500/10",
} as const

const AIR_REFERENCE_LINES = [
  { value: 0.95, label: "0.95", short: "Comfortable margin", meaning: "Comfortable margin above the four-fifths (0.80) threshold" },
  { value: 0.9, label: "0.90", short: "Early warning", meaning: "Early warning — monitor for drift toward regulatory concern" },
  { value: 0.85, label: "0.85", short: "Elevated risk", meaning: "Elevated risk — approaching the 0.80 disparate-impact threshold" },
] as const

const SEVERITY_THRESHOLDS_HELP =
  "Critical: immediate regulatory exposure. High: breach likely within one reporting cycle. Medium: elevated drift requiring review. Low: within acceptable monitoring range."

const SIGNAL_THRESHOLD_HELP: Record<string, string> = {
  AIR: "Four-fifths rule: values below 0.80 indicate disparate impact under ECOA/Reg B.",
  DIR: "Disparate Impact Ratio: ratio of approval rates; regulatory concern below 0.80.",
  SPD: "Statistical Parity Difference: absolute gap in approval rates; concern above 0.10.",
  "Δ Score": "Score distribution shift between protected classes; investigate sustained upward drift.",
  "Pearson r": "Correlation between proxy variable and protected class; values above 0.30 warrant review.",
}

const TAB_OPTIONS: { id: MonitoringPanelTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "signals", label: "Signals" },
]

function getSignalHelp(technicalTerm: string): string | undefined {
  for (const [key, help] of Object.entries(SIGNAL_THRESHOLD_HELP)) {
    if (technicalTerm.includes(key)) return help
  }
  return undefined
}

function TrendIcon({ trend }: { trend: MonitoringSignal["trend"] }) {
  if (trend === "up") return <TrendingUp className="size-3 text-destructive" />
  if (trend === "down") return <TrendingDown className="size-3 text-emerald-400" />
  return <Minus className="size-3 text-muted-foreground" />
}

function ContextHelp({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex size-4 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={label}
        >
          <CircleHelp className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-left">
        {children}
      </TooltipContent>
    </Tooltip>
  )
}

function DisparityTrendSummary({ data }: { data: DisparityTrendPoint[] }) {
  const latest = data[data.length - 1]
  if (!latest) return null

  const products = [
    { key: "mortgage" as const, label: "Mortgage" },
    { key: "auto" as const, label: "Auto" },
    { key: "personal" as const, label: "Personal" },
    { key: "creditCard" as const, label: "Credit Card" },
  ]

  return (
    <table className="sr-only">
      <caption>Disparity trend — Adverse Impact Ratio by product, last 30 days</caption>
      <thead>
        <tr>
          <th scope="col">Day</th>
          {products.map((p) => (
            <th key={p.key} scope="col">
              {p.label} AIR
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((point) => (
          <tr key={point.day}>
            <td>{point.day}</td>
            {products.map((p) => (
              <td key={p.key}>{point[p.key].toFixed(2)}</td>
            ))}
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td>Latest ({latest.day})</td>
          {products.map((p) => (
            <td key={p.key}>{latest[p.key].toFixed(2)}</td>
          ))}
        </tr>
      </tfoot>
    </table>
  )
}

interface MonitoringPanelTabSwitcherProps {
  activeTab: MonitoringPanelTab
  onTabChange: (tab: MonitoringPanelTab) => void
  compact?: boolean
}

export function MonitoringPanelTabSwitcher({
  activeTab,
  onTabChange,
  compact = false,
}: MonitoringPanelTabSwitcherProps) {
  return (
    <div
      className={cn(
        "inline-flex shrink-0 gap-px rounded border border-border bg-muted/30 p-px",
        compact ? "h-5" : "h-7"
      )}
      role="tablist"
      aria-label="Monitoring center views"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {TAB_OPTIONS.map((tab) => {
        const selected = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "rounded-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              compact
                ? "px-1.5 text-[0.625rem] leading-none"
                : "px-2 py-1 g-text-caption",
              selected
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

interface SeverityBreakdownProps {
  severityCounts: MonitoringPanelProps["severityCounts"]
  dense?: boolean
}

function SeverityBreakdown({ severityCounts, dense }: SeverityBreakdownProps) {
  return (
    <div className={dense ? "shrink-0" : undefined}>
      <div className={cn("mb-1.5 flex items-center gap-1.5", dense && "mb-1")}>
        <p className="g-text-caption font-medium text-muted-foreground">Severity Breakdown</p>
        <ContextHelp label="Severity threshold definitions">
          <p className="g-text-caption">{SEVERITY_THRESHOLDS_HELP}</p>
        </ContextHelp>
      </div>
      <div className={cn("grid grid-cols-4 gap-1.5", dense && "gap-1")}>
        {(Object.entries(severityCounts) as [keyof typeof severityCounts, number][]).map(
          ([severity, count]) => (
            <div
              key={severity}
              className={cn(
                "rounded-md border text-center",
                dense ? "px-1.5 py-1" : "px-2 py-1.5",
                SEVERITY_BOX_STYLES[severity]
              )}
            >
              <p
                className={cn(
                  "font-mono-data font-semibold text-foreground",
                  dense ? "g-text-caption" : "g-text-header-2"
                )}
              >
                {count}
              </p>
              <p className="g-text-caption capitalize text-muted-foreground">{severity}</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}

interface DisparityTrendSectionProps {
  trendData: DisparityTrendPoint[]
  compact?: boolean
  dense?: boolean
}

function DisparityTrendSection({ trendData, compact, dense }: DisparityTrendSectionProps) {
  return (
    <div className={cn("flex min-h-0 flex-col", compact && !dense && "flex-1", dense && "shrink-0")}>
      <div className={cn("mb-1.5 flex shrink-0 items-center gap-1.5", dense && "mb-1")}>
        <p className="g-text-caption font-medium text-muted-foreground">
          Disparity Trend (30 Days)
        </p>
        <ContextHelp label="AIR reference line definitions">
          <p className="mb-1.5 g-text-caption font-medium">
            Adverse Impact Ratio (AIR) reference lines
          </p>
          <ul className="space-y-1 g-text-caption">
            {AIR_REFERENCE_LINES.map((line) => (
              <li key={line.value}>
                <span className="font-mono-data font-semibold">{line.label}</span>
                {" — "}
                {line.meaning}
              </li>
            ))}
          </ul>
          <p className="mt-1.5 g-text-caption text-muted-foreground">
            Regulatory four-fifths threshold: 0.80
          </p>
        </ContextHelp>
      </div>
      <div
        className={cn(
          "w-full shrink-0",
          dense ? "h-24" : compact ? "min-h-0 flex-1" : "h-36"
        )}
        role="img"
        aria-label="Line chart showing Adverse Impact Ratio trends for mortgage, auto, personal, and credit card products over 30 days"
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={dense ? 96 : 112}>
          <LineChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              interval={6}
            />
            <YAxis
              domain={[0.85, 1.05]}
              tick={{ fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => v.toFixed(2)}
            />
            {AIR_REFERENCE_LINES.map((line) => (
              <ReferenceLine
                key={line.value}
                y={line.value}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 4"
              />
            ))}
            <Line
              type="monotone"
              dataKey="mortgage"
              stroke="var(--primary)"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="auto"
              stroke="#f97316"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="personal"
              stroke="#eab308"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="creditCard"
              stroke="#14b8a6"
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <DisparityTrendSummary data={trendData} />
      <div
        className={cn(
          "mt-1.5 flex shrink-0 flex-wrap gap-x-3 gap-y-1 g-text-caption text-muted-foreground",
          dense && "mt-1 gap-x-2 text-[0.625rem]"
        )}
      >
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-primary" /> Mortgage
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-orange-500" /> Auto
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-yellow-500" /> Personal
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-teal-500" /> Card
        </span>
      </div>
      {!dense ? (
        <div className="mt-1.5 flex shrink-0 flex-wrap gap-x-3 gap-y-1 border-t border-border/50 pt-1.5 g-text-caption text-muted-foreground">
          {AIR_REFERENCE_LINES.map((line) => (
            <span key={line.value} className="flex items-center gap-1">
              <span className="w-3 border-t border-dashed border-muted-foreground" />
              <span className="font-mono-data">{line.label}</span>
              <span className="hidden sm:inline">— {line.short}</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

interface SignalsSectionProps {
  signals: MonitoringSignal[]
}

function SignalsSection({ signals }: SignalsSectionProps) {
  return (
    <div className="flex min-h-0 flex-col">
      <p className="mb-1.5 shrink-0 g-text-caption font-medium text-muted-foreground">
        Top Monitoring Signals
      </p>
      <div className="space-y-2">
        {signals.map((signal) => {
          const thresholdHelp = getSignalHelp(signal.technicalTerm)
          return (
            <div
              key={signal.id}
              className="flex items-start justify-between gap-2 rounded-md border border-border px-2 py-1.5"
            >
              <div className="min-w-0">
                <p className="truncate g-text-caption font-medium text-foreground">
                  {signal.metricName}
                </p>
                <div className="flex items-center gap-1">
                  <p className="g-text-caption text-muted-foreground">{signal.technicalTerm}</p>
                  {thresholdHelp && (
                    <ContextHelp label={`Threshold context for ${signal.technicalTerm}`}>
                      <p className="g-text-caption">{thresholdHelp}</p>
                    </ContextHelp>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="flex items-center gap-0.5 font-mono-data g-text-caption font-medium text-foreground">
                  <TrendIcon trend={signal.trend} />
                  {signal.value.toFixed(2)}
                </span>
                <SeverityBadge severity={signal.severity} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TabbedMonitoringPanel({
  severityCounts,
  trendData,
  signals,
  activeTab: controlledTab,
  onTabChange,
  dense = false,
}: Omit<MonitoringPanelProps, "hideHeader" | "tabbedView">) {
  const [internalTab, setInternalTab] = useState<MonitoringPanelTab>("overview")
  const activeTab = controlledTab ?? internalTab

  return (
    <div className={cn("flex h-full min-h-0 flex-col", dense ? "p-2" : "p-3")}>
      {activeTab === "overview" ? (
        <div
          className={cn(
            "flex min-h-0 flex-col overflow-y-auto overscroll-y-contain",
            dense ? "gap-2" : "flex-1 gap-3"
          )}
          role="tabpanel"
          aria-label="Monitoring overview"
        >
          <SeverityBreakdown severityCounts={severityCounts} dense={dense} />
          <DisparityTrendSection trendData={trendData} compact dense={dense} />
        </div>
      ) : (
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain"
          role="tabpanel"
          aria-label="Monitoring signals"
        >
          <SignalsSection signals={signals} />
        </div>
      )}
    </div>
  )
}

export function MonitoringPanel({
  severityCounts,
  trendData,
  signals,
  hideHeader,
  tabbedView = false,
  dense = false,
  activeTab,
  onTabChange,
}: MonitoringPanelProps) {
  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex min-h-0 flex-col overflow-hidden",
          tabbedView && "h-full",
          !hideHeader && "rounded-md border border-border bg-card"
        )}
      >
        {!hideHeader && (
          <p className="shrink-0 border-b border-border px-3 py-2 g-text-caption font-semibold uppercase tracking-wide text-muted-foreground">
            Monitoring Center
          </p>
        )}

        {tabbedView ? (
          <TabbedMonitoringPanel
            severityCounts={severityCounts}
            trendData={trendData}
            signals={signals}
            dense={dense}
            activeTab={activeTab}
            onTabChange={onTabChange}
          />
        ) : (
          <div className="flex flex-col gap-3 p-3">
            <SeverityBreakdown severityCounts={severityCounts} />
            <DisparityTrendSection trendData={trendData} />
            <SignalsSection signals={signals} />
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
