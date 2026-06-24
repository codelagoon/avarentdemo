"use client"

import { useEffect, useMemo, useState } from "react"
import { Copy, Lock } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
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
import {
  WorkflowDetailPanel,
  WorkflowQueuePanel,
} from "@/components/shell/WorkflowQueuePanel"
import { ViewportPage } from "@/components/shell/ViewportPage"
import type { LedgerEntry, LedgerEventType } from "@/data/mockData"
import {
  approveDocumentation,
  AUDIT_PACKET_SYNC_CHANNELS,
  downloadExamPacket,
  generateExamPacket,
  getDocumentationQueue,
  requestDocumentationRevision,
  routeToLegalReview,
} from "@/domains/audit/auditPacketDomain"
import { useLiveData } from "@/hooks/useLiveData"
import { cn } from "@/lib/utils"

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

function decisionLabel(decision?: LedgerEntry["decision"]): string | null {
  if (!decision) return null
  const labels: Record<NonNullable<LedgerEntry["decision"]>, string> = {
    approved: "Approved",
    denied: "Denied — adverse action",
    under_review: "Under review",
    escalated: "Escalated — compliance review",
  }
  return labels[decision]
}

function queueLabel(entry: LedgerEntry): string {
  if (entry.decision === "escalated") return "Escalated — compliance review"
  if (entry.decision === "denied") return "Denied — adverse action"
  const eventLabels: Record<LedgerEventType, string> = {
    decision: "Credit decision",
    intervention: "Fairness intervention",
    proof_signed: "Proof bundle signed",
    alert: "Compliance alert",
    audit: "Audit event",
  }
  return eventLabels[entry.eventType]
}

function queueBadgeVariant(entry: LedgerEntry): string {
  if (entry.decision === "escalated" || entry.severity === "critical") {
    return "border-status-fail-border bg-status-fail-bg text-status-fail"
  }
  if (entry.decision === "denied") {
    return "border-status-fail-border bg-status-fail-bg text-status-fail"
  }
  if (entry.eventType === "proof_signed") {
    return "border-status-pass-border bg-status-pass-bg text-status-pass"
  }
  if (entry.severity === "high" || entry.eventType === "alert") {
    return "border-status-review-border bg-status-review-bg text-status-review"
  }
  return "border-border bg-muted/50 text-muted-foreground"
}

function copyHash(hash: string) {
  void navigator.clipboard.writeText(hash).then(() => {
    toast.success("Evidence hash copied to clipboard")
  })
}

interface DocumentationDetailProps {
  entry: LedgerEntry
}

