import { useState, useMemo } from "react"
import { ShieldAlert, TrendingUp, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Search, Download, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { THREAT_EVENTS, type ThreatSeverity } from "@/data/mockData"

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

export function ThreatAnalysisPage() {
  const [search, setSearch] = useState("")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filtered = useMemo(() => {
    return THREAT_EVENTS.filter(t => {
      const matchSearch =
        !search ||
        t.applicantName.toLowerCase().includes(search.toLowerCase()) ||
        t.attackVector.toLowerCase().includes(search.toLowerCase()) ||
        t.applicantId.toLowerCase().includes(search.toLowerCase())
      const matchSev = severityFilter === "all" || t.severity === severityFilter
      const matchStatus = statusFilter === "all" || (statusFilter === "blocked" ? t.blocked : !t.blocked)
      return matchSearch && matchSev && matchStatus
    })
  }, [search, severityFilter, statusFilter])

  const counts = useMemo(() => ({
    critical: THREAT_EVENTS.filter(t => t.severity === "critical").length,
    high: THREAT_EVENTS.filter(t => t.severity === "high").length,
    medium: THREAT_EVENTS.filter(t => t.severity === "medium").length,
    low: THREAT_EVENTS.filter(t => t.severity === "low").length,
    blocked: THREAT_EVENTS.filter(t => t.blocked).length,
    total: THREAT_EVENTS.length,
  }), [])

  const maxHeat = Math.max(...HEATMAP_DATA.flatMap(r => DAY_KEYS.map(d => r[d])))

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-card px-6 py-4">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Threat Analysis
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Real-time adversarial proxy detection — {THREAT_EVENTS.length} events detected today
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <Download className="h-3.5 w-3.5" />
          Export Report
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {/* Stat cards */}
        <div className="mb-6 grid grid-cols-5 gap-3">
          {[
            { label: "Critical", value: counts.critical, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", icon: ShieldAlert },
            { label: "High", value: counts.high, color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", icon: AlertCircle },
            { label: "Medium", value: counts.medium, color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200", icon: AlertCircle },
            { label: "Low", value: counts.low, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle },
            { label: "Blocked", value: counts.blocked, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", icon: TrendingUp },
          ].map(s => {
            const Icon = s.icon
            return (
              <Card key={s.label} className={cn("border shadow-sm", s.border)}>
                <CardContent className="px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground truncate">{s.label}</p>
                      <p className={cn("mt-1 text-3xl font-bold tracking-tight tabular-nums", s.color)}>{s.value}</p>
                    </div>
                    <div className={cn("shrink-0 rounded-xl p-2.5", s.bg)}>
                      <Icon className={cn("h-5 w-5", s.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Threat Feed Table */}
          <div className="col-span-2">
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
                      placeholder="Search applicant, vector…"
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
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help text-xs text-foreground">{threat.attackVector}</span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>{threat.description}</p>
                              <p className="mt-1 text-xs opacity-70">Proxies: {threat.proxyVariables.join(", ")}</p>
                            </TooltipContent>
                          </Tooltip>
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>Threat events by hour and day of week (past 4 weeks)</TooltipContent>
                  </Tooltip>
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
                  <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    Top Attack Vectors
                  </p>
                  {[
                    { label: "3-Strike Proxy Chain", count: 3, pct: 43 },
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
                {THREAT_EVENTS.map(t => (
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
      </div>
    </div>
  )
}
