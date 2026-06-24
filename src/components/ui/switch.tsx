import * as React from "react"
import { Switch as GravitySwitch } from "@gravity-ui/uikit"
import { cn } from "@/lib/utils"

function Switch({
  className,
  checked,
  onCheckedChange,
  ...props
}: React.ComponentProps<"button"> & {
  size?: "sm" | "default"
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}) {
  return (
    <GravitySwitch
      data-slot="switch"
      className={cn(className)}
      checked={checked}
      onUpdate={(value) => onCheckedChange?.(value)}
      {...props}
    />
  )
}

export { Switch }
