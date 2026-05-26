import { useState, useMemo, useEffect } from "react"
import { ShieldAlert, TrendingUp, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Search, Download, Info, ShieldCheck, Fingerprint, Shield, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts"
import { cn } from "@/lib/utils"
import { type ThreatSeverity, type ThreatEvent } from "@/data/mockData"
import { threatService } from "@/services/threatService"
import { antiFairwashingService } from "@/services/antiFairwashingService"
import type { AntiFairwashingState } from "@/services/antiFairwashingService"

function SeverityBadge({ severity }: { severity: ThreatSeverity }) {
  const map: Record<ThreatSeverity, string> = {
    critical: "bg-destructive/10 text-destructive border-destructive/20",
    high: "bg-orange-50 text-orange-700 border-orange-200",
    medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
    low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  }
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide", map[severity])}>
      {severity}
    </span>
  )
}

function HeatCell({ value, max }: { value: number; max: number }) {
  const pct = (value / max) * 100
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex h-8 w-8 cursor-default items-center justify-center rounded text-[0.6rem] font-bold text-white" style={{ backgroundColor: `oklch(${pct > 70 ? "0.577 0.245 27.325" : pct > 40 ? "0.65 0.2 50" : pct > 20 ? "0.72 0.16 85" : "0.52 0.09 150"})`, opacity: 0.3 + (pct / 100) * 0.7 }}>
          {value}
        </div>
      </TooltipTrigger>
      <TooltipContent>{value} events</TooltipContent>
    </Tooltip>
  )
}

const HEATMAP_DATA = [
  { hour: "06", mon: 1, tue: 0, wed: 2, thu: 1, fri: 0, sat: 0, sun: 0 },
  { hour: "08", mon: 3, tue: 2, wed: 1, thu: 4, fri: 2, sat: 0, sun: 0 },
  { hour: "10", mon: 5, tue: 7, wed: 4, thu: 3, fri: 6, sat: 1, sun: 0 },
  { hour: "12", mon: 8, tue: 6, wed: 9, thu: 7, fri: 5, sat: 2, sun: 1 },
  { hour: "14", mon: 12, tue: 10, wed: 8, thu: 11, fri: 9, sat: 1, sun: 0 },
  { hour: "16", mon: 7, tue: 9, wed: 6, thu: 8, fri: 4, sat: 0, sun: 0 },
  { hour: "18", mon: 3, tue: 4, wed: 2, thu: 3, fri: 6, sat: 0, sun: 0 },
]
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const

// Simulated Cumulative Distribution Data for KS test overlay
const KS_DISTRIBUTION_DATA = [
  { score: 300, majorityCDF: 0, minorityCDF: 0 },
  { score: 400, majorityCDF: 5, minorityCDF: 12 },
  { score: 500, majorityCDF: 15, minorityCDF: 38 },
  { score: 600, majorityCDF: 42, minorityCDF: 72 },
  { score: 700, majorityCDF: 78, minorityCDF: 92 },
  { score: 800, majorityCDF: 95, minorityCDF: 99 },
  { score: 850, majorityCDF: 100, minorityCDF: 100 },
]

