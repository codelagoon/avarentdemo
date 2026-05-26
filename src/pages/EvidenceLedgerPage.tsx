import { useState, useMemo, useEffect } from "react"
import { BookOpen, Search, Download, Hash, ChevronDown, ChevronUp, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, FileText, Lock, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { DATA_VOLUME, type LedgerEntry, type LedgerEventType } from "@/data/mockData"
import { ledgerService } from "@/services/ledgerService"

function EventTypeIcon({ type }: { type: LedgerEventType }) {
  const map: Record<LedgerEventType, React.ComponentType<{ className?: string }>> = {
    decision: FileText,
    intervention: AlertTriangle,
    proof_signed: CheckCircle,
    alert: AlertTriangle,
    audit: RefreshCw,
  }
  const Icon = map[type]
  const colors: Record<LedgerEventType, string> = {
    decision: "text-blue-600",
    intervention: "text-orange-600",
    proof_signed: "text-emerald-600",
    alert: "text-destructive",
    audit: "text-muted-foreground",
  }
  return <Icon className={cn("h-3.5 w-3.5", colors[type])} />
}

function EventTypeBadge({ type }: { type: LedgerEventType }) {
  const map: Record<LedgerEventType, { label: string; cls: string }> = {
    decision: { label: "Decision", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    intervention: { label: "Intervention", cls: "bg-orange-50 text-orange-700 border-orange-200" },
    proof_signed: { label: "Audit Sealed", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    alert: { label: "Alert", cls: "bg-destructive/10 text-destructive border-destructive/20" },
    audit: { label: "Audit", cls: "bg-secondary text-muted-foreground border-border" },
  }
  const { label, cls } = map[type]
  return <span className={cn("rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold", cls)}>{label}</span>
}

function DecisionBadge({ decision }: { decision?: string }) {
  if (!decision) return null
  const map: Record<string, string> = {
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    denied: "bg-destructive/10 text-destructive border-destructive/20",
    under_review: "bg-yellow-50 text-yellow-700 border-yellow-200",
    escalated: "bg-orange-50 text-orange-700 border-orange-200",
  }
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold uppercase", map[decision] ?? "bg-secondary text-muted-foreground border-border")}>
      {decision.replace("_", " ")}
    </span>
  )
}

export function EvidenceLedgerPage() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [sortField, setSortField] = useState<"timestamp" | "fairnessScore">("timestamp")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [stats, setStats] = useState({ total: 0, proofs: 0, interventions: 0, avgFairness: 0 })

  // Load entries and stats
  useEffect(() => {
    const all = ledgerService.getAll()
    setEntries(all)
    setStats({
      total: all.length,
      proofs: all.filter(e => e.eventType === "proof_signed").length,
      interventions: all.filter(e => e.eventType === "intervention").length,
      avgFairness: all.length > 0 ? all.reduce((s, e) => s + e.fairnessScore, 0) / all.length : 0,
    })
  }, [])

  const filtered = useMemo(() => {
    const arr = entries.filter(e => {
      const matchSearch = !search ||
        e.applicantName.toLowerCase().includes(search.toLowerCase()) ||
        e.applicantId.toLowerCase().includes(search.toLowerCase()) ||
        e.hash.includes(search.toLowerCase()) ||
        e.message.toLowerCase().includes(search.toLowerCase())
      const matchType = typeFilter === "all" || e.eventType === typeFilter
      return matchSearch && matchType
    })
    arr.sort((a, b) => {
      const va = sortField === "timestamp" ? new Date(a.timestamp).getTime() : a.fairnessScore
      const vb = sortField === "timestamp" ? new Date(b.timestamp).getTime() : b.fairnessScore
      return sortDir === "desc" ? vb - va : va - vb
    })
    return arr
  }, [entries, search, typeFilter, sortField, sortDir])

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === "desc" ? "asc" : "desc")
    else { setSortField(field); setSortDir("desc") }
  }

  const handleExport = () => {
    // Generate CSV content
    const csv = [
      ["ID", "Timestamp", "Type", "Applicant", "Decision", "Fairness", "Message"].join(","),
      ...filtered.map(e => [
        e.id,
        e.timestamp,
        e.eventType,
        `"${e.applicantName}"`,
        e.decision || "-",
        e.fairnessScore,
        `"${e.message}"`,
      ].join(","))
    ].join("\n")

    // Download
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `evidence-ledger-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast.success(`Exported ${filtered.length} entries to CSV`)
  }

  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field
      ? sortDir === "desc" ? <ChevronDown className="ml-1 inline h-3 w-3" /> : <ChevronUp className="ml-1 inline h-3 w-3" />
      : null

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-card px-6 py-4">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <BookOpen className="h-5 w-5 text-primary" />
            Evidence Ledger
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Immutable hash-chained audit log — {DATA_VOLUME.featuresPerDecision} features per decision • {(DATA_VOLUME.trainingRecords / 1000000).toFixed(1)}M records in training corpus
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 rounded-lg border bg-accent/40 px-3 py-1.5">
                <Lock className="h-3 w-3 text-primary" />
                <span className="text-xs font-semibold text-primary">SHA-256 Chained</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>Each entry is cryptographically linked to the previous entry</TooltipContent>
          </Tooltip>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {/* Summary cards */}
        <div className="mb-5 grid grid-cols-4 gap-3">
          {[
            { label: "Total Entries", value: stats.total, icon: Hash, sub: "all time", accent: false },
            { label: "Audits Sealed", value: stats.proofs, icon: CheckCircle, sub: "cryptographic bundles", accent: true },
            { label: "Interventions", value: stats.interventions, icon: AlertTriangle, sub: "proxy severings", accent: false },
            { label: "Avg AIR / SPD", value: `${stats.avgFairness.toFixed(2)} / ${Math.max(0, 1 - stats.avgFairness).toFixed(2)}`, icon: FileText, sub: "across all decisions", accent: true },
          ].map(s => {
            const Icon = s.icon
            return (
              <Card key={s.label} className="border-border/60 shadow-sm">
                <CardContent className="px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.7rem] font-semibold tracking-wider text-muted-foreground truncate">{s.label}</p>
                      <p className={cn("mt-1 text-3xl font-bold tracking-tight tabular-nums", s.accent ? "text-primary" : "text-foreground")}>
                        {s.value}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
                    </div>
                    <div className={cn("shrink-0 rounded-xl p-2.5", s.accent ? "bg-primary/10" : "bg-muted")}>
                      <Icon className={cn("h-5 w-5", s.accent ? "text-primary" : "text-muted-foreground")} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Filters */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Ledger Entries</CardTitle>
              <Badge variant="secondary" className="text-[0.65rem]">{filtered.length} records</Badge>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID, hash, message..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="h-8 pl-8 text-xs"
                  data-testid="ledger-search"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-8 w-36 text-xs" data-testid="ledger-type-filter">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Event Types</SelectItem>
                  <SelectItem value="decision">Decision</SelectItem>
                  <SelectItem value="intervention">Intervention</SelectItem>
                  <SelectItem value="proof_signed">Audit Sealed</SelectItem>
                  <SelectItem value="alert">Alert</SelectItem>
                  <SelectItem value="audit">Audit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table data-testid="ledger-table">
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4 w-8"></TableHead>
                  <TableHead className="cursor-pointer text-xs" onClick={() => toggleSort("timestamp")}>
                    Timestamp <SortIcon field="timestamp" />
                  </TableHead>
                  <TableHead className="text-xs">Event ID</TableHead>
                  <TableHead className="text-xs">Applicant</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Decision</TableHead>
                  <TableHead className="cursor-pointer text-xs" onClick={() => toggleSort("fairnessScore")}>
                    AIR / SPD <SortIcon field="fairnessScore" />
                  </TableHead>
                  <TableHead className="text-xs pr-4">Hash (short)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(entry => (
                  <TableRow
                    key={entry.id}
                    className="hover:bg-secondary/30"
                    data-testid={`ledger-row-${entry.id}`}
                  >
                    <TableCell className="pl-4">
                      <EventTypeIcon type={entry.eventType} />
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-mono text-[0.65rem] text-foreground">
                          {new Date(entry.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
                        </span>
                        <p className="font-mono text-[0.6rem] text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-[0.65rem] text-muted-foreground">{entry.id}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-xs font-medium text-foreground">{entry.applicantName}</p>
                        <p className="font-mono text-[0.6rem] text-muted-foreground">{entry.applicantId}</p>
                      </div>
                    </TableCell>
                    <TableCell><EventTypeBadge type={entry.eventType} /></TableCell>
                    <TableCell><DecisionBadge decision={entry.decision} /></TableCell>
                    <TableCell>
                      <span className={cn(
                        "font-mono text-xs font-bold",
                        entry.fairnessScore >= 0.8 ? "text-emerald-600" : "text-destructive"
                      )}>
                        {entry.fairnessScore.toFixed(2)} / {Math.max(0, 1 - entry.fairnessScore).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="pr-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help font-mono text-[0.6rem] text-muted-foreground">
                            {entry.hash.slice(0, 12)}...
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <span className="font-mono text-[0.65rem]">{entry.hash}</span>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
