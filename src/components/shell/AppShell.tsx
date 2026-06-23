"use client"

import { FloatingNav } from "@/components/shell/FloatingNav"
import { Workspace } from "@/components/shell/Workspace"
import type { NavigateOptions, WorkflowId } from "@/lib/navigation"

interface AppShellProps {
  activeWorkflow: WorkflowId
  onNavigate: (id: WorkflowId, options?: NavigateOptions) => void
  onLogout?: () => void
  children: React.ReactNode
}

export function AppShell({
  activeWorkflow,
  onNavigate,
  onLogout,
  children,
}: AppShellProps) {
  return (
    <div
      className="relative flex h-screen w-screen flex-row overflow-hidden bg-background"
      data-testid="sentinel-app"
    >
      <FloatingNav
        activeWorkflow={activeWorkflow}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <Workspace className="min-w-0 flex-1">{children}</Workspace>
    </div>
  )
}
