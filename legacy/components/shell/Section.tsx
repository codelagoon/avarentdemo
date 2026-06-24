import { cn } from "@/lib/utils"

interface SectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  fill?: boolean
}

export function Section({ title, description, children, className, fill }: SectionProps) {
  return (
    <section
      className={cn(
        "flex min-h-0 flex-col gap-1.5",
        fill && "min-h-0 flex-1 overflow-hidden",
        className
      )}
    >
      <div className="shrink-0">
        <h2 className="g-text-caption font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
        {description ? (
          <p className="g-text-caption truncate text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className={cn(fill && "min-h-0 flex-1 overflow-hidden")}>{children}</div>
    </section>
  )
}
