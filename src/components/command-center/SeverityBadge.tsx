import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ThreatSeverity } from "@/data/mockData"

export interface SeverityBadgeProps {
  severity: ThreatSeverity
  className?: string
}

const SEVERITY_STYLES: Record<ThreatSeverity, string> = {
  critical: "border-destructive/30 bg-destructive/10 text-destructive",
  high: "border-orange-500/30 bg-orange-500/10 text-orange-400",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  low: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
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
