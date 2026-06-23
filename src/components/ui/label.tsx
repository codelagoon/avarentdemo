import * as React from "react"
import { Label as GravityLabel } from "@gravity-ui/uikit"
import { cn } from "@/lib/utils"

function Label({
  className,
  ...props
}: React.ComponentProps<"label">) {
  return (
    <GravityLabel
      data-slot="label"
      className={cn("g-text-subheader select-none", className)}
      {...props}
    />
  )
}

export { Label }
