import * as React from "react"
import { cn } from "@/lib/utils"

export function AvarentLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("text-primary", className)}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 
        High-fidelity geometric drawing of Avarent's stylized modern orange 'A' triangle logo.
        Uses clean coordinates for sharp rendering.
      */}
      <path
        d="M50 15 L86 78 H67 L50 48 L33 78 H14 L50 15 Z M50 37 L59 53 H41 L50 37 Z"
        fill="currentColor"
      />
      {/* The bottom folded dynamic overlap notch characteristic of the Avarent brand mark */}
      <path
        d="M48 68 L60 78 H42 L34 68 H48 Z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  )
}
