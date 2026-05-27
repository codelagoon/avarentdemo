import { useState, useMemo } from "react"
import { useLiveData } from "@/hooks/useLiveData"
import { BookOpen, Search, Download, Hash, ChevronDown, ChevronUp, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, FileText, Lock, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { DATA_VOLUME, type LedgerEventType } from "@/data/mockData"
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
  const entries = useLiveData(() => ledgerService.getAll(), ["ledger"])
  const stats = useMemo(() => {
    const all = entries
    return {
      total: all.length,
      proofs: all.filter(e => e.eventType === "proof_signed").length,
      interventions: all.filter(e => e.eventType === "intervention").length,
      avgFairness: all.length > 0 ? all.reduce((s, e) => s + e.fairnessScore, 0) / all.length : 0,
    }
  }, [entries])

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
      <div className="flex items-center justify-between border-b border-border/30 bg-card px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Evidence Ledger</h1>
            <p className="text-[0.7rem] text-muted-foreground">
              Immutable hash-chained audit log · {DATA_VOLUME.featuresPerDecision} features/decision · {(DATA_VOLUME.trainingRecords / 1000000).toFixed(1)}M training records
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex cursor-default items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
                <Lock className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[0.7rem] font-semibold text-emerald-600 dark:text-emerald-400">SHA-256 Chained</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>Each entry is cryptographically linked to the previous entry</TooltipContent>
          </Tooltip>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" />Export CSV
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-5">
        {/* Summary cards */}
        <div className="mb-5 grid grid-cols-4 gap-3">
          {[
            { label: "Total Entries", value: stats.total, icon: Hash, color: "text-foreground", bg: "bg-muted/60" },
            { label: "Audits Sealed", value: stats.proofs, icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
            { label: "Interventions", value: stats.interventions, icon: AlertTriangle, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10" },
            { label: "Avg AIR / SPD", value: `${stats.avgFairness.toFixed(2)}`, icon: FileText, color: "text-primary", bg: "bg-primary/10" },
          ].map(s => {
            const Icon = s.icon
            return (
              <Card key={s.label} className="border-border/60 shadow-sm">
                <div className="flex items-center justify-between p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                    <p className={cn("mt-1.5 text-2xl font-bold tabular-nums tracking-tight", s.color)}>{s.value}</p>
                  </div>
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", s.bg)}>
                    <Icon className={cn("h-4 w-4", s.color)} />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Table card */}
        <Card className="border-border/60 shadow-sm">
          <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
            <p className="text-sm font-semibold text-foreground">Ledger Entries</p>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search name, ID, hash…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="h-7 w-56 pl-8 text-xs"
                  data-testid="ledger-search"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-7 w-36 text-xs" data-testid="ledger-type-filter">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="decision">Decision</SelectItem>
                  <SelectItem value="intervention">Intervention</SelectItem>
                  <SelectItem value="proof_signed">Audit Sealed</SelectItem>
                  <SelectItem value="alert">Alert</SelectItem>
                  <SelectItem value="audit">Audit</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="secondary" className="text-[0.65rem]">{filtered.length} records</Badge>
            </div>
          </div>
          <Table data-testid="ledger-table">
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="w-8 pl-5" />
                <TableHead className="cursor-pointer text-[0.68rem] font-semibold uppercase tracking-wider" onClick={() => toggleSort("timestamp")}>
                  Timestamp <SortIcon field="timestamp" />
                </TableHead>
                <TableHead className="text-[0.68rem] font-semibold uppercase tracking-wider">Event ID</TableHead>
                <TableHead className="text-[0.68rem] font-semibold uppercase tracking-wider">Applicant</TableHead>
                <TableHead className="text-[0.68rem] font-semibold uppercase tracking-wider">Type</TableHead>
                <TableHead className="text-[0.68rem] font-semibold uppercase tracking-wider">Decision</TableHead>
                <TableHead className="cursor-pointer text-[0.68rem] font-semibold uppercase tracking-wider" onClick={() => toggleSort("fairnessScore")}>
                  AIR / SPD <SortIcon field="fairnessScore" />
                </TableHead>
                <TableHead className="pr-5 text-[0.68rem] font-semibold uppercase tracking-wider">Hash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(entry => (
                <TableRow key={entry.id} className="border-border/30 transition-colors hover:bg-muted/30" data-testid={`ledger-row-${entry.id}`}>
                  <TableCell className="pl-5"><EventTypeIcon type={entry.eventType} /></TableCell>
                  <TableCell>
                    <p className="font-mono text-[0.72rem] tabular-nums text-foreground">
                      {new Date(entry.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
                    </p>
                    <p className="font-mono text-[0.62rem] text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-[0.68rem] text-muted-foreground">{entry.id}</span>
                  </TableCell>
                  <TableCell>
                    <p className="text-[0.8rem] font-medium text-foreground">{entry.applicantName}</p>
                    <p className="font-mono text-[0.62rem] text-muted-foreground">{entry.applicantId}</p>
                  </TableCell>
                  <TableCell><EventTypeBadge type={entry.eventType} /></TableCell>
                  <TableCell><DecisionBadge decision={entry.decision} /></TableCell>
                  <TableCell>
                    <span className={cn("font-mono text-[0.78rem] font-bold tabular-nums", entry.fairnessScore >= 0.8 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
                      {entry.fairnessScore.toFixed(2)} / {Math.max(0, 1 - entry.fairnessScore).toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="pr-5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[0.62rem] text-muted-foreground">
                          {entry.hash.slice(0, 12)}…
                        </span>
                      </TooltipTrigger>
                      <TooltipContent><span className="font-mono text-[0.65rem]">{entry.hash}</span></TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}
