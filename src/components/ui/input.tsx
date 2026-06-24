import * as React from "react"
import { TextInput, type TextInputProps } from "@gravity-ui/uikit"
import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  onChange,
  onUpdate,
  ...props
}: React.ComponentProps<"input"> & TextInputProps) {
  return (
    <TextInput
      type={type as TextInputProps["type"]}
      className={cn(className)}
      onUpdate={onUpdate ?? ((value) => onChange?.({ target: { value } } as React.ChangeEvent<HTMLInputElement>))}
      {...props}
    />
  )
}

export { Input }
