"use client"

import { Info } from "lucide-react"
import { SeverityBadge } from "@/components/command-center/SeverityBadge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { CommandCenterFinding, FindingStatus } from "@/data/mockData"
import type { NavigateOptions, WorkflowId } from "@/lib/navigation"
import { cn } from "@/lib/utils"
import { Activity, Eye, Search } from "lucide-react"

export interface FindingsTableProps {
  findings: CommandCenterFinding[]
  onNavigate?: (id: WorkflowId, options?: NavigateOptions) => void
  onFindingClick?: (findingId: string) => void
  className?: string
}

const STATUS_CONFIG: Record<
  FindingStatus,
  { label: string; icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  investigating: {
    label: "Investigating",
    icon: Search,
    className: "border-status-review-border bg-status-review-bg text-status-review",
  },
  review: {
    label: "Review",
    icon: Eye,
    className: "border-status-review-border bg-status-review-bg text-status-review",
  },
  monitoring: {
    label: "Monitoring",
    icon: Activity,
    className: "border-status-review-border bg-status-review-bg text-status-review",
  },
  resolved: {
    label: "Resolved",
    icon: Activity,
    className: "border-status-pass-border bg-status-pass-bg text-status-pass",
  },
}

function StatusBadge({ status }: { status: FindingStatus }) {
  const { label, icon: Icon, className } = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[0.65rem] font-medium leading-none align-middle",
        className
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden />
      <span>{label}</span>
    </span>
  )
}

export function FindingsTable({
  findings,
  onNavigate,
  onFindingClick,
  className,
}: FindingsTableProps) {
  const goToInvestigations = () => onNavigate?.("investigations")

  const goToFinding = (findingId: string) => {
    if (onFindingClick) {
      onFindingClick(findingId)
      return
    }
    onNavigate?.("investigations", { findingId })
  }

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-md border border-border bg-card shadow-surface",
        className
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-1.5">
          <h2 className="g-text-caption font-semibold uppercase tracking-wide text-muted-foreground">
            Active Findings
          </h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="About the active findings queue"
                >
                  <Info className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-56">
                Priority queue of open findings sorted by severity and age. Select a
                finding ID or View all to open Investigations.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <button
          type="button"
          onClick={goToInvestigations}
          className="g-text-caption font-medium text-primary hover:underline"
        >
          View all
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b border-border g-text-caption text-muted-foreground">
              <th className="px-3 py-1.5 text-left font-medium">ID</th>
              <th className="px-3 py-1.5 text-left font-medium">Category</th>
              <th className="px-3 py-1.5 text-left font-medium">Issue Description</th>
              <th className="px-3 py-1.5 text-left font-medium">Affected Group</th>
              <th className="px-3 py-1.5 text-left font-medium">Severity</th>
              <th className="px-3 py-1.5 text-left font-medium">Age</th>
              <th className="px-3 py-1.5 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {findings.map((finding) => (
              <tr key={finding.id} className="border-b border-border last:border-b-0">
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => goToFinding(finding.id)}
                    className="g-text-caption font-medium text-primary hover:underline"
                  >
                    {finding.id}
                  </button>
                </td>
                <td className="px-3 py-2 g-text-caption text-foreground">{finding.category}</td>
                <td className="max-w-[180px] px-3 py-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="block truncate g-text-caption text-foreground">
                          {finding.issueDescription}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        {finding.issueDescription}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </td>
                <td className="px-3 py-2 g-text-caption text-muted-foreground">
                  {finding.affectedGroup}
                </td>
                <td className="px-3 py-2">
                  <SeverityBadge severity={finding.severity} />
                </td>
                <td className="px-3 py-2 g-text-caption text-muted-foreground">
                  {finding.ageDays}d
                </td>
                <td className="px-3 py-2">
                  <div className="flex h-full items-center">
                    <StatusBadge status={finding.status} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
