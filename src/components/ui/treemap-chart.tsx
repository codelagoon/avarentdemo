// src/components/ui/treemap-chart.tsx
import * as React from "react"
import { useMemo, useState } from "react"
import { Group } from "@visx/group"
import {
  Treemap,
  hierarchy,
  stratify,
  treemapSquarify,
  treemapBinary,
  treemapDice,
  treemapResquarify,
  treemapSlice,
  treemapSliceDice,
} from "@visx/hierarchy"
import { TileMethod } from "@visx/hierarchy/lib/types"
import { scaleLinear } from "@visx/scale"

const defaultMargin = { top: 0, left: 0, right: 0, bottom: 0 }

const TILE_METHODS = {
  treemapSquarify,
  treemapBinary,
  treemapResquarify,
  treemapDice,
  treemapSlice,
  treemapSliceDice,
}

const TILE_LABELS: Record<string, string> = {
  treemapSquarify: "Squarify",
  treemapBinary: "Binary",
  treemapResquarify: "Resquarify",
  treemapDice: "Dice",
  treemapSlice: "Slice",
  treemapSliceDice: "Slice / Dice",
}

export interface TreemapDatum {
  /** Unique node id (also used as the display label). */
  id: string
  /** Parent node id; empty string / null for the root. */
  parent: string | null
  /** Leaf weight. Branch nodes are summed from children. */
  size?: number
}

export interface TreemapChartProps {
  width: number
  height: number
  data: TreemapDatum[]
  margin?: { top: number; right: number; bottom: number; left: number }
  /** Two-stop color range (low → high value) for leaf tiles. */
  colorRange?: [string, string]
  /** Color of the gaps between tiles (defaults to the surface behind the chart). */
  separatorColor?: string
  /** Whether to show the tile-method selector. */
  showControls?: boolean
}

export function TreemapChart({
  width,
  height,
  data,
  margin = defaultMargin,
  colorRange = ["#5e3d22", "#dca871"],
  separatorColor = "hsl(var(--card))",
  showControls = true,
}: TreemapChartProps) {
  const [tileMethod, setTileMethod] = useState<keyof typeof TILE_METHODS>("treemapSquarify")

  const root = useMemo(() => {
    const stratified = stratify<TreemapDatum>()
      .id((d) => d.id)
      .parentId((d) => d.parent)(data)
      .sum((d) => d.size ?? 0)
    return hierarchy(stratified).sort((a, b) => (b.value || 0) - (a.value || 0))
  }, [data])

  const maxValue = useMemo(() => Math.max(...data.map((d) => d.size ?? 0), 0), [data])

  const colorScale = useMemo(
    () => scaleLinear<string>({ domain: [0, maxValue], range: colorRange }),
    [maxValue, colorRange],
  )

  if (width < 10) return null

  const controlsHeight = showControls ? 26 : 0
  const xMax = width - margin.left - margin.right
  const yMax = height - margin.top - margin.bottom - controlsHeight
  if (xMax <= 0 || yMax <= 0) return null

  return (
    <div className="flex h-full w-full flex-col">
      {showControls && (
        <div className="mb-2 flex items-center gap-2">
          <label htmlFor="treemap-tile" className="text-[0.62rem] text-muted-foreground">
            Tiling
          </label>
          <select
            id="treemap-tile"
            value={tileMethod}
            onChange={(e) => setTileMethod(e.target.value as keyof typeof TILE_METHODS)}
            className="h-6 rounded border border-border bg-background px-1.5 text-[0.62rem] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {Object.keys(TILE_METHODS).map((tile) => (
              <option key={tile} value={tile}>
                {TILE_LABELS[tile] ?? tile}
              </option>
            ))}
          </select>
        </div>
      )}
      <svg width={width} height={yMax} role="img" aria-label="Treemap chart">
        <Treemap
          root={root}
          size={[xMax, yMax]}
          tile={TILE_METHODS[tileMethod] as TileMethod<typeof root>}
          round
        >
          {(treemap) => (
            <Group left={margin.left}>
              {treemap
                .descendants()
                .reverse()
                .map((node, i) => {
                  const nodeWidth = node.x1 - node.x0
                  const nodeHeight = node.y1 - node.y0
                  const isLeaf = !node.children
                  const isCategory = node.depth === 1
                  const showLabel = isLeaf && nodeWidth > 52 && nodeHeight > 18
                  const label = (node.data.data as TreemapDatum).id
                  return (
                    <Group key={`node-${i}`} top={node.y0} left={node.x0}>
                      {isCategory && (
                        <rect
                          width={nodeWidth}
                          height={nodeHeight}
                          stroke={separatorColor}
                          strokeWidth={3}
                          fill="transparent"
                        />
                      )}
                      {isLeaf && node.depth > 0 && (
                        <rect
                          width={nodeWidth}
                          height={nodeHeight}
                          stroke={separatorColor}
                          strokeWidth={1}
                          fill={colorScale(node.value || 0)}
                        />
                      )}
                      {showLabel && (
                        <text
                          x={6}
                          y={14}
                          fontSize={9}
                          fontFamily="var(--font-dm-sans)"
                          fill="#241910"
                          fillOpacity={0.85}
                          className="pointer-events-none"
                        >
                          {label}
                        </text>
                      )}
                    </Group>
                  )
                })}
            </Group>
          )}
        </Treemap>
      </svg>
    </div>
  )
}
