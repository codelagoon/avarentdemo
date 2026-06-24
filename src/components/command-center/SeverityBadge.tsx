import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ThreatSeverity } from "@/data/mockData"

export interface SeverityBadgeProps {
  severity: ThreatSeverity
  className?: string
}

const SEVERITY_STYLES: Record<ThreatSeverity, string> = {
  critical: "border-status-fail-border bg-status-fail-bg text-status-fail",
  high: "border-status-review-border bg-status-review-bg text-status-review",
  medium: "border-status-review-border bg-status-review-bg text-status-review",
  low: "border-status-pass-border bg-status-pass-bg text-status-pass",
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded px-1.5 py-0 text-[0.65rem] font-semibold capitalize",
        SEVERITY_STYLES[severity],
        className
      )}
    >
      {severity}
    </Badge>
  )
}
