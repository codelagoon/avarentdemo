"use client"

import { useState, useEffect, useCallback } from "react"
import {
  LayoutDashboard,
  ShieldAlert,
  BookOpen,
  ChartBar as BarChart3,
  Users,
  Settings,
  Bell,
  Lock,
  Shield,
  Building2,
  ArrowRight,
  Scale,
  Database,
  Network,
  Info,
  HelpCircle,
  FileText,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { AvarentLogo } from "@/components/AvarentLogo"
import { DAILY_STATS } from "@/data/mockData"
import { ModeToggle } from "@/components/mode-toggle"
import { supabase } from "@/lib/supabaseClient"
import LoginCardSection from "@/components/ui/login-signup"

import { DashboardPage } from "@/views/DashboardPage"
import { ThreatAnalysisPage } from "@/views/ThreatAnalysisPage"
import { EvidenceLedgerPage } from "@/views/EvidenceLedgerPage"
import { AnalyticsPage } from "@/views/AnalyticsPage"
import { AccessControlPage } from "@/views/AccessControlPage"
import { SettingsPage } from "@/views/SettingsPage"
import { OnboardingPage } from "@/views/OnboardingPage"
import AdverseActionReviewPage from "@/views/AdverseActionReviewPage"
import { SyntheticDataStudioPage } from "@/views/SyntheticDataStudioPage"
import { AltDataHubPage } from "@/views/AltDataHubPage"

const PASSWORD = "197704"

export type Page = "dashboard" | "threats" | "ledger" | "analytics" | "adverse-action" | "synthetic-studio" | "alt-data" | "access" | "settings"

const NAV_ITEMS: { id: Page; label: string; short: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
  { id: "dashboard",        label: "Operational Dashboard",  short: "Dashboard", icon: LayoutDashboard },
  { id: "threats",          label: "Threat Analysis",        short: "Threats",   icon: ShieldAlert, badge: 3 },
  { id: "ledger",           label: "Evidence Ledger",        short: "Ledger",    icon: BookOpen },
  { id: "analytics",        label: "Analytics & Fairness",   short: "Analytics", icon: BarChart3 },
  { id: "adverse-action",   label: "Adverse Action Review",  short: "Adverse",   icon: Scale },
  { id: "synthetic-studio", label: "Synthetic Data Studio",  short: "Synthetic", icon: Database },
  { id: "alt-data",         label: "Alternative Data Hub",   short: "Alt Data",  icon: Network },
  { id: "access",           label: "Access Control",         short: "Access",    icon: Users },
  { id: "settings",         label: "Settings",               short: "Settings",  icon: Settings },
]

const PAGE_KEYS: Record<string, Page> = {
  "1": "dashboard",
  "2": "threats",
  "3": "ledger",
  "4": "analytics",
  "5": "adverse-action",
  "6": "synthetic-studio",
  "7": "alt-data",
  "8": "access",
  "9": "settings",
}

function InfoMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Info className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Information</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 text-xs">
          <HelpCircle className="h-3.5 w-3.5" />Help Center
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 text-xs">
          <FileText className="h-3.5 w-3.5" />Documentation
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 text-xs">
          <Users className="h-3.5 w-3.5" />Community
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 text-xs">
          <Settings className="h-3.5 w-3.5" />System Status
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NotificationMenu() {
  const count = DAILY_STATS.openIncidents
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full p-0 text-[0.6rem]"
            >
              {count}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alerts</span>
          {count > 0 && <Badge variant="destructive" className="ml-2 text-[0.6rem]">{count} active</Badge>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex-col items-start gap-0.5 p-3">
          <div className="flex w-full items-center justify-between">
            <span className="text-xs font-semibold">Proxy Variable Detected</span>
            <span className="text-[0.65rem] text-muted-foreground">2m ago</span>
          </div>
          <span className="text-[0.68rem] text-muted-foreground">ZIP code flagged as disparate impact proxy</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex-col items-start gap-0.5 p-3">
          <div className="flex w-full items-center justify-between">
            <span className="text-xs font-semibold">Fairwashing Attempt Blocked</span>
            <span className="text-[0.65rem] text-muted-foreground">14m ago</span>
          </div>
          <span className="text-[0.68rem] text-muted-foreground">Model explanation discrepancy detected (KS=0.41)</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex-col items-start gap-0.5 p-3">
          <div className="flex w-full items-center justify-between">
            <span className="text-xs font-semibold">AIR Below CFPB Floor</span>
            <span className="text-[0.65rem] text-muted-foreground">1h ago</span>
          </div>
          <span className="text-[0.68rem] text-muted-foreground">Hispanic/Latino group AIR at 0.77 — intervention triggered</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center text-center text-xs font-medium text-primary">
          View all alerts
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SidebarUser({ onLogout }: { onLogout?: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-sidebar-accent/60">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="bg-primary text-[0.6rem] font-bold text-primary-foreground">SC</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.75rem] font-semibold leading-tight text-sidebar-foreground">Sarah M. Chen</p>
            <p className="truncate text-[0.62rem] leading-tight text-muted-foreground">Chief Compliance Officer</p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-[13.5rem]">
        <DropdownMenuLabel>
          <p className="text-sm font-semibold">Sarah M. Chen</p>
          <p className="text-[0.7rem] font-normal text-muted-foreground">Chief Compliance Officer</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 text-xs">
          <User className="h-3.5 w-3.5" />Profile
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 text-xs" onClick={() => {}}>
          <Settings className="h-3.5 w-3.5" />Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="gap-2 text-xs text-destructive focus:text-destructive">
          <LogOut className="h-3.5 w-3.5" />Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Sidebar({ activePage, onNavigate, onLogout }: {
  activePage: Page
  onNavigate: (p: Page) => void
  onLogout?: () => void
}) {
  return (
    <aside
      data-testid="sidebar"
      className="hidden h-full w-[15rem] shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex"
    >
      {/* Workspace header */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-sidebar-border/70 px-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 ring-1 ring-primary/20">
          <AvarentLogo className="h-4 w-4" />
        </div>
        <span className="flex-1 truncate text-sm font-semibold tracking-tight text-sidebar-foreground">Meridian</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <p className="px-2 pb-1.5 text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Workspace
        </p>
        <div className="space-y-0.5">
          {NAV_ITEMS.map(item => {
            const isActive = activePage === item.id
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                data-testid={`nav-${item.id}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[0.8rem] font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground"
                  )}
                />
                <span className="truncate">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span
                    className={cn(
                      "ml-auto rounded px-1.5 py-0.5 text-[0.6rem] font-semibold tabular-nums",
                      isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* User footer */}
      <div className="shrink-0 border-t border-sidebar-border/70 p-2">
        <SidebarUser onLogout={onLogout} />
      </div>
    </aside>
  )
}

function TopBar({ activePage }: { activePage: Page }) {
  const [time, setTime] = useState(() => new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const timeStr = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
  const active = NAV_ITEMS.find(i => i.id === activePage)

  return (
    <header
      className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4"
      data-testid="topbar"
    >
      {/* Left: breadcrumb / current view */}
      <div className="flex min-w-0 items-center gap-2">
        {active && <active.icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
        <span className="text-muted-foreground/70 text-[0.8rem]">Meridian</span>
        <span className="text-muted-foreground/40">/</span>
        <span className="truncate text-[0.8rem] font-semibold text-foreground">{active?.label ?? "Dashboard"}</span>
      </div>

      {/* Right: status + actions */}
      <div className="flex items-center gap-1.5">
        <div className="hidden items-center gap-1.5 rounded-md border border-border bg-secondary/60 px-2.5 py-1 lg:flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          <span className="font-mono text-[0.6rem] tracking-tight text-muted-foreground">{DAILY_STATS.modelVersion}</span>
          <span className="font-mono text-[0.6rem] text-muted-foreground/50">{timeStr}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <InfoMenu />
          <NotificationMenu />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}

export default function NextApp() {
  const [mounted, setMounted] = useState(false)
  const [activePage, setActivePage] = useState<Page>("dashboard")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Check active session on mount (Supabase real auth or demo bypass)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true)
      } else if (typeof window !== "undefined" && localStorage.getItem("avarent_auth") === "demo") {
        setIsAuthenticated(true)
      }
    })

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
    if (e.metaKey || e.ctrlKey || e.altKey) return
    const page = PAGE_KEYS[e.key]
    if (page) setActivePage(page)
  }, [])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    if (typeof window !== "undefined") {
      localStorage.removeItem("avarent_auth")
    }
    setIsAuthenticated(false)
  }

  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (showOnboarding) {
    return <OnboardingPage onComplete={() => { setShowOnboarding(false); setIsAuthenticated(true) }} />
  }

  if (!isAuthenticated) {
    return (
      <LoginCardSection
        onLogin={() => setIsAuthenticated(true)}
        onTryNewCompany={() => setShowOnboarding(true)}
      />
    )
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground" data-testid="sentinel-app">
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
          onLogout={handleLogout}
        />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <TopBar activePage={activePage} />
          <main className="flex-1 overflow-hidden" data-testid="main-content">
            {activePage === "dashboard"        && <DashboardPage />}
            {activePage === "threats"          && <ThreatAnalysisPage />}
            {activePage === "ledger"           && <EvidenceLedgerPage />}
            {activePage === "analytics"        && <AnalyticsPage />}
            {activePage === "adverse-action"   && <AdverseActionReviewPage />}
            {activePage === "synthetic-studio" && <SyntheticDataStudioPage />}
            {activePage === "alt-data"         && <AltDataHubPage />}
            {activePage === "access"           && <AccessControlPage />}
            {activePage === "settings"         && <SettingsPage />}
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
