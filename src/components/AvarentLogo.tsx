import * as React from "react"
import { cn } from "@/lib/utils"

export interface AvarentLogoProps {
  className?: string
  title?: string
}

/** Avarent geometric orange mark — icon-only, matches brand logo artwork. */
export function AvarentLogo({ className, title = "Meridian" }: AvarentLogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={title}
      className={cn("shrink-0", className)}
      fill="#C4601E"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M50 15 L86 78 H67 L50 48 L33 78 H14 L50 15 Z M50 37 L59 53 H41 L50 37 Z" />
      <path d="M48 68 L60 78 H42 L34 68 H48 Z" opacity="0.9" />
    </svg>
  )
}
