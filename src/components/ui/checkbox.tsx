"use client"

import * as React from "react"
import { Checkbox as GravityCheckbox } from "@gravity-ui/uikit"
import { cn } from "@/lib/utils"

function Checkbox({
  className,
  checked,
  onCheckedChange,
  ...props
}: React.ComponentProps<"button"> & {
  checked?: boolean
  onCheckedChange?: (checked: boolean | "indeterminate") => void
}) {
  return (
    <GravityCheckbox
      data-slot="checkbox"
      className={cn(className)}
      checked={checked === "indeterminate" ? "indeterminate" : Boolean(checked)}
      onUpdate={(value) => onCheckedChange?.(value)}
      {...props}
    />
  )
}

export { Checkbox }
