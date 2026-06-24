import { useState, useMemo, useEffect } from "react"
import { useLiveData } from "@/hooks/useLiveData"
import { BookOpen, Search, Download, Hash, ChevronDown, ChevronUp, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, FileText, Lock, RefreshCw, SlidersHorizontal } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table"

type LedgerEventType = "decision" | "alert" | "intervention" | "proof_signed" | "audit" | "governance_action"
const DATA_VOLUME: any[] = []
import { ledgerService } from "@/services/ledgerService"

function EventTypeIcon({ type }: { type: LedgerEventType | string }) {
  const map: Record<string, React.ComponentType<{ className?: string }>> = {
    decision: FileText,
    intervention: AlertTriangle,
    proof_signed: CheckCircle,
    alert: AlertTriangle,
    audit: RefreshCw,
    governance_action: Lock,
  }
  const Icon = map[type as string] || FileText
  const colors: Record<string, string> = {
    decision: "text-blue-600",
    intervention: "text-orange-600",
    proof_signed: "text-emerald-600",
    alert: "text-destructive",
    audit: "text-muted-foreground",
    governance_action: "text-indigo-600",
  }
  return <Icon className={cn("h-3.5 w-3.5", colors[type as string] || "text-foreground")} />
}

function EventTypeBadge({ type }: { type: LedgerEventType | string }) {
  const map: Record<string, { label: string; cls: string }> = {
    decision: { label: "Decision", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    intervention: { label: "Intervention", cls: "bg-orange-50 text-orange-700 border-orange-200" },
    proof_signed: { label: "Audit Sealed", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    alert: { label: "Alert", cls: "bg-destructive/10 text-destructive border-destructive/20" },
    audit: { label: "Audit", cls: "bg-secondary text-muted-foreground border-border" },
    governance_action: { label: "Governance", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  }
  const match = map[type as string] || { label: type, cls: "bg-secondary text-muted-foreground border-border" }
  return <span className={cn("rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold", match.cls)}>{match.label}</span>
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
    <span className={cn("rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold uppercase", map[decision.toLowerCase()] ?? "bg-secondary text-muted-foreground border-border")}>
      {decision.replace("_", " ")}
    </span>
  )
}

export function EvidenceLedgerPage() {
  const entries = useLiveData(() => ledgerService.getAll(), ["ledger"])
  const [sorting, setSorting] = useState<SortingState>([{ id: 'timestamp', desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  
  const stats = useMemo(() => {
    const all = entries
    return {
      total: all.length,
      proofs: all.filter(e => e.eventType === "proof_signed").length,
      interventions: all.filter(e => e.eventType === "intervention").length,
      avgFairness: all.length > 0 ? all.reduce((s, e) => s + (e.fairnessScore || 0), 0) / all.length : 0,
    }
  }, [entries])

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: 'icon',
      header: '',
      cell: ({ row }) => <div className="pl-5"><EventTypeIcon type={row.original.eventType} /></div>,
      enableSorting: false,
    },
    {
      accessorKey: 'timestamp',
      header: ({ column }) => (
        <div className="cursor-pointer flex items-center gap-1" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Timestamp
          {column.getIsSorted() === "asc" ? <ChevronUp className="h-3 w-3" /> : column.getIsSorted() === "desc" ? <ChevronDown className="h-3 w-3" /> : null}
        </div>
      ),
      cell: ({ row }) => {
        const d = new Date(row.getValue('timestamp'))
        return (
          <div>
            <p className="font-mono text-[0.72rem] tabular-nums text-foreground">
              {d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
            </p>
            <p className="font-mono text-[0.62rem] text-muted-foreground">
              {d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        )
      }
    },
    {
      accessorKey: 'id',
      header: 'Event ID',
      cell: ({ row }) => <span className="font-mono text-[0.68rem] text-muted-foreground">{row.getValue('id')}</span>
    },
    {
      accessorKey: 'applicantName',
      header: 'Subject / Entity',
      cell: ({ row }) => (
        <div>
          <p className="text-[0.8rem] font-medium text-foreground">{row.getValue('applicantName') || "System Action"}</p>
          <p className="font-mono text-[0.62rem] text-muted-foreground">{row.original.applicantId}</p>
        </div>
      )
    },
    {
      accessorKey: 'eventType',
      header: 'Type',
      cell: ({ row }) => <EventTypeBadge type={row.getValue('eventType') as string} />
    },
    {
      accessorKey: 'decision',
      header: 'Decision',
      cell: ({ row }) => <DecisionBadge decision={row.getValue('decision') as string} />
    },
    {
      accessorKey: 'fairnessScore',
      header: ({ column }) => (
        <div className="cursor-pointer flex items-center gap-1" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Score <span className="text-[0.55rem] font-normal tracking-normal normal-case text-muted-foreground">(AIR / SPD)</span>
          {column.getIsSorted() === "asc" ? <ChevronUp className="h-3 w-3" /> : column.getIsSorted() === "desc" ? <ChevronDown className="h-3 w-3" /> : null}
        </div>
      ),
      cell: ({ row }) => {
        const val = row.getValue('fairnessScore') as number
        if (val === undefined || val === null) return <span className="text-muted-foreground text-[0.68rem]">-</span>
        return (
          <span className={cn("font-mono text-[0.78rem] font-bold tabular-nums", val >= 0.8 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
            {val.toFixed(2)} / {Math.max(0, 1 - val).toFixed(2)}
          </span>
        )
      }
    },
    {
      accessorKey: 'hash',
      header: 'Hash',
      cell: ({ row }) => {
        const h = row.getValue('hash') as string
        if (!h) return null
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[0.62rem] text-muted-foreground">
                {h.slice(0, 12)}…
              </span>
            </TooltipTrigger>
            <TooltipContent><span className="font-mono text-[0.65rem]">{h}</span></TooltipContent>
          </Tooltip>
        )
      }
    }
  ], [])

  const table = useReactTable({
    data: entries,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 25,
      },
    },
  })

  const handleExport = () => {
    const csv = [
      ["ID", "Timestamp", "Type", "Applicant", "Decision", "Fairness", "Message"].join(","),
      ...table.getFilteredRowModel().rows.map(row => {
        const e = row.original
        return [
          e.id,
          e.timestamp,
          e.eventType,
          `"${e.applicantName || ""}"`,
          e.decision || "-",
          e.fairnessScore || "",
          `"${e.message || ""}"`,
        ].join(",")
      })
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `evidence-ledger-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${table.getFilteredRowModel().rows.length} entries to CSV`)
  }

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
              Immutable hash-chained audit log
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

      <div className="flex-1 flex flex-col p-5 overflow-hidden min-h-0">
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
        <Card className="flex-1 flex flex-col border-border/60 shadow-sm overflow-hidden min-h-0">
          <div className="flex items-center justify-between border-b border-border/40 px-5 py-3 shrink-0 bg-muted/20">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">Filter & Sort</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search globally..."
                  value={globalFilter ?? ''}
                  onChange={e => setGlobalFilter(e.target.value)}
                  className="h-8 w-64 pl-8 text-xs bg-background"
                />
              </div>
              <Select 
                value={(table.getColumn('eventType')?.getFilterValue() as string) ?? "all"} 
                onValueChange={(val) => table.getColumn('eventType')?.setFilterValue(val === "all" ? "" : val)}
              >
                <SelectTrigger className="h-8 w-40 text-xs bg-background">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="decision">Decision</SelectItem>
                  <SelectItem value="intervention">Intervention</SelectItem>
                  <SelectItem value="proof_signed">Audit Sealed</SelectItem>
                  <SelectItem value="alert">Alert</SelectItem>
                  <SelectItem value="audit">Audit</SelectItem>
                  <SelectItem value="governance_action">Governance</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="secondary" className="text-[0.65rem] h-8 flex items-center">{table.getFilteredRowModel().rows.length} records</Badge>
            </div>
          </div>
          <div className="flex-1 overflow-auto min-h-0">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id} className="border-border/40 hover:bg-transparent shadow-[0_1px_0_0_hsl(var(--border)/0.4)]">
                    {headerGroup.headers.map(header => (
                      <TableHead key={header.id} className="text-[0.68rem] font-semibold uppercase tracking-wider h-10">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="border-border/30 hover:bg-muted/30">
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id} className="py-2.5">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Toolbar */}
          <div className="flex items-center justify-between border-t border-border/40 px-5 py-3 bg-muted/20 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[0.7rem] text-muted-foreground">Rows per page:</span>
              <Select 
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger className="h-7 w-[70px] text-xs bg-background">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100, 500].map(pageSize => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>{pageSize}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-[0.7rem] text-muted-foreground ml-3">
                Showing {table.getRowModel().rows.length > 0 ? table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1 : 0}–{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} of {table.getFilteredRowModel().rows.length} entries
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs bg-background"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <span className="text-[0.7rem] text-muted-foreground px-2">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs bg-background"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
