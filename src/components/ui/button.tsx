import * as React from "react"
import {
  Button as GravityButton,
  type ButtonProps as GravityButtonProps,
  type ButtonSize,
  type ButtonView,
} from "@gravity-ui/uikit"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

type ShadcnVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link"

type ShadcnSize =
  | "default"
  | "xs"
  | "sm"
  | "lg"
  | "icon"
  | "icon-xs"
  | "icon-sm"
  | "icon-lg"

const variantMap: Record<ShadcnVariant, ButtonView> = {
  default: "action",
  destructive: "outlined-danger",
  outline: "outlined",
  secondary: "normal",
  ghost: "flat",
  link: "flat-action",
}

const sizeMap: Record<ShadcnSize, ButtonSize> = {
  default: "m",
  xs: "xs",
  sm: "s",
  lg: "l",
  icon: "m",
  "icon-xs": "xs",
  "icon-sm": "s",
  "icon-lg": "l",
}

function buttonVariants({
  variant = "default",
  size = "default",
  className,
}: {
  variant?: ShadcnVariant
  size?: ShadcnSize
  className?: string
} = {}) {
  return cn(className)
}

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: ShadcnVariant
  size?: ShadcnSize
  asChild?: boolean
  loading?: boolean
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  if (asChild) {
    const Comp = Slot.Root
    return (
      <Comp
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </Comp>
    )
  }

  const gravityProps: GravityButtonProps = {
    view: variantMap[variant],
    size: sizeMap[size],
    className: cn(buttonVariants({ variant, size, className })),
    loading,
    disabled,
    children,
    ...props,
  }

  return <GravityButton {...gravityProps} />
}

export { Button, buttonVariants }
