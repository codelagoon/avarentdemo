"use client"

import { Check, Loader2 } from "lucide-react"
import type { WorkflowActivity } from "@/data/mockData"
import { cn } from "@/lib/utils"

export interface WorkflowStepperProps {
  workflow: WorkflowActivity
  hideHeader?: boolean
}

export function WorkflowStepper({ workflow, hideHeader }: WorkflowStepperProps) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden",
        !hideHeader && "rounded-md border border-border bg-card"
      )}
    >
      {!hideHeader && (
        <p className="shrink-0 border-b border-border px-3 py-2 g-text-caption font-semibold uppercase tracking-wide text-muted-foreground">
          Analysis Activity
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:flex-row">
        <div className="flex min-w-0 flex-1 items-center justify-between gap-1">
          {workflow.steps.map((step, index) => (
            <div key={step.id} className="flex min-w-0 flex-1 items-center">
              <div className="flex min-w-0 flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border-2",
                    step.status === "completed" &&
                      "border-emerald-500/60 bg-emerald-500/10 text-emerald-400",
                    step.status === "active" &&
                      "border-primary bg-primary/10 text-primary",
                    (step.status === "queued" || step.status === "pending") &&
                      "border-dashed border-muted-foreground/40 text-muted-foreground"
                  )}
                >
                  {step.status === "completed" && <Check className="size-4" />}
                  {step.status === "active" && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  {(step.status === "queued" || step.status === "pending") && (
                    <span className="size-2 rounded-full bg-muted-foreground/40" />
                  )}
                </div>
                <span
                  className={cn(
                    "g-text-caption text-center",
                    step.status === "active"
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
                {step.status === "active" && step.progress != null && (
                  <span className="g-text-caption font-medium text-primary">
                    {step.progress}%
                  </span>
                )}
              </div>
              {index < workflow.steps.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-px flex-1",
                    step.status === "completed" ? "bg-emerald-500/40" : "bg-border"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <div className="shrink-0 rounded-md border border-border bg-muted/30 px-3 py-2 sm:w-44">
          <p className="g-text-caption font-medium text-muted-foreground">Current Analysis</p>
          <p className="mt-0.5 g-text-caption font-semibold text-foreground">{workflow.title}</p>
          <p className="mt-1 g-text-caption text-muted-foreground">
            {workflow.recordCount.toLocaleString()} decisions
          </p>
          <p className="g-text-caption font-medium text-emerald-400">
            Est. completion: {workflow.etaMinutes} min
          </p>
        </div>
      </div>
    </div>
  )
}
