"use client"

import { useEffect, useMemo, useState } from "react"
import { Crosshair, Lock } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { SeverityBadge } from "@/components/command-center/SeverityBadge"
import {
  WorkflowDetailPanel,
  WorkflowQueuePanel,
} from "@/components/shell/WorkflowQueuePanel"
import { ViewportPage } from "@/components/shell/ViewportPage"
import {
  assignInvestigation,
  escalateInvestigation,
  getInvestigations,
  getLedgerEvidenceForInvestigation,
  INVESTIGATION_SYNC_CHANNELS,
  resolveInvestigation,
} from "@/domains/investigations/investigationDomain"
import { useLiveData } from "@/hooks/useLiveData"
import type { ThreatEvent, LedgerEntry, LedgerEventType } from "@/data/mockData"
import { cn } from "@/lib/utils"

const INITIAL_VISIBLE = 8

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

function eventTypeLabel(type: LedgerEventType): string {
  const labels: Record<LedgerEventType, string> = {
    decision: "Credit decision",
    intervention: "Fairness intervention",
    proof_signed: "Audit sealed",
    alert: "Compliance alert",
    audit: "Audit event",
  }
  return labels[type]
}

/** Aggregate-safe queue label — no raw applicant PII. */
function threatQueueTitle(threat: ThreatEvent): string {
  if (threat.signalLabel) return threat.signalLabel
  if (threat.applicantId.startsWith("AGG-")) return threat.applicantName
  return threat.attackVector
}

function threatQueueSubtitle(threat: ThreatEvent): string {
  const id = threat.findingId ?? threat.id
  if (threat.signalLabel) return `${id} · ${threat.attackVector}`
  if (threat.findingId) return `${threat.findingId} · ${threat.attackVector}`
  return id
}

