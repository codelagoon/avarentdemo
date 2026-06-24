"use client"

import { toast } from "sonner"
import { Label } from "@gravity-ui/uikit"
import { Button } from "@/components/ui/button"
import { ViewportPage } from "@/components/shell/ViewportPage"
import { SeverityBadge } from "@/components/command-center/SeverityBadge"
import { getLedgerEntries, LEDGER_SYNC_CHANNELS } from "@/domains/audit/ledgerDomain"
import { useLiveData } from "@/hooks/useLiveData"
import type { LedgerEventType } from "@/data/mockData"
import { getNavItem, type WorkflowId } from "@/lib/navigation"
import { cn } from "@/lib/utils"

const EVENT_TYPE_LABELS: Record<LedgerEventType, string> = {
  decision: "Application decision",
  intervention: "Proxy intervention",
  proof_signed: "Proof bundle signed",
  alert: "Compliance alert",
  audit: "Scheduled audit",
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export interface AuditHistoryPageProps {
  onNavigate?: (id: WorkflowId) => void
}

export function AuditHistoryPage({ onNavigate }: AuditHistoryPageProps) {
  const nav = getNavItem("audit-history")
  const entries = useLiveData(() => getLedgerEntries(), [...LEDGER_SYNC_CHANNELS])

  const handleExport = () => {
    toast.success(`Exporting ${entries.length} ledger entries for exam package`)
  }

  const handleRowActivate = (entryId: string, hasInvestigationLink: boolean) => {
    if (hasInvestigationLink && onNavigate) {
      onNavigate("investigations")
      return
    }
    toast.info(`Ledger entry ${entryId} — detail view coming soon`)
  }

  return (
    <ViewportPage testId="audit-history-page" className="gap-3">
      <header className="flex shrink-0 items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <h1 className="g-text-subheader font-semibold text-foreground">{nav.label}</h1>
          <p className="g-text-caption text-muted-foreground">{nav.description}</p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0" onClick={handleExport}>
          Export ledger excerpt
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-border bg-card shadow-surface">
        <p className="shrink-0 border-b border-border px-3 py-2 g-text-caption font-semibold uppercase tracking-wide text-muted-foreground">
          Evidence ledger · aggregate results only
        </p>
        <div className="min-h-0 flex-1 overflow-auto">
          {entries.map((entry) => {
            const hasInvestigationLink =
              entry.eventType === "intervention" ||
              entry.eventType === "alert" ||
              Boolean(entry.severity)

            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => handleRowActivate(entry.id, hasInvestigationLink)}
                className={cn(
                  "flex w-full items-start justify-between gap-3 border-b border-border px-3 py-2.5 text-left last:border-b-0",
                  "transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                )}
                aria-label={`${EVENT_TYPE_LABELS[entry.eventType]} for applicant ${entry.applicantId}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <time
                      dateTime={entry.timestamp}
                      className="font-mono-data g-text-caption text-muted-foreground"
                    >
                      {formatTimestamp(entry.timestamp)}
                    </time>
                    <Label
                      theme={
                        entry.eventType === "proof_signed"
                          ? "success"
                          : entry.eventType === "intervention" || entry.eventType === "alert"
                            ? "warning"
                            : "info"
                      }
                      size="xs"
                    >
                      {EVENT_TYPE_LABELS[entry.eventType]}
                    </Label>
                    {entry.severity ? <SeverityBadge severity={entry.severity} /> : null}
                  </div>
                  <p className="mt-1 g-text-caption line-clamp-2 text-foreground">{entry.message}</p>
                  <p className="mt-0.5 g-text-caption text-muted-foreground">
                    Applicant ID (anonymized):{" "}
                    <span className="font-mono-data text-foreground">{entry.applicantId}</span>
                  </p>
                </div>
                <span
                  className="font-mono-data g-text-caption shrink-0 text-muted-foreground"
                  title={entry.hash}
                >
                  {entry.hash.slice(0, 8)}…
                </span>
              </button>
            )
          })}
        </div>
        <p className="shrink-0 border-t border-border px-3 py-2 g-text-caption text-muted-foreground">
          Showing{" "}
          <span className="font-mono-data text-foreground">{entries.length}</span> of{" "}
          <span className="font-mono-data text-foreground">{entries.length}</span> entries
        </p>
      </div>
    </ViewportPage>
  )
}
