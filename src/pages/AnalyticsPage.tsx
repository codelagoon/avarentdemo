import { ChartBar as BarChart3, TrendingUp, Users, CircleAlert as AlertCircle, Info, Database } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
  LineChart, Line, ReferenceLine
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import { FAIRNESS_METRICS, APPROVAL_LIFT_DATA, PROXY_DETECTION_DATA, DATA_VOLUME } from "@/data/mockData"

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
  fairness: { label: "Fairness Score", color: "var(--chart-4)" },
}

const liftConfig = {
  before: { label: "Before Sentinel", color: "var(--chart-3)" },
  after: { label: "After Sentinel", color: "var(--chart-1)" },
}

const proxyConfig = {
  blocked: { label: "Blocked", color: "var(--chart-5)" },
  flagged: { label: "Flagged", color: "var(--chart-4)" },
  cleared: { label: "Cleared", color: "var(--chart-1)" },
}

function MetricGauge({ value, label, threshold = 0.8 }: { value: number; label: string; threshold?: number }) {
  const pct = value * 100
  const pass = value >= threshold
  return (
    <div className="text-center">
      <div className="relative mx-auto mb-1 flex h-16 w-16 items-center justify-center">
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
        <span className={cn("absolute text-[0.7rem] font-bold", pass ? "text-primary" : "text-destructive")}>
          {pct.toFixed(0)}%
        </span>
      </div>
      <p className="text-[0.65rem] font-medium text-foreground">{label}</p>
      <span className={cn("text-[0.6rem] font-semibold", pass ? "text-emerald-600" : "text-destructive")}>
        {pass ? "PASS" : "FAIL"}
      </span>
    </div>
  )
}

