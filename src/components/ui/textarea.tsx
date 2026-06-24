import * as React from "react"
import { TextArea, type TextAreaProps } from "@gravity-ui/uikit"
import { cn } from "@/lib/utils"

function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  const gravityProps: TextAreaProps = {
    className: cn(className),
    ...props,
  }

  return <TextArea {...gravityProps} />
}

export { Textarea }
