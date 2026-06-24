"use client"

import { Label } from "@gravity-ui/uikit"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ViewportPage } from "@/components/shell/ViewportPage"
import { getNavItem } from "@/lib/navigation"
import { cn } from "@/lib/utils"

type SourceStatus = "connected" | "screening" | "paused"

interface DataSource {
  id: string
  name: string
  variables: number
  quarantined: number
  lastSync: string
  status: SourceStatus
}

const SOURCES: DataSource[] = [
  {
    id: "bureau",
    name: "Credit bureau (Experian)",
    variables: 142,
    quarantined: 3,
    status: "connected",
    lastSync: "2026-04-29T14:12:00Z",
  },
  {
    id: "core",
    name: "Core banking ledger",
    variables: 89,
    quarantined: 0,
    status: "connected",
    lastSync: "2026-04-29T14:08:00Z",
  },
  {
    id: "geo",
    name: "Geospatial enrichment",
    variables: 34,
    quarantined: 7,
    status: "screening",
    lastSync: "2026-04-29T13:55:00Z",
  },
  {
    id: "telco",
    name: "Telco payment history",
    variables: 12,
    quarantined: 2,
    status: "paused",
    lastSync: "2026-04-28T09:30:00Z",
  },
]

const STATUS_LABELS: Record<SourceStatus, string> = {
  connected: "Connected",
  screening: "Screening",
  paused: "Paused",
}

function statusTheme(status: SourceStatus): "success" | "warning" | "info" {
  if (status === "connected") return "success"
  if (status === "screening") return "warning"
  return "info"
}

function formatLastSync(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface ScreenButtonProps {
  source: DataSource
}

function ScreenButton({ source }: ScreenButtonProps) {
  if (source.status === "paused") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button
              variant="outline"
              size="sm"
              disabled
              aria-label={`Resume screening for ${source.name}`}
            >
              Resume screening
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          Feed is paused — resume syncing before screening variables
        </TooltipContent>
      </Tooltip>
    )
  }

  const label =
    source.status === "screening" ? "Review screening" : "Screen"
  const ariaLabel =
    source.status === "screening"
      ? `Review screening for ${source.name}`
      : `Screen variables for ${source.name}`

  const handleClick = () => {
    toast.info(
      source.status === "screening"
        ? `Opening screening review for ${source.name}`
        : `Starting variable screening for ${source.name}`
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      aria-label={ariaLabel}
      data-testid={`screen-variable-button-${source.id}`}
      onClick={handleClick}
    >
      {label}
    </Button>
  )
}

export function DataSourcesPage() {
  const nav = getNavItem("data-sources")
  const totalQuarantined = SOURCES.reduce((sum, source) => sum + source.quarantined, 0)
  const screeningCount = SOURCES.filter((source) => source.status === "screening").length

  return (
    <TooltipProvider>
      <ViewportPage testId="data-sources-page" className="gap-3">
      <header className="shrink-0 space-y-0.5">
        <h1 className="g-text-subheader font-semibold text-foreground">{nav.label}</h1>
        <p className="g-text-caption text-muted-foreground">{nav.description}</p>
        {SOURCES.length > 0 ? (
          <p className="g-text-caption text-muted-foreground">
            {screeningCount > 0 ? (
              <>
                <span className="font-mono-data">{screeningCount}</span> feed
                {screeningCount === 1 ? "" : "s"} screening ·{" "}
              </>
            ) : null}
            <span className="font-mono-data">{totalQuarantined}</span> variables quarantined
          </p>
        ) : null}
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-border bg-card shadow-surface">
        <p className="shrink-0 border-b border-border px-3 py-2 g-text-caption font-semibold uppercase tracking-wide text-muted-foreground">
          Connected sources
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {SOURCES.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
              <p className="g-text-caption font-medium text-foreground">No feeds connected</p>
              <p className="g-text-caption max-w-sm text-muted-foreground">
                Add a bureau or ledger integration to begin variable screening and proxy
                quarantine review.
              </p>
            </div>
          ) : (
            SOURCES.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="g-text-caption font-medium text-foreground">{source.name}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 g-text-caption text-muted-foreground">
                    <span>
                      <span className="font-mono-data text-foreground">{source.variables}</span>{" "}
                      variables
                    </span>
                    <span>
                      <span className="font-mono-data text-foreground">{source.quarantined}</span>{" "}
                      quarantined
                    </span>
                    <span>
                      Last sync{" "}
                      <time
                        dateTime={source.lastSync}
                        className="font-mono-data text-foreground"
                      >
                        {formatLastSync(source.lastSync)}
                      </time>
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Label theme={statusTheme(source.status)} size="xs">
                    {STATUS_LABELS[source.status]}
                  </Label>
                  <ScreenButton source={source} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </ViewportPage>
    </TooltipProvider>
  )
}
