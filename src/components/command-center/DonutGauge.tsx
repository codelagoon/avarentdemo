import { cn } from "@/lib/utils"

export interface DonutGaugeProps {
  value: number
  max?: number
  size?: "sm" | "lg"
  suffix?: string
  className?: string
}

const SIZE_MAP = {
  sm: { box: "size-14", stroke: 5, radius: 22, font: "text-sm" },
  lg: { box: "size-20", stroke: 6, radius: 32, font: "text-lg" },
} as const

export function DonutGauge({
  value,
  max = 100,
  size = "lg",
  suffix = "",
  className,
}: DonutGaugeProps) {
  const { box, stroke, radius, font } = SIZE_MAP[size]
  const dim = size === "sm" ? 56 : 80
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(Math.max(value / max, 0), 1)
  const dashOffset = circumference * (1 - pct)
  const center = dim / 2

  return (
    <div className={cn("relative shrink-0", box, className)}>
      <svg viewBox={`0 0 ${dim} ${dim}`} className="size-full -rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          className="stroke-muted"
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          className="stroke-primary"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-semibold leading-none text-foreground", font)}>
          {value}
          {suffix}
        </span>
      </div>
    </div>
  )
}
