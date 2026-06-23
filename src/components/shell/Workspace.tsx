import { cn } from "@/lib/utils"

interface WorkspaceProps {
  children: React.ReactNode
  className?: string
}

export function Workspace({ children, className }: WorkspaceProps) {
  return (
    <main
      data-testid="main-content"
      className={cn("flex min-h-0 flex-1 flex-col overflow-hidden bg-background", className)}
    >
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden px-6 py-3">
        {children}
      </div>
    </main>
  )
}
