"use client"

import { useCallback, useEffect, useState } from "react"
import dynamic from "next/dynamic"
import posthog from "posthog-js"
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

function DashboardLoading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}

const CommandCenterPage = dynamic(
  () =>
    import("@/views/workflows/CommandCenterPage").then((m) => ({
      default: m.CommandCenterPage,
    })),
  { loading: DashboardLoading }
)
const InvestigationsPage = dynamic(
  () =>
    import("@/views/workflows/InvestigationsPage").then((m) => ({
      default: m.InvestigationsPage,
    })),
  { loading: DashboardLoading }
)
const AnalysesPage = dynamic(
  () =>
    import("@/views/workflows/AnalysesPage").then((m) => ({
      default: m.AnalysesPage,
    })),
  { loading: DashboardLoading }
)
const DocumentationPage = dynamic(
  () =>
    import("@/views/workflows/DocumentationPage").then((m) => ({
      default: m.DocumentationPage,
    })),
  { loading: DashboardLoading }
)
const MonitoringPage = dynamic(
  () =>
    import("@/views/workflows/MonitoringPage").then((m) => ({
      default: m.MonitoringPage,
    })),
  { loading: DashboardLoading }
)
const DataSourcesPage = dynamic(
  () =>
    import("@/views/workflows/DataSourcesPage").then((m) => ({
      default: m.DataSourcesPage,
    })),
  { loading: DashboardLoading }
)
const AuditHistoryPage = dynamic(
  () =>
    import("@/views/workflows/AuditHistoryPage").then((m) => ({
      default: m.AuditHistoryPage,
    })),
  { loading: DashboardLoading }
)
const OrganizationPage = dynamic(
  () =>
    import("@/views/workflows/OrganizationPage").then((m) => ({
      default: m.OrganizationPage,
    })),
  { loading: DashboardLoading }
)
const SettingsPage = dynamic(
  () =>
    import("@/views/workflows/SettingsPage").then((m) => ({
      default: m.SettingsPage,
    })),
  { loading: DashboardLoading }
)

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
  const [workosEnabled, setWorkosEnabled] = useState(false)
  const [authStatusLoaded, setAuthStatusLoaded] = useState(false)

  const refreshIdentity = useCallback(async () => {
    const delays = [0, 150, 350, 700]

    for (const delay of delays) {
      if (delay > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, delay))
      }

      try {
        const response = await fetch("/api/identity/context", { cache: "no-store" })
        if (!response.ok) continue

        const data = (await response.json()) as ApplicationContext
        setIdentity({ ...data, is_loading: false })
        setIdentityLoaded(true)
        return
      } catch {
        // Retry while Supabase session cookies propagate to the server.
      }
    }

    setIdentity({ ...EMPTY_APPLICATION_CONTEXT, is_loading: false })
    setIdentityLoaded(true)
  }, [])

  useEffect(() => {
    setMounted(true)
    void refreshIdentity()
    void fetch("/api/auth/status")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { workos_enabled?: boolean } | null) => {
        setWorkosEnabled(Boolean(data?.workos_enabled))
      })
      .catch(() => setWorkosEnabled(false))
      .finally(() => setAuthStatusLoaded(true))
  }, [refreshIdentity])

  const hasLinkedSession = Boolean(identity.user_id)
  const hasWorkOSSession = Boolean(identity.workos_user_id)
  const isSignedIn = hasLinkedSession || hasWorkOSSession

  useEffect(() => {
    if (!mounted || !identityLoaded || hasLinkedSession || !hasWorkOSSession) return
    const timer = window.setInterval(() => {
      void refreshIdentity()
    }, 2000)
    return () => window.clearInterval(timer)
  }, [mounted, identityLoaded, hasLinkedSession, hasWorkOSSession, refreshIdentity])

  const handleNavigate = useCallback((id: WorkflowId, options?: NavigateOptions) => {
    setActiveWorkflow(id)
    posthog.capture("workflow_navigated", { workflow: id })
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
      if (!hasLinkedSession || identity.needs_onboarding) return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const workflow = WORKFLOW_KEYS[e.key]
      if (workflow) handleNavigate(workflow)
    },
    [handleNavigate, identity.needs_onboarding, hasLinkedSession]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  const handleLogout = () => {
    window.location.href = "/api/auth/signout"
  }

  if (!mounted || !identityLoaded || !authStatusLoaded) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (identity.needs_onboarding && isSignedIn) {
    return (
      <OnboardingPage
        userEmail={identity.email}
        onComplete={async () => {
          await refreshIdentity()
        }}
      />
    )
  }

  if (!hasLinkedSession) {
    if (workosEnabled && hasWorkOSSession) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Linking your account…</p>
        </div>
      )
    }

    return (
      <LoginCardSection
        workosEnabled={workosEnabled}
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
