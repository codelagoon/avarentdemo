import type { ComponentType } from "react"
import {
  Activity,
  BarChart3,
  Database,
  FileText,
  History,
  LayoutDashboard,
  Search,
  Settings,
  Users,
} from "lucide-react"
import type { WorkflowId } from "@/lib/navigation"

export const WORKFLOW_ICONS: Record<
  WorkflowId,
  ComponentType<{ className?: string }>
> = {
  "command-center": LayoutDashboard,
  investigations: Search,
  analyses: BarChart3,
  documentation: FileText,
  monitoring: Activity,
  "data-sources": Database,
  "audit-history": History,
  organization: Users,
  settings: Settings,
}
