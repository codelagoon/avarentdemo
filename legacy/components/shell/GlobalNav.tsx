"use client"

import { Icon, Label } from "@gravity-ui/uikit"
import {
  Bell,
  CircleInfo,
  Ellipsis,
  Gear,
  ArrowRightFromSquare,
  Persons,
} from "@gravity-ui/icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AvarentLogo } from "@/components/AvarentLogo"
import { cn } from "@/lib/utils"
import {
  PRIMARY_NAV,
  SECONDARY_NAV,
  type WorkflowId,
  type NavItem,
} from "@/lib/navigation"
import { DAILY_STATS } from "@/data/mockData"

interface GlobalNavProps {
  activeWorkflow: WorkflowId
  onNavigate: (id: WorkflowId) => void
  onLogout?: () => void
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: NavItem
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`nav-${item.id}`}
      className={cn(
        "relative flex items-center gap-2 rounded-md px-3 py-1.5 g-text-body-1 transition-colors",
        active
          ? "bg-[var(--g-color-base-selection)] text-foreground"
          : "text-muted-foreground hover:bg-[var(--g-color-base-simple-hover)] hover:text-foreground"
      )}
    >
      <Icon data={item.icon} size={14} />
      <span>{item.label}</span>
      {item.badge && item.badge > 0 ? (
        <Label theme="danger" size="xs">
          {item.badge}
        </Label>
      ) : null}
    </button>
  )
}

export function GlobalNav({ activeWorkflow, onNavigate, onLogout }: GlobalNavProps) {
  return (
    <nav
      data-testid="sidebar"
      className="flex h-12 shrink-0 items-center gap-4 border-b border-border bg-background px-4"
    >
      <div className="flex min-w-0 items-center">
        <AvarentLogo className="h-7 w-7" />
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {PRIMARY_NAV.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            active={activeWorkflow === item.id}
            onClick={() => onNavigate(item.id)}
          />
        ))}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              <Ellipsis className="h-4 w-4" />
              <span className="hidden sm:inline">More</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            {SECONDARY_NAV.map((item) => (
              <DropdownMenuItem
                key={item.id}
                className="gap-2"
                onClick={() => onNavigate(item.id)}
                data-testid={`nav-${item.id}`}
              >
                <Icon data={item.icon} size={14} />
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <div className="hidden items-center gap-2 rounded-md bg-secondary px-2 py-1 lg:flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--g-color-base-positive-heavy)]" />
          <span className="g-text-caption font-mono text-muted-foreground">
            {DAILY_STATS.modelVersion}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Bell className="h-4 w-4" />
              {DAILY_STATS.openIncidents > 0 ? (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full p-0 text-[0.6rem]"
                >
                  {DAILY_STATS.openIncidents}
                </Badge>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Monitoring alerts</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onNavigate("monitoring")}>
              View all alerts
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <CircleInfo className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 gap-2 px-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="g-text-caption bg-primary text-primary-foreground">
                  SC
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Sarah M. Chen</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2" onClick={() => onNavigate("organization")}>
              <Persons className="h-3.5 w-3.5" />
              Organization
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2" onClick={() => onNavigate("settings")}>
              <Gear className="h-3.5 w-3.5" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-destructive" onClick={onLogout}>
              <ArrowRightFromSquare className="h-3.5 w-3.5" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
