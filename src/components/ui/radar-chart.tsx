// src/components/ui/radar-chart.tsx
import * as React from "react"
import { Group } from "@visx/group"
import { scaleLinear } from "@visx/scale"
import { Point } from "@visx/point"
import { Line, LineRadial } from "@visx/shape"

const degrees = 360

const genAngles = (length: number) =>
  [...new Array(length + 1)].map((_, i) => ({
    angle: i * (degrees / length) + (length % 2 === 0 ? 0 : degrees / length / 2),
  }))

const genPoints = (length: number, radius: number) => {
  const step = (Math.PI * 2) / length
  return [...new Array(length)].map((_, i) => ({
    x: radius * Math.sin(i * step),
    y: radius * Math.cos(i * step),
  }))
}

function genPolygonPoints<Datum>(
  dataArray: Datum[],
  scale: (n: number) => number,
  getValue: (d: Datum) => number,
) {
  const step = (Math.PI * 2) / dataArray.length
  let pointString = ""
  const points: { x: number; y: number }[] = []

  if (dataArray.length === 0) {
    return { points, pointString }
  }

  for (let i = 0; i < dataArray.length; i++) {
    const xVal = scale(getValue(dataArray[i])) * Math.sin(i * step)
    const yVal = scale(getValue(dataArray[i])) * Math.cos(i * step)
    points.push({ x: xVal, y: yVal })
    pointString += `${xVal},${yVal} `
  }
  return { points, pointString: pointString.trim() }
}

const defaultMargin = { top: 40, left: 80, right: 80, bottom: 80 }

export interface RadarChartProps<Datum> {
  width: number
  height: number
  /** Series rendered as a single polygon. */
  data: Datum[]
  /** Numeric value for each axis. */
  getValue: (d: Datum) => number
  /** Optional short label rendered at each axis tip. */
  getLabel?: (d: Datum) => string
  /** Upper bound of the value domain. Defaults to the data max. */
  maxValue?: number
  /** Number of concentric web rings. */
  levels?: number
  margin?: { top: number; right: number; bottom: number; left: number }
  /** Accent color for the data polygon + vertices. Defaults to the theme primary. */
  accentColor?: string
  /** Color for the web rings + spokes. Defaults to the theme border. */
  gridColor?: string
  /** Color for axis labels. Defaults to the muted foreground. */
  labelColor?: string
}

/**
 * Lightweight visx radar chart. Theme-aware by default (uses CSS variable colors)
 * so it adopts the surrounding dark/light theme and accent automatically.
 */
export function RadarChart<Datum>({
  width,
  height,
  data,
  getValue,
  getLabel,
  maxValue,
  levels = 5,
  margin = defaultMargin,
  accentColor = "hsl(var(--primary))",
  gridColor = "hsl(var(--border))",
  labelColor = "hsl(var(--muted-foreground))",
}: RadarChartProps<Datum>) {
  if (width < 10 || !data || data.length === 0) return null

  const xMax = width - margin.left - margin.right
  const yMax = height - margin.top - margin.bottom
  const radius = Math.min(xMax, yMax) / 2
  if (radius <= 0) return null

  const radialScale = scaleLinear<number>({
    range: [0, Math.PI * 2],
    domain: [degrees, 0],
  })

  const yScale = scaleLinear<number>({
    range: [0, radius],
    domain: [0, maxValue ?? Math.max(...data.map(getValue), 0)],
  })

  const webs = genAngles(data.length)
  const axisPoints = genPoints(data.length, radius)
  const polygon = genPolygonPoints(data, (d) => yScale(d) ?? 0, getValue)
  const zeroPoint = new Point({ x: 0, y: 0 })

  return (
    <svg width={width} height={height} role="img" aria-label="Radar chart">
      <Group top={margin.top + yMax / 2} left={margin.left + xMax / 2}>
        {[...new Array(levels)].map((_, i) => (
          <LineRadial
            key={`web-${i}`}
            data={webs}
            angle={(d) => radialScale(d.angle) ?? 0}
            radius={((i + 1) * radius) / levels}
            fill="none"
            stroke={gridColor}
            strokeWidth={1}
            strokeOpacity={0.5}
            strokeLinecap="round"
          />
        ))}
        {[...new Array(data.length)].map((_, i) => (
          <Line
            key={`spoke-${i}`}
            from={zeroPoint}
            to={axisPoints[i]}
            stroke={gridColor}
            strokeOpacity={0.6}
          />
        ))}
        {polygon.pointString && (
          <polygon
            points={polygon.pointString}
            fill={accentColor}
            fillOpacity={0.2}
            stroke={accentColor}
            strokeWidth={1.5}
          />
        )}
        {polygon.points.map((point, i) => (
          <circle key={`vertex-${i}`} cx={point.x} cy={point.y} r={3.5} fill={accentColor} />
        ))}
        {getLabel &&
          data.map((d, i) => (
            <text
              key={`label-${i}`}
              x={axisPoints[i].x * 1.16}
              y={axisPoints[i].y * 1.16}
              fontSize={9}
              fill={labelColor}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="var(--font-dm-sans)"
            >
              {getLabel(d)}
            </text>
          ))}
      </Group>
    </svg>
  )
}
