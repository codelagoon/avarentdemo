"use client"

import { useCallback, useEffect, useState } from "react"
import { AppShell } from "@/components/shell/AppShell"
import { IdentityProvider } from "@/contexts/IdentityContext"
import { getInvestigationIdForFinding } from "@/domains/investigations/investigationDomain"
import {
  EMPTY_APPLICATION_CONTEXT,
  type ApplicationContext,
} from "@/lib/identity/types"
import { WORKFLOW_KEYS, type NavigateOptions, type WorkflowId } from "@/lib/navigation"
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
  const [identity, setIdentity] = useState<ApplicationContext>(EMPTY_APPLICATION_CONTEXT)
  const [identityLoaded, setIdentityLoaded] = useState(false)

  const refreshIdentity = useCallback(async () => {
    try {
      const response = await fetch("/api/identity/context")
      if (!response.ok) {
        setIdentity({ ...EMPTY_APPLICATION_CONTEXT, is_loading: false })
        return
      }
      const data = (await response.json()) as ApplicationContext
      setIdentity({ ...data, is_loading: false })
    } catch {
      setIdentity({ ...EMPTY_APPLICATION_CONTEXT, is_loading: false })
    } finally {
      setIdentityLoaded(true)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    void refreshIdentity()
  }, [refreshIdentity])

  const isAuthenticated = Boolean(identity.user_id || identity.workos_user_id)

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

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isAuthenticated || identity.needs_onboarding) return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const workflow = WORKFLOW_KEYS[e.key]
      if (workflow) handleNavigate(workflow)
    },
    [handleNavigate, identity.needs_onboarding, isAuthenticated]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  const handleLogout = () => {
    window.location.href = "/api/auth/signout"
  }

  if (!mounted || !identityLoaded) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (identity.needs_onboarding && isAuthenticated) {
    return (
      <OnboardingPage
        userEmail={identity.email}
        onComplete={async () => {
          await refreshIdentity()
        }}
      />
    )
  }

  if (!isAuthenticated) {
    return (
      <LoginCardSection
        onLogin={() => {
          void refreshIdentity()
        }}
        onRegisterComplete={() => {
          void refreshIdentity()
        }}
      />
    )
  }

  return (
    <IdentityProvider initialContext={identity}>
      <AppShell
        activeWorkflow={activeWorkflow}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        organizationName={identity.organization_name}
        membershipRole={identity.role}
      >
        <WorkflowView
          workflow={activeWorkflow}
          onNavigate={handleNavigate}
          selectedInvestigationId={selectedInvestigationId}
        />
      </AppShell>
    </IdentityProvider>
  )
}
