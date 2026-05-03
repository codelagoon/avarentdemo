import { useState, useEffect, useCallback } from "react"
import { LayoutDashboard, ShieldAlert, BookOpen, ChartBar as BarChart3, Users, Settings, Bell, ChevronRight, PanelLeft, Lock, Shield, Building2, ArrowRight } from "lucide-react"
import { Toaster } from "@/components/ui/sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { DAILY_STATS } from "@/data/mockData"
import { companyService } from "@/services/companyService"

const PASSWORD = "197704"

import { DashboardPage } from "@/pages/DashboardPage"
import { ThreatAnalysisPage } from "@/pages/ThreatAnalysisPage"
import { EvidenceLedgerPage } from "@/pages/EvidenceLedgerPage"
import { AnalyticsPage } from "@/pages/AnalyticsPage"
import { AccessControlPage } from "@/pages/AccessControlPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { OnboardingPage } from "@/pages/OnboardingPage"

export type Page = "dashboard" | "threats" | "ledger" | "analytics" | "access" | "settings"

const NAV_ITEMS: { id: Page; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
  { id: "dashboard", label: "Operational Dashboard", icon: LayoutDashboard },
  { id: "threats", label: "Threat Analysis", icon: ShieldAlert, badge: 3 },
  { id: "ledger", label: "Evidence Ledger", icon: BookOpen },
  { id: "analytics", label: "Analytics & Fairness", icon: BarChart3 },
  { id: "access", label: "Access Control", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
]

const PAGE_KEYS: Record<string, Page> = {
  "1": "dashboard",
  "2": "threats",
  "3": "ledger",
  "4": "analytics",
  "5": "access",
  "6": "settings",
}

function SentinelLogo() {
  return (
    <div className="flex flex-col leading-none">
      <span className="text-sm font-bold tracking-wide text-gray-900">
        AVARENT
      </span>
      <span className="text-[0.625rem] font-medium tracking-widest uppercase text-gray-500">
        Sentinel
      </span>
    </div>
  )
}

function TopBar({ activePage }: { activePage: Page }) {
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const timeStr = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
  const dateStr = time.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" })
  void activePage
  return (
    <header
      className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-6"
      data-testid="topbar"
    >
      <div>
        <p className="text-sm font-bold text-foreground">
          Sentinel Command Center{" "}
          <span className="font-mono text-xs font-normal text-muted-foreground">v2.4.1</span>
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-mono text-xs text-muted-foreground">{dateStr}</p>
          <p className="font-mono text-xs font-medium text-foreground">{timeStr}</p>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button className="relative rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <Bell className="h-4 w-4" />
              {DAILY_STATS.openIncidents > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-destructive text-[0.5rem] font-bold text-white">
                  {DAILY_STATS.openIncidents}
                </span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>{DAILY_STATS.openIncidents} open incidents</TooltipContent>
        </Tooltip>

        <div className="flex items-center gap-2.5 rounded-lg border bg-secondary/40 px-3 py-1.5">
          <Avatar size="sm">
            <AvatarFallback className="bg-primary text-primary-foreground" style={{ fontSize: "0.65rem" }}>
              SC
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs font-semibold text-foreground">Sarah M. Chen</p>
            <p className="text-muted-foreground" style={{ fontSize: "0.65rem" }}>Chief Compliance Officer</p>
          </div>
        </div>
      </div>
    </header>
  )
}

function LoginScreen({ onLogin, onTryNewCompany }: { onLogin: () => void; onTryNewCompany: () => void }) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === PASSWORD) {
      onLogin()
    } else {
      setError(true)
      setTimeout(() => setError(false), 2000)
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="w-full max-w-md space-y-4">
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl font-bold">AVARENT Sentinel</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Compliance & Risk Management Platform</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Enter Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter access code"
                  className={cn(error && "border-destructive focus-visible:ring-destructive")}
                  autoFocus
                />
                {error && (
                  <p className="text-xs text-destructive">Incorrect password. Please try again.</p>
                )}
              </div>
              <Button type="submit" className="w-full">
                Access Dashboard
              </Button>
            </form>
            <div className="mt-6 rounded-md bg-secondary/50 p-3 text-center">
              <p className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">Authorized Access Only</p>
              <p className="text-[0.6rem] text-muted-foreground/70 mt-0.5">CFPB Compliant • OCC Regulated</p>
            </div>
          </CardContent>
        </Card>

        {/* Try as New Company Option */}
        <Card className="shadow-lg border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">New to AVARENT?</p>
                <p className="text-xs text-muted-foreground">Try it out as a new company</p>
              </div>
              <Button variant="outline" size="sm" onClick={onTryNewCompany} className="gap-1">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function App() {
  const [activePage, setActivePage] = useState<Page>("dashboard")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

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

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    setIsAuthenticated(true)
  }

  // Show onboarding flow
  if (showOnboarding) {
    return <OnboardingPage onComplete={handleOnboardingComplete} />
  }

  // Check if company exists and onboarding is complete
  const onboardingComplete = companyService.isOnboardingComplete()

  if (!isAuthenticated && !onboardingComplete) {
    return (
      <LoginScreen
        onLogin={() => setIsAuthenticated(true)}
        onTryNewCompany={() => setShowOnboarding(true)}
      />
    )
  }

  if (!isAuthenticated && onboardingComplete) {
    return (
      <LoginScreen
        onLogin={() => setIsAuthenticated(true)}
        onTryNewCompany={() => setShowOnboarding(true)}
      />
    )
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-background" data-testid="sentinel-app">
        {/* Sidebar */}
        <aside
          className={cn(
            "flex h-full shrink-0 flex-col bg-white shadow-2xl z-20 transition-all duration-300",
            sidebarCollapsed ? "w-14" : "w-60"
          )}
          data-testid="sidebar"
        >
          <div
            className={cn(
              "flex h-14 shrink-0 items-center border-b border-gray-200 px-3",
              sidebarCollapsed ? "justify-center" : "justify-between"
            )}
          >
            {!sidebarCollapsed && <SentinelLogo />}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <PanelLeft className={cn("h-4 w-4 transition-transform", sidebarCollapsed && "rotate-180")} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-2 py-3" data-testid="sidebar-nav">
            {!sidebarCollapsed && (
              <p className="mb-2 px-2 text-[0.625rem] font-semibold uppercase tracking-widest text-gray-500">
                Navigation
              </p>
            )}
            {NAV_ITEMS.map((item, idx) => {
              const isActive = activePage === item.id
              return (
                <Tooltip key={item.id} delayDuration={800}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActivePage(item.id)}
                      data-testid={`nav-${item.id}`}
                      className={cn(
                        "group relative mb-0.5 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-gray-700 transition-all duration-150",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-gray-100"
                      )}
                    >
                      <span className={cn("flex shrink-0 items-center justify-center", isActive ? "text-primary" : "text-gray-500", sidebarCollapsed ? "h-6 w-6" : "h-4 w-4")}>
                        <item.icon className={cn(sidebarCollapsed ? "h-5 w-5" : "h-4 w-4")} />
                      </span>
                      {!sidebarCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                      {item.badge && item.badge > 0 && !sidebarCollapsed && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[0.6rem] font-bold text-destructive-foreground">
                          {item.badge}
                        </span>
                      )}
                      {item.badge && item.badge > 0 && sidebarCollapsed && (
                        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
                      )}
                      {isActive && !sidebarCollapsed && (
                        <ChevronRight className="h-3 w-3 text-primary" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {item.label} <span className="ml-1 opacity-50">({idx + 1})</span>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </nav>

          <div className="shrink-0 border-t border-gray-200 p-3">
            {!sidebarCollapsed && (
              <>
                <div className="mb-2 flex items-center gap-2 rounded-md bg-gray-100 px-2 py-1.5">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  <span className="font-mono text-[0.65rem] text-gray-500">
                    {DAILY_STATS.modelVersion}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-1">
                  <Avatar size="sm">
                    <AvatarFallback
                      className="bg-primary text-white"
                      style={{ fontSize: "0.65rem" }}
                    >
                      SC
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-gray-700">
                      S. Chen
                    </p>
                    <p className="truncate text-[0.65rem] text-gray-500">
                      Chief Compliance
                    </p>
                  </div>
                </div>
              </>
            )}
            {sidebarCollapsed && (
              <div className="flex justify-center">
                <Avatar size="sm">
                  <AvatarFallback
                    className="bg-primary text-white"
                    style={{ fontSize: "0.65rem" }}
                  >
                    SC
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>
        </aside>

        {/* Main */}
        <div className="flex h-full flex-1 flex-col overflow-hidden">
          <TopBar activePage={activePage} />
          <main className="flex-1 overflow-auto" data-testid="main-content">
            {activePage === "dashboard" && <DashboardPage />}
            {activePage === "threats" && <ThreatAnalysisPage />}
            {activePage === "ledger" && <EvidenceLedgerPage />}
            {activePage === "analytics" && <AnalyticsPage />}
            {activePage === "access" && <AccessControlPage />}
            {activePage === "settings" && <SettingsPage />}
          </main>
        </div>
      </div>
      <Toaster position="top-right" richColors />
    </TooltipProvider>
  )
}