export function AnalyticsPage() {
  const overallDI = FAIRNESS_METRICS.reduce((min, m) => Math.min(min, m.disparateImpact), 1)
  const avgApproval = FAIRNESS_METRICS.reduce((s, m) => s + m.approvalRate, 0) / FAIRNESS_METRICS.length

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-card px-6 py-4">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <BarChart3 className="h-5 w-5 text-primary" />
            Analytics & Fairness
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            HMDA / ECOA fairness metrics — April 2026 · First National Bank
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary/30 text-xs" style={{ color: "var(--primary)" }}>
            CFPB 4/5ths Rule
          </Badge>
          <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-xs text-emerald-700">
            DI Ratio: {overallDI.toFixed(2)}
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {/* Gauge row */}
        <div className="mb-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
                Regulatory Compliance Gauges
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    CFPB 4/5ths rule requires disparate impact ratio ≥ 0.80. All metrics computed post-Sentinel intervention.
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-around">
                <MetricGauge value={0.923} label="Avg Fairness Score" threshold={0.8} />
                <MetricGauge value={overallDI} label="Min Disparate Impact" threshold={0.8} />
                <MetricGauge value={avgApproval} label="Avg Approval Rate" threshold={0.6} />
                <MetricGauge value={0.986} label="Chain Integrity" threshold={0.99} />
                <MetricGauge value={0.97} label="Proxy Detection" threshold={0.9} />
                <MetricGauge value={0.94} label="Model Stability" threshold={0.85} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Approval Lift Chart */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Approval Rate Lift (Before vs. After Sentinel)</CardTitle>
              <p className="text-[0.65rem] text-muted-foreground">Protected groups — last 7 months</p>
            </CardHeader>
            <CardContent>
              <ChartContainer config={liftConfig} className="h-[200px] w-full">
                <AreaChart data={APPROVAL_LIFT_DATA} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="oklch(0.91 0.008 247)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} />
                  <YAxis tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} domain={[0.55, 0.85]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="before" stroke="var(--color-before)" fill="var(--color-before)" fillOpacity={0.1} strokeWidth={1.5} />
                  <Area type="monotone" dataKey="after" stroke="var(--color-after)" fill="var(--color-after)" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Proxy Detection Weekly */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Weekly Proxy Detection Volume</CardTitle>
              <p className="text-[0.65rem] text-muted-foreground">Applications screened per week</p>
            </CardHeader>
            <CardContent>
              <ChartContainer config={proxyConfig} className="h-[200px] w-full">
                <BarChart data={PROXY_DETECTION_DATA} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="oklch(0.91 0.008 247)" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} />
                  <YAxis tick={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="cleared" fill="var(--color-cleared)" radius={[2, 2, 0, 0]} stackId="a" />
                  <Bar dataKey="flagged" fill="var(--color-flagged)" radius={[0, 0, 0, 0]} stackId="a" />
                  <Bar dataKey="blocked" fill="var(--color-blocked)" radius={[2, 2, 0, 0]} stackId="a" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Data Volume vs Accuracy & Fairness */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
                <Database className="h-4 w-4 text-primary" />
                Data Volume vs Accuracy & Fairness
              </CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-[0.65rem] border-primary/30 text-primary cursor-help">
                    {DATA_VOLUME.featuresPerDecision} optimal
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-[0.65rem]">82 features balances predictive accuracy with fairness and explainability. Below 65 risks under-fitting; above 120 increases proxy variable risk.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-[0.65rem] text-muted-foreground">
              Optimal range: {DATA_VOLUME.featuresRange.min}–{DATA_VOLUME.featuresRange.max} features • Trained on {(DATA_VOLUME.trainingRecords / 1000000).toFixed(1)}M records
            </p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={volumeConfig} className="h-[200px] w-full">
              <LineChart data={DATA_VOLUME_CHART} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="oklch(0.91 0.008 247)" />
                <XAxis dataKey="features" tick={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} tickFormatter={(v) => v === 82 ? "82" : v.toString()} />
                <YAxis tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} domain={[0.6, 1]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ReferenceLine x={82} stroke="var(--primary)" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="accuracy" stroke="var(--color-accuracy)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="fairness" stroke="var(--color-fairness)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Fairness Metrics Table */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
                <Users className="h-4 w-4 text-primary" />
                Disparate Impact by Protected Group
              </CardTitle>
              <Badge variant="outline" className="text-[0.65rem]">HMDA 2026</Badge>
            </div>
            <p className="text-[0.65rem] text-muted-foreground">
              Reference group: White/Non-Hispanic · Threshold: ≥ 0.80 per CFPB guidance
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left text-xs font-semibold text-muted-foreground">Group</th>
                    <th className="pb-2 text-center text-xs font-semibold text-muted-foreground">Sample (n)</th>
                    <th className="pb-2 text-center text-xs font-semibold text-muted-foreground">Approval Rate</th>
                    <th className="pb-2 text-center text-xs font-semibold text-muted-foreground">Avg Score</th>
                    <th className="pb-2 text-center text-xs font-semibold text-muted-foreground">DI Ratio</th>
                    <th className="pb-2 text-center text-xs font-semibold text-muted-foreground">Approval Lift</th>
                    <th className="pb-2 text-center text-xs font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {FAIRNESS_METRICS.map((m, i) => (
                    <tr key={m.group} className={cn("border-b last:border-0", i % 2 === 1 ? "bg-secondary/20" : "")}>
                      <td className="py-2.5 text-xs font-medium text-foreground">{m.group}</td>
                      <td className="py-2.5 text-center font-mono text-xs text-muted-foreground">{m.sampleSize.toLocaleString()}</td>
                      <td className="py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Progress value={m.approvalRate * 100} className="h-1.5 w-16" />
                          <span className="font-mono text-xs font-medium text-foreground">{(m.approvalRate * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-center font-mono text-xs text-foreground">{m.avgScore}</td>
                      <td className="py-2.5 text-center">
                        <span className={cn(
                          "font-mono text-xs font-bold",
                          m.disparateImpact >= 0.8 ? "text-emerald-600" : "text-destructive"
                        )}>
                          {m.disparateImpact.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-2.5 text-center">
                        {m.lift > 0 ? (
                          <span className="flex items-center justify-center gap-0.5 font-mono text-xs font-semibold text-primary">
                            <TrendingUp className="h-3 w-3" />+{(m.lift * 100).toFixed(0)}pp
                          </span>
                        ) : m.lift < 0 ? (
                          <span className="font-mono text-xs text-muted-foreground">{(m.lift * 100).toFixed(0)}pp</span>
                        ) : (
                          <span className="font-mono text-xs text-muted-foreground">baseline</span>
                        )}
                      </td>
                      <td className="py-2.5 text-center">
                        {m.disparateImpact >= 0.8 ? (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[0.6rem] font-bold text-emerald-700">PASS</span>
                        ) : (
                          <span className="flex items-center gap-0.5 justify-center">
                            <AlertCircle className="h-3 w-3 text-destructive" />
                            <span className="rounded-full border border-destructive/20 bg-destructive/10 px-2 py-0.5 text-[0.6rem] font-bold text-destructive">REVIEW</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
