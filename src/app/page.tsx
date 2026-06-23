"use client"

import { useState, useEffect, useCallback } from "react"
import { AppShell } from "@/components/shell/AppShell"
import { getInvestigationIdForFinding } from "@/data/mockData"
import { WORKFLOW_KEYS, type NavigateOptions, type WorkflowId } from "@/lib/navigation"
import { supabase } from "@/lib/supabaseClient"
import LoginCardSection from "@/components/ui/login-signup"
import { OnboardingPage } from "@/views/OnboardingPage"
import { CommandCenterPage } from "@/views/workflows/CommandCenterPage"
import { InvestigationsPage } from "@/views/workflows/InvestigationsPage"
import { AnalysesPage } from "@/views/workflows/AnalysesPage"
import { DocumentationPage } from "@/views/workflows/DocumentationPage"
import { MonitoringPage } from "@/views/workflows/MonitoringPage"
import { DataSourcesPage } from "@/views/workflows/DataSourcesPage"
import { AuditHistoryPage } from "@/views/workflows/AuditHistoryPage"
import { OrganizationPage } from "@/views/workflows/OrganizationPage"
import { SettingsPage } from "@/views/workflows/SettingsPage"
const skipAuth = process.env.NEXT_PUBLIC_SKIP_AUTH === "true"

function WorkflowView({
  workflow,
  onNavigate,
  selectedInvestigationId,
}: {
  workflow: WorkflowId
  onNavigate: (id: WorkflowId, options?: NavigateOptions) => void
  selectedInvestigationId: string | null
}) {
  switch (workflow) {
    case "command-center":
      return <CommandCenterPage onNavigate={onNavigate} />
    case "investigations":
      return (
        <InvestigationsPage
          key={selectedInvestigationId ?? "default"}
          initialInvestigationId={selectedInvestigationId}
        />
      )
    case "analyses":
      return <AnalysesPage onNavigate={onNavigate} />
    case "documentation":
      return <DocumentationPage />
    case "monitoring":
      return <MonitoringPage onNavigate={onNavigate} />
    case "data-sources":
      return <DataSourcesPage />
    case "audit-history":
      return <AuditHistoryPage onNavigate={onNavigate} />
    case "organization":
      return <OrganizationPage />
    case "settings":
      return <SettingsPage />
    default:
      return <CommandCenterPage onNavigate={onNavigate} />
  }
}

export default function NextApp() {
  const [mounted, setMounted] = useState(false)
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowId>("command-center")
  const [selectedInvestigationId, setSelectedInvestigationId] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(skipAuth)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const handleNavigate = useCallback((id: WorkflowId, options?: NavigateOptions) => {
    setActiveWorkflow(id)
    if (id === "investigations") {
      const investigationId =
        options?.investigationId ??
        (options?.findingId ? getInvestigationIdForFinding(options.findingId) : undefined)
      setSelectedInvestigationId(investigationId ?? null)
    } else {
      setSelectedInvestigationId(null)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    if (skipAuth) return

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true)
      } else if (typeof window !== "undefined" && localStorage.getItem("avarent_auth") === "demo") {
        setIsAuthenticated(true)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
    if (e.metaKey || e.ctrlKey || e.altKey) return
    const workflow = WORKFLOW_KEYS[e.key]
    if (workflow) handleNavigate(workflow)
  }, [handleNavigate])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  const handleLogout = async () => {
    if (!skipAuth) {
      await supabase.auth.signOut()
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("avarent_auth")
    }
    setIsAuthenticated(false)
  }

  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
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
    <AppShell
      activeWorkflow={activeWorkflow}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      <WorkflowView
        workflow={activeWorkflow}
        onNavigate={handleNavigate}
        selectedInvestigationId={selectedInvestigationId}
      />
    </AppShell>
  )
}