function EvidenceRow({ entry, isLast }: { entry: LedgerEntry; isLast: boolean }) {
  const isSealed = entry.eventType === "proof_signed"

  return (
    <div
      className={cn(
        "px-4 py-2.5",
        !isLast && "border-b border-border"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="g-text-caption line-clamp-2 text-foreground">{entry.message}</p>
        {isSealed ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 g-text-caption text-emerald-300">
            <Lock className="size-3" aria-hidden />
            Audit Sealed
          </span>
        ) : null}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
        <span className="g-text-caption text-muted-foreground">{eventTypeLabel(entry.eventType)}</span>
        <time className="g-text-caption font-mono-data text-muted-foreground" dateTime={entry.timestamp}>
          {formatTimestamp(entry.timestamp)}
        </time>
        <span className="g-text-caption text-muted-foreground">
          Hash{" "}
          <span className="font-mono-data text-foreground">{entry.hash.slice(0, 12)}…</span>
        </span>
      </div>
    </div>
  )
}

interface InvestigationDetailProps {
  threat: ThreatEvent
}

function InvestigationDetail({ threat }: InvestigationDetailProps) {
  const evidence = useLiveData(
    () => getLedgerEvidenceForInvestigation(threat),
    [...INVESTIGATION_SYNC_CHANNELS]
  )
  const title = threat.signalLabel ?? threat.attackVector

  const handleAssign = () => {
    assignInvestigation(threat.id)
    toast.success(`Investigation ${threat.id} assigned to you`)
  }

  const handleEscalate = () => {
    escalateInvestigation(threat)
    toast.warning(`${threat.id} escalated to compliance review`)
  }

  const handleResolve = () => {
    resolveInvestigation(threat)
    toast.success(`Investigation ${threat.id} resolved — mitigation recorded in ledger`)
  }

  return (
    <>
      <header className="shrink-0 border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={threat.severity} />
          <span className="g-text-caption font-mono-data text-muted-foreground">{threat.id}</span>
          {threat.findingId ? (
            <span className="g-text-caption font-mono-data text-muted-foreground">
              Finding {threat.findingId}
            </span>
          ) : null}
        </div>
        <h2 className="mt-1 g-text-subheader text-foreground">{title}</h2>
        <p className="g-text-caption mt-0.5 line-clamp-2 text-muted-foreground">{threat.description}</p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <section aria-labelledby="evidence-heading">
          <p
            id="evidence-heading"
            className="border-b border-border px-4 py-2 g-text-caption font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Evidence ledger
          </p>
          {evidence.length > 0 ? (
            evidence.map((entry, index) => (
              <EvidenceRow
                key={entry.id}
                entry={entry}
                isLast={index === evidence.length - 1}
              />
            ))
          ) : (
            <p className="px-4 py-3 g-text-caption text-muted-foreground">
              No ledger entries linked to this investigation.
            </p>
          )}
        </section>

        <section
          aria-labelledby="attack-context-heading"
          className="border-t border-border"
        >
          <div className="flex items-center gap-1.5 border-b border-border px-4 py-2">
            <Crosshair className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <p
              id="attack-context-heading"
              className="g-text-caption font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Attack context
            </p>
          </div>
          <dl className="grid gap-x-6 gap-y-2 px-4 py-3 sm:grid-cols-2">
            <div>
              <dt className="g-text-caption text-muted-foreground">Detected</dt>
              <dd>
                <time className="g-text-caption font-mono-data text-foreground" dateTime={threat.timestamp}>
                  {formatTimestamp(threat.timestamp)}
                </time>
              </dd>
            </div>
            <div>
              <dt className="g-text-caption text-muted-foreground">Vector</dt>
              <dd className="g-text-caption text-foreground">{threat.attackVector}</dd>
            </div>
            <div>
              <dt className="g-text-caption text-muted-foreground">Detection confidence</dt>
              <dd className="font-mono-data g-text-caption font-medium text-foreground">
                {threat.confidence.toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="g-text-caption text-muted-foreground">Model score</dt>
              <dd className="font-mono-data g-text-caption font-medium text-foreground">
                {threat.modelScore.toFixed(2)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="g-text-caption text-muted-foreground">Proxy variables</dt>
              <dd className="g-text-caption font-mono-data text-foreground">
                {threat.proxyVariables.join(", ")}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <footer className="flex shrink-0 flex-wrap gap-2 border-t border-border px-4 py-3">
        <Button variant="default" size="sm" onClick={handleAssign}>
          Assign
        </Button>
        <Button variant="outline" size="sm" onClick={handleEscalate}>
          Escalate
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="secondary" size="sm">
              Resolve
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Resolve investigation?</AlertDialogTitle>
              <AlertDialogDescription>
                This will close {threat.id}
                {threat.findingId ? ` (${threat.findingId})` : ""} and record mitigation in the
                evidence ledger. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleResolve}>Resolve investigation</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </footer>
    </>
  )
}

export interface InvestigationsPageProps {
  initialInvestigationId?: string | null
}

export function InvestigationsPage({
  initialInvestigationId,
}: InvestigationsPageProps) {
  const threats = useLiveData(() => getInvestigations(), [...INVESTIGATION_SYNC_CHANNELS])
  const [showAll, setShowAll] = useState(false)
  const [selectedId, setSelectedId] = useState(
    initialInvestigationId ?? threats[0]?.id ?? ""
  )

  useEffect(() => {
    if (initialInvestigationId) {
      setSelectedId(initialInvestigationId)
      const index = threats.findIndex((t) => t.id === initialInvestigationId)
      if (index >= INITIAL_VISIBLE) {
        setShowAll(true)
      }
    }
  }, [initialInvestigationId, threats])

  const visibleThreats = showAll ? threats : threats.slice(0, INITIAL_VISIBLE)
  const hiddenCount = threats.length - INITIAL_VISIBLE
  const selected = threats.find((t) => t.id === selectedId) ?? visibleThreats[0]

  const queueItems = useMemo(
    () =>
      visibleThreats.map((threat) => ({
        id: threat.id,
        title: threatQueueTitle(threat),
        subtitle: threatQueueSubtitle(threat),
        badge: <SeverityBadge severity={threat.severity} />,
        testId: `threat-row-${threat.id}`,
      })),
    [visibleThreats]
  )

  return (
    <ViewportPage testId="investigations-page">
      <div className="flex h-full min-h-0 gap-3 overflow-hidden">
        <WorkflowQueuePanel
          heading="Investigations"
          items={queueItems}
          selectedId={selectedId}
          onSelect={setSelectedId}
          footer={
            !showAll && hiddenCount > 0 ? (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="w-full px-3 py-2 g-text-caption text-left text-primary hover:bg-[var(--g-color-base-simple-hover)]"
              >
                {hiddenCount} more investigation{hiddenCount === 1 ? "" : "s"}
              </button>
            ) : undefined
          }
        />

        <WorkflowDetailPanel isEmpty={!selected}>
          {selected ? <InvestigationDetail threat={selected} /> : null}
        </WorkflowDetailPanel>
      </div>
    </ViewportPage>
  )
}