function DocumentationDetail({ entry }: DocumentationDetailProps) {
  const isSealed = entry.eventType === "proof_signed"

  const handleApprove = () => {
    approveDocumentation(entry)
    toast.success(`Documentation approved for ${entry.id} — exam package updated`)
  }

  const handleRequestRevision = () => {
    requestDocumentationRevision(entry)
    toast.info(`Revision requested for ${entry.id}`)
  }

  const handleLegalReview = () => {
    routeToLegalReview(entry)
    toast.warning(`${entry.id} routed to legal review queue`)
  }

  const handleGeneratePacket = () => {
    const packet = generateExamPacket()
    void downloadExamPacket(packet).then(() => {
      toast.success(`Exam package ${packet.packetId} generated and downloaded`)
    })
  }

  return (
    <>
      <header className="shrink-0 border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn("rounded px-1.5 py-0 text-[0.65rem] font-medium", queueBadgeVariant(entry))}
          >
            {queueLabel(entry)}
          </Badge>
          <span className="g-text-caption font-mono-data text-muted-foreground">{entry.id}</span>
          {isSealed ? (
            <span className="inline-flex items-center gap-1 rounded border border-status-pass-border bg-status-pass-bg px-1.5 py-0.5 g-text-caption text-status-pass">
              <Lock className="size-3" aria-hidden />
              Audit Sealed
            </span>
          ) : null}
        </div>
        <h2 className="mt-1 g-text-subheader font-mono-data text-foreground">{entry.applicantName}</h2>
        <p className="g-text-caption mt-0.5 line-clamp-2 text-muted-foreground">{entry.message}</p>
        <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-2">
          {entry.decision ? (
            <div>
              <dt className="g-text-caption text-muted-foreground">Status</dt>
              <dd className="g-text-caption text-foreground">{decisionLabel(entry.decision)}</dd>
            </div>
          ) : null}
          <div>
            <dt className="g-text-caption text-muted-foreground">Model version</dt>
            <dd className="g-text-caption font-mono-data text-foreground">{entry.modelVersion}</dd>
          </div>
          <div>
            <dt className="g-text-caption text-muted-foreground">Recorded</dt>
            <dd>
              <time className="g-text-caption font-mono-data text-foreground" dateTime={entry.timestamp}>
                {formatTimestamp(entry.timestamp)}
              </time>
            </dd>
          </div>
          <div>
            <dt className="g-text-caption text-muted-foreground">Fairness score</dt>
            <dd className="g-text-caption font-mono-data text-foreground">
              {entry.fairnessScore.toFixed(2)}
            </dd>
          </div>
        </dl>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <section aria-labelledby="summary-heading">
          <p
            id="summary-heading"
            className="border-b border-border px-4 py-2 g-text-caption font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Summary
          </p>
          <p className="px-4 py-3 g-text-caption text-foreground">{entry.message}</p>
        </section>

        <section aria-labelledby="causal-proof-heading" className="border-t border-border">
          <p
            id="causal-proof-heading"
            className="border-b border-border px-4 py-2 g-text-caption font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Causal proof
          </p>
          <p className="px-4 py-3 g-text-caption text-foreground">
            {entry.interventionType ??
              "Statistical analysis and feature attribution documented in the immutable ledger."}
          </p>
        </section>

        <section aria-labelledby="ledger-hash-heading" className="border-t border-border">
          <p
            id="ledger-hash-heading"
            className="border-b border-border px-4 py-2 g-text-caption font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Ledger hash
          </p>
          <div className="flex items-start gap-2 px-4 py-3">
            <p className="min-w-0 flex-1 break-all g-text-caption font-mono-data text-foreground">
              {entry.hash}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1"
              onClick={() => copyHash(entry.hash)}
              aria-label="Copy evidence hash"
            >
              <Copy className="size-3.5" aria-hidden />
              Copy
            </Button>
          </div>
        </section>
      </div>

      <footer className="flex shrink-0 flex-wrap gap-2 border-t border-border px-4 py-3">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="default" size="sm">
              Approve
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve documentation?</AlertDialogTitle>
              <AlertDialogDescription>
                This will approve examination materials for {entry.id}. Evidence hash{" "}
                <span className="font-mono-data">{entry.hash.slice(0, 16)}…</span> will be included
                in the exam package. This action is recorded in the audit ledger.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleApprove}>Approve documentation</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button variant="outline" size="sm" onClick={handleRequestRevision}>
          Request revision
        </Button>
        <Button variant="outline" size="sm" onClick={handleLegalReview}>
          Legal review
        </Button>
        {isSealed ? (
          <Button variant="outline" size="sm" onClick={handleGeneratePacket}>
            Generate exam package
          </Button>
        ) : null}
      </footer>
    </>
  )
}

export function DocumentationPage() {
  const documentQueue = useLiveData(
    () => getDocumentationQueue(),
    [...AUDIT_PACKET_SYNC_CHANNELS]
  )
  const [selectedId, setSelectedId] = useState("")

  useEffect(() => {
    if (documentQueue.length === 0) {
      setSelectedId("")
      return
    }
    if (!documentQueue.some((doc) => doc.id === selectedId)) {
      setSelectedId(documentQueue[0].id)
    }
  }, [documentQueue, selectedId])

  const selected = documentQueue.find((doc) => doc.id === selectedId)

  const queueItems = useMemo(
    () =>
      documentQueue.map((doc) => ({
        id: doc.id,
        title: doc.id,
        subtitle: queueLabel(doc),
        badge: (
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 rounded px-1.5 py-0 text-[0.65rem] font-medium",
              queueBadgeVariant(doc)
            )}
          >
            {doc.decision === "denied"
              ? "Denied"
              : doc.decision === "escalated"
                ? "Escalated"
                : "Sealed"}
          </Badge>
        ),
      })),
    [documentQueue]
  )

  return (
    <ViewportPage testId="documentation-page">
      <div className="flex h-full min-h-0 gap-3 overflow-hidden">
        <WorkflowQueuePanel
          heading="Documentation queue"
          items={queueItems}
          selectedId={selectedId}
          onSelect={setSelectedId}
          emptyMessage="No documents pending review."
        />

        <WorkflowDetailPanel
          isEmpty={!selected}
          emptyMessage="No documents pending review."
        >
          {selected ? <DocumentationDetail entry={selected} /> : null}
        </WorkflowDetailPanel>
      </div>
    </ViewportPage>
  )
}
