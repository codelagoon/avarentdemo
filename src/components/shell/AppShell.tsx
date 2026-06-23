"use client"

import { FloatingNav } from "@/components/shell/FloatingNav"
import { Workspace } from "@/components/shell/Workspace"
import type { MembershipRole } from "@/lib/identity/types"
import type { NavigateOptions, WorkflowId } from "@/lib/navigation"

interface AppShellProps {
  activeWorkflow: WorkflowId
  onNavigate: (id: WorkflowId, options?: NavigateOptions) => void
  onLogout?: () => void
  organizationName?: string | null
  membershipRole?: MembershipRole | null
  children: React.ReactNode
}

export function AppShell({
  activeWorkflow,
  onNavigate,
  onLogout,
  organizationName,
  membershipRole,
  children,
}: AppShellProps) {
  return (
    <div
      className="relative flex h-screen w-screen flex-row overflow-hidden bg-background"
      data-testid="sentinel-app"
      data-organization={organizationName ?? undefined}
      data-role={membershipRole ?? undefined}
    >
      <FloatingNav
        activeWorkflow={activeWorkflow}
        onNavigate={onNavigate}
        onLogout={onLogout}
        organizationName={organizationName}
        membershipRole={membershipRole}
      />

      <Workspace className="min-w-0 flex-1">{children}</Workspace>
    </div>
  )
}