export function ThreatAnalysisPage() {
  const [activeTab, setActiveTab] = useState<"feed" | "fairwashing">("feed")
  const [search, setSearch] = useState("")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [threats, setThreats] = useState<ThreatEvent[]>([])
  
  // Anti-fairwashing state
  const [auditState, setAuditState] = useState<AntiFairwashingState>(() => antiFairwashingService.getState())
  const [isAuditing, setIsAuditing] = useState(false)

  // Load threats on mount
  useEffect(() => {
    setThreats(threatService.getAll())
  }, [])

  const filtered = useMemo(() => {
    return threats.filter(t => {
      const matchSearch =
        !search ||
        t.applicantName.toLowerCase().includes(search.toLowerCase()) ||
        t.attackVector.toLowerCase().includes(search.toLowerCase()) ||
        t.applicantId.toLowerCase().includes(search.toLowerCase())
      const matchSev = severityFilter === "all" || t.severity === severityFilter
      const matchStatus = statusFilter === "all" || (statusFilter === "blocked" ? t.blocked : !t.blocked)
      return matchSearch && matchSev && matchStatus
    })
  }, [threats, search, severityFilter, statusFilter])

  const counts = useMemo(() => ({
    critical: threats.filter(t => t.severity === "critical").length,
    high: threats.filter(t => t.severity === "high").length,
    medium: threats.filter(t => t.severity === "medium").length,
    low: threats.filter(t => t.severity === "low").length,
    blocked: threats.filter(t => t.blocked).length,
    total: threats.length,
  }), [threats])

  const maxHeat = Math.max(...HEATMAP_DATA.flatMap(r => DAY_KEYS.map(d => r[d])))

  const handleResolveAlert = (id: string) => {
    const updated = antiFairwashingService.resolveAlert(id)
    setAuditState(updated)
    toast.success("Regulatory alert resolved. Mitigation recorded in blockchain evidence ledger.")
  }

  const handleRunAudit = () => {
    setIsAuditing(true)
    toast.loading("Running Kolomogorov-Smirnov two-sample testing & robustness metrics...")
    
    setTimeout(() => {
      const updated = antiFairwashingService.runAdversarialAudit()
      setAuditState(updated)
      setIsAuditing(false)
      toast.dismiss()
      toast.success("Adversarial regulatory audit completed. KS & KL metrics updated.")
    }, 1500)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-950/20">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-card px-6 py-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <ShieldAlert className="h-5 w-5 text-primary" />
              Threat Analysis & Fairwashing Auditor
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Module 4: Real-time adversarial proxy screening & mathematical fairwashing auditing pipelines.
            </p>
          </div>
        </div>

        {/* Tab Switchers */}
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border bg-slate-100 p-0.5 dark:bg-slate-900">
            <button
              onClick={() => setActiveTab("feed")}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-semibold transition-all",
                activeTab === "feed"
                  ? "bg-white text-slate-900 shadow dark:bg-slate-800 dark:text-slate-100"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              Adversarial Feed
            </button>
            <button
              onClick={() => setActiveTab("fairwashing")}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-semibold transition-all",
                activeTab === "fairwashing"
                  ? "bg-white text-slate-900 shadow dark:bg-slate-800 dark:text-slate-100"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              Anti-Fairwashing Auditor
            </button>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        
        {activeTab === "feed" ? (
          <>
            {/* Stat cards */}
            <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { label: "Critical", value: counts.critical, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", icon: ShieldAlert },
                { label: "High", value: counts.high, color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", icon: AlertCircle },
                { label: "Medium", value: counts.medium, color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200", icon: AlertCircle },
                { label: "Low", value: counts.low, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle },
                { label: "Blocked", value: counts.blocked, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", icon: TrendingUp },
              ].map(s => {
                return (
                  <Card key={s.label} className={cn("border shadow-sm", s.border, s.bg)}>
                    <CardContent className="px-4 py-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.7rem] font-semibold tracking-wider text-muted-foreground truncate">{s.label}</p>
                        <p className={cn("mt-1 text-3xl font-bold tracking-tight tabular-nums", s.color)}>{s.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Threat Feed Table */}
              <div className="lg:col-span-2">
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">Live Threat Feed</CardTitle>
                      <Badge variant="secondary" className="text-[0.65rem]">{filtered.length} events</Badge>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search applicant, vector..."
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          className="h-8 pl-8 text-xs"
                          data-testid="threat-search"
                        />
                      </div>
                      <Select value={severityFilter} onValueChange={setSeverityFilter}>
                        <SelectTrigger className="h-8 w-28 text-xs" data-testid="threat-severity-filter">
                          <SelectValue placeholder="Severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Severity</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-8 w-24 text-xs" data-testid="threat-status-filter">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="blocked">Blocked</SelectItem>
                          <SelectItem value="monitoring">Monitoring</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <Table data-testid="threat-table">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-4 text-xs">Time</TableHead>
                          <TableHead className="text-xs">Applicant</TableHead>
                          <TableHead className="text-xs">Severity</TableHead>
                          <TableHead className="text-xs">Attack Vector</TableHead>
                          <TableHead className="text-xs">Confidence</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map(threat => (
                          <TableRow key={threat.id} data-testid={`threat-row-${threat.id}`}>
                            <TableCell className="pl-4">
                              <span className="font-mono text-[0.65rem] text-muted-foreground">
                                {new Date(threat.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-xs font-medium text-foreground">{threat.applicantName}</p>
                                <p className="font-mono text-[0.6rem] text-muted-foreground">{threat.applicantId}</p>
                              </div>
                            </TableCell>
                            <TableCell><SeverityBadge severity={threat.severity} /></TableCell>
                            <TableCell>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help text-xs text-foreground">{threat.attackVector}</span>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p>{threat.description}</p>
                                    <p className="mt-1 text-xs opacity-70">Proxies: {threat.proxyVariables.join(", ")}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <Progress value={threat.confidence * 100} className="h-1 w-12" />
                                <span className="font-mono text-[0.65rem] font-medium text-foreground">
                                  {(threat.confidence * 100).toFixed(0)}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {threat.blocked ? (
                                <span className="flex items-center gap-1 text-[0.65rem] font-semibold text-primary">
                                  <CheckCircle className="h-3 w-3" /> Blocked
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[0.65rem] font-semibold text-amber-600">
                                  <AlertCircle className="h-3 w-3" /> Monitoring
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              {/* Heatmap */}
              <div>
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
                      Attack Heatmap
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>Threat events by hour and day of week (past 4 weeks)</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </CardTitle>
                    <p className="text-[0.65rem] text-muted-foreground">Events by hour × day</p>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <div className="min-w-[220px]">
                        {/* Day headers */}
                        <div className="mb-1 ml-8 grid grid-cols-7 gap-0.5">
                          {DAYS.map(d => (
                            <div key={d} className="text-center text-[0.6rem] font-medium text-muted-foreground">{d}</div>
                          ))}
                        </div>
                        {/* Rows */}
                        {HEATMAP_DATA.map(row => (
                          <div key={row.hour} className="mb-0.5 flex items-center gap-1">
                            <span className="w-7 text-right font-mono text-[0.6rem] text-muted-foreground">{row.hour}h</span>
                            <div className="grid flex-1 grid-cols-7 gap-0.5">
                              {DAY_KEYS.map(day => (
                                <HeatCell key={day} value={row[day]} max={maxHeat} />
                              ))}
                            </div>
                          </div>
                        ))}
                        {/* Legend */}
                        <div className="mt-3 flex items-center gap-1.5">
                          <span className="text-[0.6rem] text-muted-foreground">Low</span>
                          {[0.1, 0.3, 0.5, 0.7, 0.9].map(p => (
                            <div
                              key={p}
                              className="h-3 w-3 rounded-sm"
                              style={{ backgroundColor: `oklch(0.52 0.09 150 / ${0.3 + p * 0.7})`, opacity: 0.3 + p * 0.7 }}
                            />
                          ))}
                          <span className="text-[0.6rem] text-muted-foreground">High</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 border-t pt-3">
                      <p className="text-[0.65rem] font-semibold tracking-wider text-muted-foreground">
                        Top Attack Vectors
                      </p>
                      {[
                        { label: "Sequential Proxy Correlation Attack", count: 3, pct: 43 },
                        { label: "Single Proxy Variable", count: 2, pct: 29 },
                        { label: "Dual Proxy Interaction", count: 1, pct: 14 },
                        { label: "Indirect Correlation", count: 1, pct: 14 },
                      ].map(v => (
                        <div key={v.label}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[0.65rem] text-foreground">{v.label}</span>
                            <span className="font-mono text-[0.6rem] text-muted-foreground">{v.count}</span>
                          </div>
                          <Progress value={v.pct} className="h-1" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="mt-3 shadow-sm">
                  <CardContent className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-semibold">Model Score Distribution</span>
                    </div>
                    {threats.map(t => (
                      <div key={t.id} className="mb-1.5 flex items-center gap-2">
                        <span className="w-14 truncate text-[0.6rem] text-muted-foreground">{t.applicantName.split(" ")[0]}</span>
                        <Progress value={t.modelScore * 100} className="h-1.5 flex-1" />
                        <span className="font-mono text-[0.6rem] text-foreground w-6 text-right">{(t.modelScore * 100).toFixed(0)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        ) : (
          /* Anti-Fairwashing Panel (Module 4 additions) */
          <div className="space-y-6">
            
            {/* Audit Engine Header */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* KS distribution Overlay */}
              <Card className="lg:col-span-2 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                        <Fingerprint className="h-4 w-4 text-primary" />
                        Kolmogorov-Smirnov Score Distribution Divergence
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Adversarial comparison of cumulative probability distributions (CDFs) across groups.
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700 text-[0.6rem] font-bold font-mono dark:bg-red-950/20">
                      Disparity Detected (D = 0.28)
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={KS_DISTRIBUTION_DATA} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="oklch(0.91 0.008 247)" />
                        <XAxis dataKey="score" tick={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} />
                        <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} />
                        <RechartsTooltip />
                        <Legend wrapperStyle={{ fontSize: "10px" }} />
                        <Area type="monotone" dataKey="majorityCDF" name="White (Majority CDF)" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.08} strokeWidth={2} />
                        <Area type="monotone" dataKey="minorityCDF" name="Black or African American CDF" stroke="oklch(0.577 0.245 27.325)" fill="oklch(0.577 0.245 27.325)" fillOpacity={0.12} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Audit Controls & KL Divergence summary */}
              <Card className="shadow-sm border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-primary" />
                    Adversarial Audit Panel
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Run mathematical validations to identify regulatory fairwashing.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3.5 rounded-lg border bg-slate-50 dark:bg-slate-900/50 space-y-1">
                    <p className="text-[0.625rem] font-bold text-muted-foreground">Drift Alert Status</p>
                    <p className="text-sm font-extrabold text-red-700 dark:text-red-400">FAIRWASHING SUSPECTED</p>
                    <p className="text-[0.65rem] text-slate-500 leading-relaxed">
                      borderline minority profile approvals are highly concentrated around the boundary. Technical group-fairness is inflated.
                    </p>
                  </div>

                  <Button
                    onClick={handleRunAudit}
                    disabled={isAuditing}
                    className="w-full gap-2 text-xs h-9"
                    data-testid="run-audit-button"
                  >
                    <RefreshCw className={cn("h-4 w-4", isAuditing && "animate-spin")} />
                    Run Advanced Adversarial Audit
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Row 2: KS/KL statistics table & Manipulation Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* KS/KL metrics table */}
              <Card className="lg:col-span-2 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span>KS Tests & KL Divergence Disparities</span>
                    <Badge variant="outline" className="text-[0.65rem]">ECOA / HMDA Compliance</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Compares claimed fairness with true latent distributions. Large divergence indicates fairwashing.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="pb-2 text-left text-xs font-semibold text-slate-500">Demographic Group</th>
                          <th className="pb-2 text-center text-xs font-semibold text-slate-500">KS Distance (D)</th>
                          <th className="pb-2 text-center text-xs font-semibold text-slate-500">KS p-value</th>
                          <th className="pb-2 text-center text-xs font-semibold text-slate-500">KL Divergence</th>
                          <th className="pb-2 text-center text-xs font-semibold text-slate-500">Reported/True Fairness</th>
                          <th className="pb-2 text-center text-xs font-semibold text-slate-500">Audit Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditState.klDivergences.map((kl, idx) => {
                          const ks = auditState.ksTests[idx] || { dStatistic: 0.05, pValue: 0.5, status: "pass" }
                          return (
                            <tr key={kl.groupName} className="border-b last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                              <td className="py-3 text-xs font-semibold text-foreground">{kl.groupName}</td>
                              <td className="py-3 text-center font-mono text-xs">{ks.dStatistic.toFixed(2)}</td>
                              <td className="py-3 text-center font-mono text-xs text-slate-500">{ks.pValue.toFixed(3)}</td>
                              <td className="py-3 text-center font-mono text-xs">
                                <span className={cn(
                                  "font-bold",
                                  kl.status === "severe" ? "text-destructive" : kl.status === "drift" ? "text-amber-600" : "text-emerald-600"
                                )}>
                                  {kl.klDivergenceValue.toFixed(2)}
                                </span>
                              </td>
                              <td className="py-3 text-center text-xs">
                                <span className="font-mono text-slate-500">{kl.claimedFairness}%</span>
                                <span className="mx-1 text-slate-300">/</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{kl.actualFairness}%</span>
                              </td>
                              <td className="py-3 text-center">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[0.6rem] font-bold uppercase",
                                    ks.status === "failed"
                                      ? "border-red-300 bg-red-50 text-red-700 dark:bg-red-950/20"
                                      : ks.status === "warning"
                                      ? "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/20"
                                      : "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20"
                                  )}
                                >
                                  {ks.status === "failed" ? "Drift Disparity" : ks.status === "warning" ? "Warning" : "Compliant"}
                                </Badge>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Manipulation Alerts */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Fairwashing Manipulation Alerts
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Identified label flipping patterns indicating compliance manipulation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3.5">
                  {auditState.alerts.filter(a => !a.resolved).map(alert => {
                    return (
                      <div key={alert.id} className="p-3 rounded-lg border border-red-200 bg-red-50/50 space-y-2 text-xs text-slate-900 dark:bg-red-950/20 dark:text-slate-200">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-red-700 dark:text-red-400">{alert.ruleName}</span>
                          <Badge variant="destructive" className="text-[0.55rem] font-bold">CRITICAL</Badge>
                        </div>
                        <p className="text-[0.7rem] text-slate-600 dark:text-slate-300 leading-relaxed">{alert.description}</p>
                        <div className="flex justify-between items-center pt-1 border-t border-red-100">
                          <span className="text-[0.65rem] text-slate-500 font-mono">Flip Rate: {alert.labelFlipRate}%</span>
                          <Button
                            variant="link"
                            size="sm"
                            className="h-5 p-0 text-[0.65rem] font-extrabold text-primary hover:no-underline"
                            onClick={() => handleResolveAlert(alert.id)}
                          >
                            Resolve Alert
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                  {auditState.alerts.filter(a => !a.resolved).length === 0 && (
                    <div className="p-4 rounded-lg border border-dashed text-center text-slate-400 text-xs py-10">
                      No active manipulation alerts. System compliance structures are verified.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Row 3: PGD & FGSM Adversarial Robustness Table */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span>Demographic Adversarial Robustness Disparity (PGD / FGSM)</span>
                  <Badge variant="outline" className="text-[0.65rem] border-primary/20 text-primary">Adversarial Defense Active</Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Validates model stability under adversarial perturbations (FGSM & PGD) by demographic class to identify hidden structural bias.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="pb-2 text-left text-xs font-semibold text-slate-500">Demographic Group</th>
                        <th className="pb-2 text-center text-xs font-semibold text-slate-500">Clean Accuracy</th>
                        <th className="pb-2 text-center text-xs font-semibold text-slate-500">FGSM Attack Accuracy</th>
                        <th className="pb-2 text-center text-xs font-semibold text-slate-500">PGD Attack Accuracy</th>
                        <th className="pb-2 text-center text-xs font-semibold text-slate-500">Robustness Disparity Index</th>
                        <th className="pb-2 text-center text-xs font-semibold text-slate-500">Vulnerability Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditState.robustness.map(rob => {
                        const isVulnerable = rob.robustnessDisparityIndex > 0.2
                        return (
                          <tr key={rob.groupName} className="border-b last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                            <td className="py-2.5 text-xs font-semibold text-foreground">{rob.groupName}</td>
                            <td className="py-2.5 text-center font-mono text-xs">{rob.cleanAccuracy}%</td>
                            <td className="py-2.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <Progress value={rob.fgsmAccuracy} className="h-1.5 w-16" />
                                <span className="font-mono text-xs text-foreground">{rob.fgsmAccuracy}%</span>
                              </div>
                            </td>
                            <td className="py-2.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <Progress value={rob.pgdAccuracy} className="h-1.5 w-16" />
                                <span className="font-mono text-xs text-foreground">{rob.pgdAccuracy}%</span>
                              </div>
                            </td>
                            <td className="py-2.5 text-center">
                              <span className={cn(
                                "font-mono text-xs font-bold",
                                isVulnerable ? "text-destructive" : "text-emerald-600"
                              )}>
                                {rob.robustnessDisparityIndex.toFixed(2)}
                              </span>
                            </td>
                            <td className="py-2.5 text-center">
                              {isVulnerable ? (
                                <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700 text-[0.55rem] font-bold">VULNERABLE</Badge>
                              ) : (
                                <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 text-[0.55rem] font-bold">STABLE</Badge>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

          </div>
        )}

      </div>
    </div>
  )
}
