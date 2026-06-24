import type { SVGIconData } from "@gravity-ui/uikit"
import {
  LayoutHeader,
  Magnifier,
  ChartBar,
  FileText,
  Pulse,
  Database,
  ClockArrowRotateLeft,
  Persons,
  Gear,
} from "@gravity-ui/icons"

export type WorkflowId =
  | "command-center"
  | "investigations"
  | "analyses"
  | "documentation"
  | "monitoring"
  | "data-sources"
  | "audit-history"
  | "organization"
  | "settings"

export interface NavigateOptions {
  findingId?: string
  investigationId?: string
}

export interface NavItem {
  id: WorkflowId
  label: string
  shortLabel?: string
  icon: SVGIconData
  description: string
  primaryAction?: string
  group: "primary" | "secondary"
  badge?: number
}

export const PRIMARY_NAV: NavItem[] = [
  {
    id: "command-center",
    label: "Command Center",
    shortLabel: "Home",
    icon: LayoutHeader,
    description: "Operational posture and priority response queue",
    primaryAction: "Review open incidents",
    group: "primary",
  },
  {
    id: "investigations",
    label: "Investigations",
    icon: Magnifier,
    description: "Findings, evidence, and resolution workflows",
    primaryAction: "Open next investigation",
    group: "primary",
    badge: 3,
  },
  {
    id: "analyses",
    label: "Analyses",
    icon: ChartBar,
    description: "Statistical analysis runs and readiness checks",
    primaryAction: "Start analysis",
    group: "primary",
  },
  {
    id: "documentation",
    label: "Documentation",
    icon: FileText,
    description: "Document review and approval queue",
    primaryAction: "Review pending documents",
    group: "primary",
  },
  {
    id: "monitoring",
    label: "Monitoring",
    icon: Pulse,
    description: "Live operational feed and emerging risks",
    primaryAction: "View active alerts",
    group: "primary",
    badge: 3,
  },
]

export const SECONDARY_NAV: NavItem[] = [
  {
    id: "data-sources",
    label: "Data Sources",
    icon: Database,
    description: "Connected feeds and variable screening",
    group: "secondary",
  },
  {
    id: "audit-history",
    label: "Audit History",
    icon: ClockArrowRotateLeft,
    description: "Immutable evidence ledger and audit trail",
    group: "secondary",
  },
  {
    id: "organization",
    label: "Organization",
    icon: Persons,
    description: "Access control and team permissions",
    group: "secondary",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Gear,
    description: "System configuration and preferences",
    group: "secondary",
  },
]

export const ALL_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV]

export function getNavItem(id: WorkflowId): NavItem {
  return ALL_NAV.find((item) => item.id === id) ?? PRIMARY_NAV[0]
}

export const WORKFLOW_KEYS: Record<string, WorkflowId> = {
  "1": "command-center",
  "2": "investigations",
  "3": "analyses",
  "4": "documentation",
  "5": "monitoring",
}
