import { useState } from "react"
import { ChartBar as BarChart3, TrendingUp, Users, CircleAlert as AlertCircle, Info, Database } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
  LineChart, Line, ReferenceLine, ResponsiveContainer
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { cn } from "@/lib/utils"
const FAIRNESS_METRICS: any[] = []
const APPROVAL_LIFT_DATA: any[] = []
const PROXY_DETECTION_DATA: any[] = []
const DATA_VOLUME: any = { featuresPerDecision: 12, featuresRange: { min: 8, max: 16 }, trainingRecords: 2500000 }

// Data Volume vs Accuracy & Fairness chart data
const DATA_VOLUME_CHART = [
  { features: 40, accuracy: 0.72, fairness: 0.68, label: "Under-fit" },
  { features: 50, accuracy: 0.78, fairness: 0.74, label: "Low" },
  { features: 60, accuracy: 0.84, fairness: 0.82, label: "65 min" },
  { features: 70, accuracy: 0.89, fairness: 0.88, label: "" },
  { features: 82, accuracy: 0.94, fairness: 0.93, label: "Optimal" },
  { features: 90, accuracy: 0.93, fairness: 0.91, label: "" },
  { features: 100, accuracy: 0.91, fairness: 0.87, label: "High" },
  { features: 110, accuracy: 0.88, fairness: 0.83, label: "" },
  { features: 120, accuracy: 0.85, fairness: 0.79, label: "120 max" },
  { features: 130, accuracy: 0.81, fairness: 0.74, label: "Over-fit" },
]

const volumeConfig = {
  accuracy: { label: "Accuracy", color: "var(--chart-1)" },
  fairness: { label: "AIR (Adverse Impact Ratio)", color: "var(--chart-4)" },
}

const liftConfig = {
  before: { label: "Before Meridian", color: "var(--chart-3)" },
  after: { label: "After Meridian", color: "var(--chart-1)" },
}

const proxyConfig = {
  blocked: { label: "Blocked", color: "var(--chart-5)" },
  flagged: { label: "Flagged", color: "var(--chart-4)" },
  cleared: { label: "Cleared", color: "var(--chart-1)" },
}

function MetricGauge({ value, label, threshold = 0.8, isDecimal = false, reverse = false }: { value: number; label: string; threshold?: number; isDecimal?: boolean; reverse?: boolean }) {
  const pct = isDecimal ? (reverse ? (1 - value) * 100 : value * 100) : value * 100
  const pass = reverse ? value <= threshold : value >= threshold
  return (
    <div className="text-center">
      <div className="relative mx-auto mb-1 flex h-14 w-14 items-center justify-center">
        <svg viewBox="0 0 60 60" className="h-full w-full -rotate-90">
          <circle cx="30" cy="30" r="24" fill="none" stroke="oklch(0.91 0.008 247)" strokeWidth="6" />
          <circle
            cx="30" cy="30" r="24"
            fill="none"
            stroke={pass ? "oklch(0.42 0.09 195)" : "oklch(0.577 0.245 27.325)"}
            strokeWidth="6"
            strokeDasharray={`${pct * 1.508} 150.8`}
            strokeLinecap="round"
          />
        </svg>
        <span className={cn("absolute text-[0.65rem] font-bold", pass ? "text-primary" : "text-destructive")}>
          {isDecimal ? value.toFixed(2) : `${pct.toFixed(0)}%`}
        </span>
      </div>
      <p className="text-[0.6rem] font-semibold text-foreground leading-tight">{label}</p>
      <span className={cn("text-[0.55rem] font-bold", pass ? "text-emerald-600" : "text-destructive")}>
        {pass ? "PASS" : "FAIL"}
      </span>
    </div>
  )
}

