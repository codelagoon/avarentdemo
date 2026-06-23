"use client"

import { useEffect, useState } from "react"
import {
  Bell,
  ChevronDown,
  LogOut,
  MoreHorizontal,
  Settings,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar"
import { AvarentLogo } from "@/components/AvarentLogo"
import { WORKFLOW_ICONS } from "@/components/shell/nav-shared"
import { cn } from "@/lib/utils"
import {
  PRIMARY_NAV,
  SECONDARY_NAV,
  type NavItem,
  type NavigateOptions,
  type WorkflowId,
} from "@/lib/navigation"
import type { MembershipRole } from "@/lib/identity/types"
import { DAILY_STATS } from "@/data/mockData"

interface FloatingNavProps {
  activeWorkflow: WorkflowId
  onNavigate: (id: WorkflowId, options?: NavigateOptions) => void
  onLogout?: () => void
  organizationName?: string | null
  membershipRole?: MembershipRole | null
}

const SECONDARY_WORKFLOW_IDS = new Set(SECONDARY_NAV.map((item) => item.id))

function NavItemButton({
  item,
  active,
  onClick,
}: {
  item: NavItem
  active: boolean
  onClick: () => void
}) {
  const Icon = WORKFLOW_ICONS[item.id]

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      title={item.label}
      data-testid={`nav-${item.id}`}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-lg outline-none transition-colors",
        "focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {item.badge && item.badge > 0 ? (
        <Badge
          variant="destructive"
          className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[0.6rem]"
        >
          {item.badge}
        </Badge>
      ) : null}
    </button>
  )
}

export function FloatingNav({
  activeWorkflow,
  onNavigate,
  onLogout,
  organizationName,
  membershipRole,
}: FloatingNavProps) {
  const isSecondaryActive = SECONDARY_WORKFLOW_IDS.has(activeWorkflow)
  const [moreOpen, setMoreOpen] = useState(isSecondaryActive)

  useEffect(() => {
    if (isSecondaryActive) {
      setMoreOpen(true)
    }
  }, [isSecondaryActive])

  return (
    <aside
      className="flex shrink-0 self-stretch py-5 pl-3 pr-2"
      data-testid="sidebar"
      aria-label="Main navigation"
    >
      <Menubar className="flex h-full max-h-[calc(100vh-2.5rem)] w-12 flex-col rounded-[1.75rem] border border-border bg-card px-2 py-4 shadow-lg">
        <div className="flex flex-col gap-1.5">
          <div className="mb-1 flex items-center justify-center border-b border-border pb-3">
            <AvarentLogo className="h-7 w-7" />
          </div>

          {PRIMARY_NAV.map((item) => (
            <NavItemButton
              key={item.id}
              item={item}
              active={activeWorkflow === item.id}
              onClick={() => onNavigate(item.id)}
            />
          ))}

          <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                aria-label="More"
                aria-expanded={moreOpen}
                title="More"
                data-testid="nav-more"
                className={cn(
                  "relative flex h-11 w-10 flex-col items-center justify-center gap-0 rounded-lg outline-none transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-ring",
                  moreOpen || isSecondaryActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                <MoreHorizontal className="size-4 shrink-0" aria-hidden="true" />
                <ChevronDown
                  className={cn(
                    "size-3 shrink-0 text-muted-foreground transition-transform duration-200",
                    moreOpen && "rotate-180",
                    (moreOpen || isSecondaryActive) && "text-accent-foreground"
                  )}
                  aria-hidden="true"
                />
                {!moreOpen && isSecondaryActive ? (
                  <span
                    className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary ring-2 ring-card"
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="flex flex-col gap-1.5 overflow-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0">
              {SECONDARY_NAV.map((item) => (
                <NavItemButton
                  key={item.id}
                  item={item}
                  active={activeWorkflow === item.id}
                  onClick={() => onNavigate(item.id)}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="mt-auto flex flex-col gap-1.5 pt-3">
          <div className="mb-1 h-px w-full bg-border" />

          <MenubarMenu>
            <MenubarTrigger
              className="relative flex h-10 w-10 items-center justify-center rounded-lg"
              aria-label={`Notifications, ${DAILY_STATS.openIncidents} open`}
            >
              <Bell className="size-4" />
              {DAILY_STATS.openIncidents > 0 ? (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full p-0 text-[0.6rem]"
                >
                  {DAILY_STATS.openIncidents}
                </Badge>
              ) : null}
            </MenubarTrigger>
            <MenubarContent align="start" side="right" sideOffset={12} className="w-56">
              <MenubarItem onClick={() => onNavigate("monitoring")}>
                View monitoring alerts
              </MenubarItem>
              <MenubarItem disabled>
                {DAILY_STATS.modelVersion} · {DAILY_STATS.openIncidents} open
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger
              className="flex h-10 w-10 items-center justify-center rounded-lg px-0 py-0"
              aria-label="Account menu"
            >
              <Avatar className="size-8">
                <AvatarFallback className="g-text-caption bg-primary text-primary-foreground">
                  SC
                </AvatarFallback>
              </Avatar>
            </MenubarTrigger>
          <MenubarContent align="start" side="right" sideOffset={12} className="w-52">
            <MenubarItem disabled className="font-medium">
              {organizationName ?? "Meridian"}
            </MenubarItem>
            {membershipRole ? (
              <MenubarItem disabled className="text-xs text-muted-foreground">
                Role: {membershipRole}
              </MenubarItem>
            ) : null}
            <MenubarSeparator />
            <MenubarItem
              className={cn(
                "gap-2",
                activeWorkflow === "organization" &&
                  "bg-accent font-medium text-accent-foreground"
              )}
              onClick={() => onNavigate("organization")}
              aria-current={activeWorkflow === "organization" ? "page" : undefined}
            >
              <Users className="size-4" />
              Organization
            </MenubarItem>
            <MenubarItem
              className={cn(
                "gap-2",
                activeWorkflow === "settings" &&
                  "bg-accent font-medium text-accent-foreground"
              )}
              onClick={() => onNavigate("settings")}
              aria-current={activeWorkflow === "settings" ? "page" : undefined}
            >
              <Settings className="size-4" />
              Settings
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem
              className="gap-2 text-destructive focus:text-destructive"
              onClick={onLogout}
            >
              <LogOut className="size-4" />
              Log out
            </MenubarItem>
          </MenubarContent>
          </MenubarMenu>
        </div>
      </Menubar>
    </aside>
  )
}
