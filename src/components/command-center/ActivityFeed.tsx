"use client"

import { FileText, Search, Shield, BarChart3 } from "lucide-react"
import { SeverityBadge } from "@/components/command-center/SeverityBadge"
import type { ActivityFeedItem, ActivityFeedCategory } from "@/data/mockData"
import { cn } from "@/lib/utils"

export interface ActivityFeedProps {
  items: ActivityFeedItem[]
  hideHeader?: boolean
}

const CATEGORY_ICONS: Record<
  ActivityFeedCategory,
  React.ComponentType<{ className?: string }>
> = {
  finding: Shield,
  analysis: BarChart3,
  investigation: Search,
  audit: FileText,
}

function formatRelativeTime(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function ActivityFeed({ items, hideHeader }: ActivityFeedProps) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden",
        !hideHeader && "rounded-md border border-border bg-card"
      )}
    >
      {!hideHeader && (
        <p className="shrink-0 border-b border-border px-3 py-2 g-text-caption font-semibold uppercase tracking-wide text-muted-foreground">
          Recent Activity
        </p>
      )}

      <div className="min-h-0 flex-1 overflow-auto">
        {items.map((item) => {
          const Icon = CATEGORY_ICONS[item.category]
          return (
            <div
              key={item.id}
              className="flex items-start gap-2.5 border-b border-border px-3 py-2 last:border-b-0"
            >
              <div
                className={cn(
                  "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
                  item.category === "finding" && "bg-destructive/10 text-destructive",
                  item.category === "analysis" && "bg-primary/10 text-primary",
                  item.category === "investigation" && "bg-orange-500/10 text-orange-400",
                  item.category === "audit" && "bg-emerald-500/10 text-emerald-400"
                )}
              >
                <Icon className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="g-text-caption text-foreground">{item.description}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {item.severity && <SeverityBadge severity={item.severity} />}
                  <span className="g-text-caption text-muted-foreground">{item.referenceId}</span>
                </div>
              </div>
              <span className="shrink-0 g-text-caption text-muted-foreground">
                {formatRelativeTime(item.timestamp)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
