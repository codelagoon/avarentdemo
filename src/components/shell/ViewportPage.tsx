import { cn } from "@/lib/utils"

interface ViewportPageProps {
  children: React.ReactNode
  className?: string
  testId?: string
}

/** Locks page content to the available workspace height — no page scroll. */
export function ViewportPage({ children, className, testId }: ViewportPageProps) {
  return (
    <div
      data-testid={testId}
      className={cn("flex h-full min-h-0 flex-col overflow-hidden", className)}
    >
      {children}
    </div>
  )
}
