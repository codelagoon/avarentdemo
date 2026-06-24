import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface WorkflowQueueItem {
  id: string
  title: string
  subtitle?: string
  badge?: ReactNode
  testId?: string
}

export interface WorkflowQueuePanelProps {
  heading: string
  items: WorkflowQueueItem[]
  selectedId: string
  onSelect: (id: string) => void
  footer?: ReactNode
  emptyMessage?: string
  className?: string
}

/** Master-detail queue rail — single surface, internal scroll, no nested cards. */
export function WorkflowQueuePanel({
  heading,
  items,
  selectedId,
  onSelect,
  footer,
  emptyMessage = "Nothing in queue.",
  className,
}: WorkflowQueuePanelProps) {
  return (
    <div
      className={cn(
        "flex w-72 shrink-0 flex-col overflow-hidden rounded-md border border-border bg-card shadow-surface",
        className
      )}
    >
      <p className="shrink-0 border-b border-border px-3 py-2 g-text-caption font-semibold uppercase tracking-wide text-muted-foreground">
        {heading}
      </p>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <p className="px-3 py-4 g-text-caption text-muted-foreground">{emptyMessage}</p>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              data-testid={item.testId ?? `queue-row-${item.id}`}
              aria-selected={selectedId === item.id}
              onClick={() => onSelect(item.id)}
              className={cn(
                "flex w-full flex-col gap-0.5 border-b border-border px-3 py-2 text-left last:border-b-0",
                selectedId === item.id
                  ? "bg-[var(--g-color-base-selection)]"
                  : "hover:bg-[var(--g-color-base-simple-hover)]"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="g-text-caption line-clamp-2 min-w-0 flex-1 font-medium text-foreground">
                  {item.title}
                </span>
                {item.badge ? <div className="shrink-0">{item.badge}</div> : null}
              </div>
              {item.subtitle ? (
                <span className="g-text-caption line-clamp-1 text-muted-foreground">
                  {item.subtitle}
                </span>
              ) : null}
            </button>
          ))
        )}
      </div>
      {footer ? (
        <div className="shrink-0 border-t border-border">{footer}</div>
      ) : null}
    </div>
  )
}

export interface WorkflowDetailPanelProps {
  children: ReactNode
  className?: string
  emptyMessage?: string
  isEmpty?: boolean
}

/** Detail pane shell — header/body/footer grid with internal scroll on body. */
export function WorkflowDetailPanel({
  children,
  className,
  emptyMessage = "Select an item to review.",
  isEmpty = false,
}: WorkflowDetailPanelProps) {
  if (isEmpty) {
    return (
      <div
        className={cn(
          "flex min-h-0 flex-1 items-center justify-center rounded-md border border-border bg-card shadow-surface p-6",
          className
        )}
      >
        <p className="g-text-caption text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-border bg-card shadow-surface",
        className
      )}
    >
      {children}
    </div>
  )
}
