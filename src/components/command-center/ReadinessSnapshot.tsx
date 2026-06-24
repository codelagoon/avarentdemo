"use client"

import { AlertTriangle, CheckCircle, Download } from "lucide-react"
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
import type { ExamReadinessCategory } from "@/data/mockData"
import type { WorkflowId } from "@/lib/navigation"
import { cn } from "@/lib/utils"

export interface ReadinessSnapshotProps {
  categories: ExamReadinessCategory[]
  criticalFindingCount: number
  onNavigate?: (id: WorkflowId) => void
  hideHeader?: boolean
  compact?: boolean
}

export function ReadinessSnapshot({
  categories,
  criticalFindingCount,
  onNavigate,
  hideHeader,
  compact = false,
}: ReadinessSnapshotProps) {
  const hasCriticalFindings = criticalFindingCount > 0

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden",
        compact && "h-full overflow-y-auto overscroll-y-contain",
        !hideHeader && "rounded-md border border-border bg-card shadow-surface"
      )}
    >
      {!hideHeader && (
        <p className="shrink-0 border-b border-border px-3 py-2 g-text-caption font-semibold uppercase tracking-wide text-muted-foreground">
          Exam Readiness Snapshot
        </p>
      )}

      <div className={cn("flex min-h-0 flex-col", compact ? "gap-2 p-2" : "gap-3 p-3")}>
        <ul className={cn("shrink-0 divide-y divide-border", compact && "min-h-0 overflow-y-auto")}>
          {categories.map((cat) => (
            <li
              key={cat.id}
              className={cn(
                "flex items-baseline justify-between gap-3 first:pt-0 last:pb-0",
                compact ? "py-1.5" : "py-2"
              )}
            >
              <div className="min-w-0">
                <p className="g-text-caption font-medium text-foreground">{cat.label}</p>
                <p className="g-text-caption text-muted-foreground">{cat.status}</p>
              </div>
              <span className="shrink-0 font-mono-data g-text-caption font-semibold text-foreground">
                {cat.percentage}%
              </span>
            </li>
          ))}
        </ul>

        <div
          className={cn(
            "grid shrink-0 grid-cols-[1rem_1fr] items-center gap-x-2.5 rounded-md border",
            compact ? "px-2.5 py-2" : "px-3 py-2.5",
            hasCriticalFindings
              ? "border-status-review-border bg-status-review-bg"
              : "border-status-pass-border bg-status-pass-bg"
          )}
          role="status"
        >
          {hasCriticalFindings ? (
            <AlertTriangle
              className="size-4 shrink-0 text-status-review"
              aria-hidden
            />
          ) : (
            <CheckCircle
              className="size-4 shrink-0 text-status-pass"
              aria-hidden
            />
          )}
          <p
            className={cn(
              "min-w-0 g-text-caption leading-snug",
              hasCriticalFindings ? "text-status-review" : "text-status-pass"
            )}
          >
            {hasCriticalFindings
              ? (
                <>
                  {criticalFindingCount} critical finding
                  {criticalFindingCount === 1 ? "" : "s"} require resolution before examination.
                </>
              )
              : "Documentation and evidence are in good shape for examination."}
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className={cn(
                "inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-md bg-primary font-medium text-primary-foreground transition-colors hover:bg-[var(--g-color-base-brand-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                compact ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-sm"
              )}
            >
              <Download className={cn("shrink-0", compact ? "size-3.5" : "size-4")} aria-hidden />
              <span className="leading-none">Generate Exam Package</span>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Generate exam package?</AlertDialogTitle>
              <AlertDialogDescription>
                {hasCriticalFindings
                  ? `This will open Documentation to compile materials. ${criticalFindingCount} critical finding${criticalFindingCount === 1 ? "" : "s"} will be flagged in the package.`
                  : "This will open Documentation to compile and review your examination materials."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onNavigate?.("documentation")}>
                Continue to Documentation
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