export function AnalyticsPage() {
  const [subTab, setSubTab] = useState<"overview" | "lift" | "volume">("overview")
  const overallDI = FAIRNESS_METRICS.reduce((min, m) => Math.min(min, m.disparateImpact), 1)
  const avgApproval = FAIRNESS_METRICS.reduce((s, m) => s + m.approvalRate, 0) / FAIRNESS_METRICS.length

  return (
    <div className="flex h-full flex-col overflow-hidden" data-testid="analytics-page">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 bg-card px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <BarChart3 className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Analytics & Fairness</h1>
            <p className="text-[0.7rem] text-muted-foreground">HMDA / ECOA metrics — April 2026 · First National Bank</p>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-4">
          <div className="flex rounded-lg border border-border/60 bg-muted/60 p-0.5">
            <button
              onClick={() => setSubTab("overview")}
              className={cn("rounded-md px-3 py-1 text-xs font-semibold transition-all", subTab === "overview" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              Compliance Overview
            </button>
            <button
              onClick={() => setSubTab("lift")}
              className={cn("rounded-md px-3 py-1 text-xs font-semibold transition-all", subTab === "lift" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              Performance Lift
            </button>
            <button
              onClick={() => setSubTab("volume")}
              className={cn("rounded-md px-3 py-1 text-xs font-semibold transition-all", subTab === "volume" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              Data Volume Analysis
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 border-primary/30 text-[0.7rem] text-primary">
              CFPB 4/5ths Rule
            </Badge>
            <Badge className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-[0.7rem] text-emerald-600 dark:text-emerald-400">
              DI Ratio: {overallDI.toFixed(2)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main viewport-locked area */}
      <div className="flex-1 min-h-0 p-5 overflow-hidden flex flex-col bg-background">
        <TooltipProvider>
          {subTab === "overview" && (
            <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
              {/* Gauges card */}
              <Card className="border-border/60 shadow-sm shrink-0">
                <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-foreground uppercase tracking-wide">Regulatory Compliance Gauges</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground/60" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        CFPB 4/5ths rule requires disparate impact ratio ≥ 0.80. All metrics post-Meridian intervention.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[0.65rem] font-semibold text-emerald-600 dark:text-emerald-400">6/6 Passing</span>
                </div>
                <div className="flex items-center justify-around px-4 py-4">
                  <MetricGauge value={0.923} label="AIR" threshold={0.8} isDecimal={true} />
                  <div className="h-10 w-px bg-border/60" />
                  <MetricGauge value={0.077} label="SPD" threshold={0.1} isDecimal={true} reverse={true} />
                  <div className="h-10 w-px bg-border/60" />
                  <MetricGauge value={avgApproval} label="Avg Approval Rate" threshold={0.6} />
                  <div className="h-10 w-px bg-border/60" />
                  <MetricGauge value={0.986} label="Ledger Continuity" threshold={0.99} />
                  <div className="h-10 w-px bg-border/60" />
                  <MetricGauge value={0.97} label="Proxy Detection" threshold={0.9} />
                  <div className="h-10 w-px bg-border/60" />
                  <MetricGauge value={0.94} label="Model Stability" threshold={0.85} />
                </div>
              </Card>

              {/* Fairness Table */}
              <Card className="flex-1 min-h-0 flex flex-col border-border/60 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-border/40 px-5 py-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    <p className="text-xs font-bold text-foreground uppercase tracking-wide">Disparate Impact by Protected Group</p>
                  </div>
                  <Badge variant="outline" className="text-[0.65rem]">HMDA 2026</Badge>
                </div>
                <div className="px-5 py-2 bg-muted/20 border-b border-border/20 shrink-0">
                  <p className="text-[0.68rem] text-muted-foreground">Reference group: White/Non-Hispanic · Threshold: ≥ 0.80 per CFPB guidance</p>
                </div>
                <div className="flex-1 overflow-y-auto px-5 pb-4 min-h-0 max-h-[calc(100vh-350px)]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-card z-10">
                      <tr className="border-b border-border/60">
                        <th className="pb-2 pt-3 text-left text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">Group</th>
                        <th className="pb-2 pt-3 text-center text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">Sample (n)</th>
                        <th className="pb-2 pt-3 text-center text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">Approval Rate</th>
                        <th className="pb-2 pt-3 text-center text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">Avg Score</th>
                        <th className="pb-2 pt-3 text-center text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">DI Ratio</th>
                        <th className="pb-2 pt-3 text-center text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">Lift</th>
                        <th className="pb-2 pt-3 text-center text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {FAIRNESS_METRICS.map((m) => (
                        <tr key={m.group} className="group transition-colors hover:bg-muted/30">
                          <td className="py-2.5 text-[0.78rem] font-medium text-foreground">{m.group}</td>
                          <td className="py-2.5 text-center font-mono text-[0.72rem] text-muted-foreground">{m.sampleSize.toLocaleString()}</td>
                          <td className="py-2.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Progress value={m.approvalRate * 100} className="h-1.5 w-14" />
                              <span className="font-mono text-[0.72rem] font-semibold tabular-nums text-foreground">{(m.approvalRate * 100).toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="py-2.5 text-center font-mono text-[0.72rem] tabular-nums text-foreground">{m.avgScore}</td>
                          <td className="py-2.5 text-center">
                            <span className={cn(
                              "font-mono text-[0.78rem] font-bold tabular-nums",
                              m.disparateImpact >= 0.8 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                            )}>
                              {m.disparateImpact.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-2.5 text-center">
                            {m.lift > 0 ? (
                              <span className="inline-flex items-center gap-0.5 font-mono text-[0.72rem] font-semibold text-primary">
                                <TrendingUp className="h-3 w-3" />+{(m.lift * 100).toFixed(0)}pp
                              </span>
                            ) : m.lift < 0 ? (
                              <span className="font-mono text-[0.72rem] text-muted-foreground">{(m.lift * 100).toFixed(0)}pp</span>
                            ) : (
                              <span className="font-mono text-[0.65rem] text-muted-foreground/60">baseline</span>
                            )}
                          </td>
                          <td className="py-2.5 text-center">
                            {m.disparateImpact >= 0.8 ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[0.62rem] font-bold text-emerald-600 dark:text-emerald-400">PASS</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[0.62rem] font-bold text-destructive">
                                <AlertCircle className="h-2.5 w-2.5" />REVIEW
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {subTab === "lift" && (
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-5 overflow-hidden">
              {/* Approval Lift Chart */}
              <Card className="flex flex-col h-full min-h-0 border-border/60 shadow-sm overflow-hidden">
                <div className="border-b border-border/40 px-5 py-3 shrink-0">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wide">Approval Rate Lift</p>
                  <p className="text-[0.65rem] text-muted-foreground">Before vs. After Meridian — protected groups, last 7 months</p>
                </div>
                <div className="h-[250px] p-4">
                  <ChartContainer config={liftConfig} className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={APPROVAL_LIFT_DATA} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                        <CartesianGrid vertical={false} className="stroke-border/40" />
                        <XAxis dataKey="month" tick={{ fontSize: 9, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 9, fontFamily: "IBM Plex Mono" }} domain={[0.55, 0.85]} axisLine={false} tickLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="before" stroke="var(--color-before)" fill="var(--color-before)" fillOpacity={0.08} strokeWidth={1.5} />
                        <Area type="monotone" dataKey="after" stroke="var(--color-after)" fill="var(--color-after)" fillOpacity={0.12} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </Card>

              {/* Proxy Detection Weekly */}
              <Card className="flex flex-col h-full min-h-0 border-border/60 shadow-sm overflow-hidden">
                <div className="border-b border-border/40 px-5 py-3 shrink-0">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wide">Weekly Proxy Detection Volume</p>
                  <p className="text-[0.65rem] text-muted-foreground">Applications screened per week</p>
                </div>
                <div className="h-[250px] p-4">
                  <ChartContainer config={proxyConfig} className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={PROXY_DETECTION_DATA} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                        <CartesianGrid vertical={false} className="stroke-border/40" />
                        <XAxis dataKey="week" tick={{ fontSize: 9, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="cleared" fill="var(--color-cleared)" radius={[0, 0, 0, 0]} stackId="a" />
                        <Bar dataKey="flagged" fill="var(--color-flagged)" radius={[0, 0, 0, 0]} stackId="a" />
                        <Bar dataKey="blocked" fill="var(--color-blocked)" radius={[3, 3, 0, 0]} stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </Card>
            </div>
          )}

          {subTab === "volume" && (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {/* Data Volume chart */}
              <Card className="flex-1 min-h-0 flex flex-col border-border/60 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-border/40 px-5 py-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <Database className="h-3.5 w-3.5 text-primary" />
                    <p className="text-xs font-bold text-foreground uppercase tracking-wide">Data Volume vs Accuracy & Fairness</p>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-[0.65rem] font-semibold text-primary">
                        {DATA_VOLUME.featuresPerDecision} optimal
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      82 features balances predictive accuracy with fairness. Below 65 risks under-fitting; above 120 increases proxy variable risk.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="px-5 py-2.5 bg-muted/20 border-b border-border/20 shrink-0">
                  <p className="text-[0.68rem] text-muted-foreground">
                    Optimal range: {DATA_VOLUME.featuresRange.min}–{DATA_VOLUME.featuresRange.max} features · Trained on {(DATA_VOLUME.trainingRecords / 1000000).toFixed(1)}M records
                  </p>
                </div>
                <div className="h-[250px] p-5">
                  <ChartContainer config={volumeConfig} className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={DATA_VOLUME_CHART} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                        <CartesianGrid vertical={false} className="stroke-border/40" />
                        <XAxis dataKey="features" tick={{ fontSize: 9, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 9, fontFamily: "IBM Plex Mono" }} domain={[0.6, 1]} axisLine={false} tickLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ReferenceLine x={82} stroke="var(--primary)" strokeDasharray="3 3" strokeOpacity={0.6} />
                        <Line type="monotone" dataKey="accuracy" stroke="var(--color-accuracy)" strokeWidth={2.5} dot={false} />
                        <Line type="monotone" dataKey="fairness" stroke="var(--color-fairness)" strokeWidth={2.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </Card>
            </div>
          )}
        </TooltipProvider>
      </div>
    </div>
  )
}
