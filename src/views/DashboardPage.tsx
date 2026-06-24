import { useState, useCallback, useEffect, useMemo } from "react"
import { useLiveData } from "@/hooks/useLiveData"
import {
  Play, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle,
  Shield, Zap, ChevronDown, Hash, Activity,
  RefreshCw, Download, Boxes, Scale, Database, TrendingUp,
  TrendingDown, Minus, Filter, BarChart2, Check, X, BookOpen
} from "lucide-react"
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip,
  CartesianGrid
} from "recharts"
import { toast } from "sonner"
import { AvarentLogo } from "@/components/AvarentLogo"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { type LedgerEntry } from "@/services/ledgerService"
import { type LedgerEventType } from "@/data/mockData" // Temporarily retained for type only, will remove later
const DAILY_STATS: any = { appsToday: 0, modelsActive: 0, modelVersion: "v1.0" }
const DATA_VOLUME: any[] = []
import { ledgerService } from "@/services/ledgerService"
import { scenarioService, DEMO_SCENARIOS, type ScenarioConfig } from "@/services/scenarioService"
import { DataImportDialog } from "@/components/DataImportDialog"

// ─── Fairness wave data ───────────────────────────────────────────────────────
const WAVE_DATA = [
  { month: "Nov", score: 81, interventions: 3, baseline: 72 },
  { month: "Dec", score: 84, interventions: 2, baseline: 72 },
  { month: "Jan", score: 87, interventions: 4, baseline: 72 },
  { month: "Feb", score: 83, interventions: 1, baseline: 72 },
  { month: "Mar", score: 89, interventions: 5, baseline: 72 },
  { month: "Apr", score: 91, interventions: 2, baseline: 72 },
  { month: "May", score: 94, interventions: 1, baseline: 72 },
]

// ─── Recent applicant decisions (for applicant table) ────────────────────────
const RECENT_DECISIONS = [
  { id: "APP-084721", name: "Marcus T. Williams",   initials: "MW", color: "bg-emerald-500", loan: "Mortgage",  amount: 285000, decision: "approved",    fairness: 0.97, time: "14:49", trend: [72, 80, 85, 91, 97] },
  { id: "APP-084722", name: "Darnell R. Johnson",   initials: "DJ", color: "bg-violet-500",  loan: "Auto",      amount: 42000,  decision: "under_review", fairness: 0.89, time: "14:47", trend: [60, 70, 75, 80, 89] },
  { id: "APP-084723", name: "Priya K. Sharma",      initials: "PS", color: "bg-rose-500",    loan: "Personal",  amount: 18500,  decision: "escalated",    fairness: 0.61, time: "14:43", trend: [45, 52, 58, 60, 61] },
  { id: "APP-084724", name: "Robert A. Chen",       initials: "RC", color: "bg-sky-500",     loan: "Auto",      amount: 38000,  decision: "approved",    fairness: 0.94, time: "14:40", trend: [78, 83, 88, 91, 94] },
  { id: "APP-084725", name: "Latoya M. Davis",      initials: "LD", color: "bg-amber-500",   loan: "Mortgage",  amount: 320000, decision: "approved",    fairness: 0.82, time: "14:37", trend: [65, 70, 74, 79, 82] },
  { id: "APP-084726", name: "James W. Thompson",    initials: "JT", color: "bg-teal-500",    loan: "Business",  amount: 95000,  decision: "approved",    fairness: 0.96, time: "14:34", trend: [80, 86, 91, 94, 96] },
]

// ─── Badge helpers ────────────────────────────────────────────────────────────
function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    critical: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900",
    high:     "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-900",
    medium:   "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900",
    low:      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900",
  }
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide", map[severity] ?? map.low)}>
      {severity}
    </span>
  )
}

function DecisionBadge({ decision }: { decision: string }) {
  const map: Record<string, { cls: string; label: string; icon: React.ReactNode }> = {
    approved:     { cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900", label: "Approved",    icon: <Check className="h-2.5 w-2.5" /> },
    denied:       { cls: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900",                   label: "Denied",      icon: <X className="h-2.5 w-2.5" /> },
    under_review: { cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900",             label: "Review",      icon: <Minus className="h-2.5 w-2.5" /> },
    escalated:    { cls: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-900",       label: "Escalated",   icon: <AlertTriangle className="h-2.5 w-2.5" /> },
  }
  const { cls, label, icon } = map[decision] ?? map.under_review
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.6rem] font-semibold", cls)}>
      {icon}{label}
    </span>
  )
}

function EventTypeBadge({ type }: { type: LedgerEventType }) {
  const map: Record<LedgerEventType, { label: string; cls: string }> = {
    decision:    { label: "Decision",    cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900" },
    intervention:{ label: "Intervention",cls: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-900" },
    proof_signed:{ label: "Proof Signed",cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900" },
    alert:       { label: "Alert",       cls: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900" },
    audit:       { label: "Audit",       cls: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" },
  }
  const { label, cls } = map[type]
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[0.6rem] font-semibold", cls)}>
      {label}
    </span>
  )
}

// ─── Mini sparkline SVG ───────────────────────────────────────────────────────
function Sparkline({ data, color = "#6366f1" }: { data: number[]; color?: string }) {
  const w = 52, h = 20
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - ((v - min) / range) * (h - 2) - 1,
  ])
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ")
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <path d={d} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Circular gauge SVG ───────────────────────────────────────────────────────
function CircularGauge({ value, max = 100, label, sub, color = "#6366f1" }: {
  value: number; max?: number; label: string; sub?: string; color?: string
}) {
  const r = 28, circ = 2 * Math.PI * r
  const pct = Math.min(value / max, 1)
  const dash = circ * pct
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative flex items-center justify-center">
        <svg width={72} height={72} viewBox="0 0 72 72" className="-rotate-90">
          <circle cx={36} cy={36} r={r} stroke="currentColor" strokeWidth="5" fill="none" className="text-slate-100 dark:text-slate-800" />
          <circle
            cx={36} cy={36} r={r}
            stroke={color} strokeWidth="5" fill="none"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s ease" }}
          />
        </svg>
        <span className="absolute text-sm font-bold tabular-nums" style={{ color }}>{value}</span>
      </div>
      <p className="text-[0.6rem] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">{label}</p>
      {sub && <p className="text-[0.55rem] text-slate-400 dark:text-slate-500 text-center">{sub}</p>}
    </div>
  )
}

// ─── Causal Graph ─────────────────────────────────────────────────────────────
interface GraphNode {
  id: string; label: string; x: number; y: number; type: "input" | "model" | "output" | "proxy" | "severed"
}
interface GraphEdge {
  from: string; to: string; severed?: boolean
}

function CausalGraph({ severedEdges, running }: { severedEdges: string[]; running: boolean }) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setTick(p => p + 1), 80)
    return () => clearInterval(t)
  }, [running])

  const nodes: GraphNode[] = [
    { id: "income",       label: "Income",       x: 65,  y: 70,  type: "input" },
    { id: "credit_score", label: "Credit Score", x: 65,  y: 130, type: "input" },
    { id: "employment",   label: "Employment",   x: 65,  y: 190, type: "input" },
    { id: "loan_amount",  label: "Loan Amount",  x: 65,  y: 250, type: "input" },
    { id: "zip_code",     label: "ZIP Code",     x: 65,  y: 315,
      type: severedEdges.includes("zip_code -> risk_score") || severedEdges.includes("zip_code -> credit_decision") ? "severed" : "proxy" },
    { id: "neighborhood", label: "Neighborhood", x: 65,  y: 365,
      type: severedEdges.includes("neighborhood_score -> approval_gate") ? "severed" : "proxy" },
    { id: "school_dist",  label: "School Dist.", x: 65,  y: 415,
      type: severedEdges.includes("school_district -> creditworthiness") ? "severed" : "proxy" },
    { id: "risk_model",       label: "Risk Model",     x: 220, y: 155, type: "model" },
    { id: "fairness_layer",   label: "Fairness Layer", x: 220, y: 250, type: "model" },
    { id: "causal_engine",    label: "Causal Engine",  x: 220, y: 335, type: "model" },
    { id: "credit_decision",  label: "Credit Decision",x: 375, y: 195, type: "output" },
    { id: "proof_bundle",     label: "Proof Bundle",   x: 375, y: 295, type: "output" },
  ]

  const edges: GraphEdge[] = [
    { from: "income",       to: "risk_model" },
    { from: "credit_score", to: "risk_model" },
    { from: "employment",   to: "risk_model" },
    { from: "loan_amount",  to: "risk_model" },
    { from: "zip_code",     to: "risk_model",      severed: severedEdges.includes("zip_code -> risk_score") || severedEdges.includes("zip_code -> credit_decision") },
    { from: "neighborhood", to: "fairness_layer",  severed: severedEdges.includes("neighborhood_score -> approval_gate") },
    { from: "school_dist",  to: "causal_engine",   severed: severedEdges.includes("school_district -> creditworthiness") },
    { from: "risk_model",    to: "fairness_layer" },
    { from: "fairness_layer",to: "causal_engine" },
    { from: "fairness_layer",to: "credit_decision" },
    { from: "causal_engine", to: "credit_decision" },
    { from: "causal_engine", to: "proof_bundle" },
    { from: "risk_model",    to: "credit_decision" },
  ]

  const getNode = (id: string) => nodes.find(n => n.id === id)!

  const nodeColors: Record<string, { fill: string; stroke: string }> = {
    input:   { fill: "#1e3a5f", stroke: "#2563eb" },
    model:   { fill: "#1a3040", stroke: "#0891b2" },
    output:  { fill: "#1e3a5f", stroke: "#6366f1" },
    proxy:   { fill: "#44330a", stroke: "#d97706" },
    severed: { fill: "#3f1010", stroke: "#ef4444" },
  }


  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-slate-200/60 bg-slate-50 dark:border-slate-800 dark:bg-[#0d1117]">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 460 470"
        preserveAspectRatio="xMidYMid meet"
        data-testid="causal-graph"
      >
        {/* Dot-grid background */}
        <defs>
          <pattern id="dotgrid" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.8" fill="rgba(100,116,139,0.18)" />
          </pattern>
          <marker id="arr" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
            <polygon points="0 0, 7 2.5, 0 5" fill="rgba(100,116,139,0.5)" />
          </marker>
          <marker id="arr-active" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
            <polygon points="0 0, 7 2.5, 0 5" fill="#6366f1" />
          </marker>
          <marker id="arr-severed" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
            <polygon points="0 0, 7 2.5, 0 5" fill="#ef4444" />
          </marker>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <rect width="460" height="470" fill="url(#dotgrid)" />

        {/* Column dividers */}
        <line x1="158" y1="35" x2="158" y2="455" stroke="rgba(100,116,139,0.12)" strokeWidth="1" strokeDasharray="5,4" />
        <line x1="315" y1="35" x2="315" y2="455" stroke="rgba(100,116,139,0.12)" strokeWidth="1" strokeDasharray="5,4" />

        {/* Column labels */}
        <text x="79"  y="22" fontSize="7.5" fill="rgba(100,116,139,0.6)" fontFamily="IBM Plex Sans" fontWeight="600" letterSpacing="2" textAnchor="middle">INPUT FEATURES</text>
        <text x="237" y="22" fontSize="7.5" fill="rgba(100,116,139,0.6)" fontFamily="IBM Plex Sans" fontWeight="600" letterSpacing="2" textAnchor="middle">MODEL LAYERS</text>
        <text x="393" y="22" fontSize="7.5" fill="rgba(100,116,139,0.6)" fontFamily="IBM Plex Sans" fontWeight="600" letterSpacing="2" textAnchor="middle">OUTPUTS</text>

        {/* Edges */}
        {edges.map((edge, i) => {
          const from = getNode(edge.from)
          const to = getNode(edge.to)
          if (!from || !to) return null
          const isSevered = edge.severed
          const mx = (from.x + to.x) / 2
          return (
            <g key={i}>
              <path
                d={`M ${from.x + 32} ${from.y} C ${mx + 8} ${from.y}, ${mx - 8} ${to.y}, ${to.x - 32} ${to.y}`}
                fill="none"
                stroke={isSevered ? "#ef4444" : running ? "#6366f1" : "rgba(100,116,139,0.35)"}
                strokeWidth={isSevered ? 1.5 : running ? 1.5 : 1}
                strokeDasharray={isSevered ? "4,3" : "none"}
                opacity={isSevered ? 0.7 : running ? 0.85 : 0.6}
                markerEnd={isSevered ? "url(#arr-severed)" : running ? "url(#arr-active)" : "url(#arr)"}
                filter={running && !isSevered ? "url(#glow)" : undefined}
              />
              {isSevered && (
                <text
                  x={mx}
                  y={(from.y + to.y) / 2 - 4}
                  fontSize="6.5"
                  fill="#ef4444"
                  textAnchor="middle"
                  fontFamily="IBM Plex Mono"
                  fontWeight="700"
                  opacity={0.9}
                >
                  SEVERED
                </text>
              )}
            </g>
          )
        })}

        {/* Nodes */}
        {nodes.map(node => {
          const { fill, stroke } = nodeColors[node.type]
          const isProxy = node.type === "proxy" || node.type === "severed"
          const isPulsing = running && (node.type === "model" || node.type === "output")
          return (
            <g key={node.id} data-testid={`graph-node-${node.id}`}>
              {isPulsing && (
                <rect
                  x={node.x - 34} y={node.y - 16}
                  width={68} height={32} rx={6}
                  fill={stroke} opacity={0.08 + Math.sin(tick * 0.15) * 0.05}
                />
              )}
              <rect
                x={node.x - 32} y={node.y - 13}
                width={64} height={26} rx={5}
                fill={fill}
                opacity={node.type === "severed" ? 0.5 : 0.95}
                stroke={stroke}
                strokeWidth={node.type === "severed" ? 1.5 : 1}
                strokeDasharray={node.type === "severed" ? "3,2" : "none"}
                filter={isPulsing ? "url(#glow)" : undefined}
              />
              <text
                x={node.x} y={node.y + 4}
                fontSize={isProxy ? 7.5 : 8}
                fill="rgba(255,255,255,0.9)"
                textAnchor="middle"
                fontFamily="IBM Plex Sans"
                fontWeight="600"
                opacity={node.type === "severed" ? 0.6 : 1}
              >
                {node.label}
              </text>
            </g>
          )
        })}

        {/* Live indicator */}
        {running && (
          <g>
            <circle cx={442} cy={455} r={4.5} fill="#6366f1" opacity={0.9 + Math.sin(tick * 0.3) * 0.1} filter="url(#glow)" />
            <text x={434} y={452} fontSize="6.5" fill="#6366f1" textAnchor="end" fontFamily="IBM Plex Mono" fontWeight="700">ACTIVE</text>
          </g>
        )}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-3 rounded-lg border border-slate-200/60 bg-white/80 px-2.5 py-1.5 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
        {[
          { label: "Input/Output", color: "bg-blue-700" },
          { label: "Model",        color: "bg-cyan-700" },
          { label: "Proxy",        color: "bg-amber-600" },
          { label: "Severed",      color: "bg-rose-600" },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1">
            <div className={cn("h-1.5 w-2 rounded-sm", item.color)} />
            <span className="text-[0.55rem] font-medium text-slate-500 dark:text-slate-400">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Fairness Wave Chart ──────────────────────────────────────────────────────
function FairnessWaveChart({ running }: { running: boolean }) {
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={WAVE_DATA} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
          <defs>
            <linearGradient id="gradFairness" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradBaseline" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#94a3b8" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
          <XAxis dataKey="month" tick={{ fontSize: 9, fill: "rgba(100,116,139,0.7)", fontFamily: "IBM Plex Sans" }} axisLine={false} tickLine={false} />
          <YAxis domain={[60, 100]} tick={{ fontSize: 9, fill: "rgba(100,116,139,0.7)", fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
          <RechartsTooltip
            contentStyle={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 8, padding: "6px 10px" }}
            labelStyle={{ color: "#e2e8f0", fontSize: 10, fontWeight: 600 }}
            itemStyle={{ color: "#a5b4fc", fontSize: 10 }}
            cursor={{ stroke: "rgba(99,102,241,0.3)", strokeWidth: 1 }}
          />
          <Area type="monotone" dataKey="baseline" stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 3" fill="url(#gradBaseline)" dot={false} name="CFPB Floor" />
          <Area type="monotone" dataKey="score"    stroke={running ? "#818cf8" : "#6366f1"} strokeWidth={2} fill="url(#gradFairness)" dot={false} name="Fairness Score" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Left Panel: Compliance Controls ─────────────────────────────────────────
function ComplianceControlsPanel({
  scenario, onRun, running, activeScenario,
  onScenarioSelect, testResult, onStartTour,
}: {
  scenario: ScenarioConfig | null
  onRun: () => void
  running: boolean
  activeScenario: ScenarioConfig | null
  onScenarioSelect: (id: DemoScenario) => void
  testResult: { outcome: string; fairness: number } | null
  onStartTour: () => void
}) {
  const [enableProxyScan,  setEnableProxyScan]  = useState(true)
  const [enableDoCalc,     setEnableDoCalc]      = useState(true)
  const [enableHashChain,  setEnableHashChain]   = useState(true)
  const [loanType,         setLoanType]          = useState("mortgage")
  const [modelSensitivity, setModelSensitivity]  = useState("balanced")
  const [scenariosOpen,    setScenariosOpen]      = useState(true)
  const [profileOpen,      setProfileOpen]        = useState(true)
  const [controlsOpen,     setControlsOpen]       = useState(true)

  const handleProxyScanChange = useCallback((val: boolean) => setEnableProxyScan(val), [])
  const handleDoCalcChange = useCallback((val: boolean) => setEnableDoCalc(val), [])
  const handleHashChainChange = useCallback((val: boolean) => setEnableHashChain(val), [])

  return (
    <div className="flex h-full flex-col overflow-y-auto" data-testid="red-team-console">
      {/* Panel header */}
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/10">
          <Filter className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
        </div>
        <span className="text-[0.7rem] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">
          Controls
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={onStartTour}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            title="Start Interactive Tour"
          >
            <BookOpen className="h-3.5 w-3.5" />
          </button>
          <DataImportDialog />
        </div>
      </div>

      {/* Scenarios accordion */}
      <div className="border-b border-border/60" data-testid="demo-scenarios-bar">
        <button
          onClick={() => setScenariosOpen(o => !o)}
          className="flex w-full items-center justify-between px-4 py-2.5 hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Activity className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">Test Scenarios</span>
            <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[0.6rem] font-bold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
              {Object.keys(DEMO_SCENARIOS).length}
            </span>
          </div>
          <ChevronDown className={cn("h-3 w-3 text-slate-400 transition-transform", scenariosOpen && "rotate-180")} />
        </button>
        {scenariosOpen && (
          <div className="px-3 pb-3 space-y-1.5">
            {(Object.values(DEMO_SCENARIOS) as ScenarioConfig[]).map(s => {
              const isActive = activeScenario?.id === s.id
              const styleMap = {
                good_faith: {
                  base: "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30",
                  active: "border-emerald-500 bg-emerald-100 dark:bg-emerald-900/50",
                  icon: <CheckCircle className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />,
                  accent: "text-emerald-700 dark:text-emerald-400",
                },
                mild_proxy: {
                  base: "border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/30",
                  active: "border-amber-500 bg-amber-100 dark:bg-amber-900/50",
                  icon: <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />,
                  accent: "text-amber-700 dark:text-amber-400",
                },
                bad_faith: {
                  base: "border-rose-200 bg-rose-50/60 dark:border-rose-900 dark:bg-rose-950/30",
                  active: "border-rose-500 bg-rose-100 dark:bg-rose-900/50",
                  icon: <Shield className="h-3 w-3 text-rose-600 dark:text-rose-400" />,
                  accent: "text-rose-700 dark:text-rose-400",
                },
              }[s.id]
              return (
                <button
                  key={s.id}
                  onClick={() => onScenarioSelect(s.id)}
                  data-testid={`scenario-${s.id}`}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-left transition-all duration-150",
                    isActive ? styleMap.active : styleMap.base,
                    "hover:shadow-sm"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {styleMap.icon}
                    <span className={cn("text-xs font-semibold", styleMap.accent)}>{s.label}</span>
                    {isActive && <span className="ml-auto flex h-1.5 w-1.5 rounded-full bg-current opacity-70 animate-pulse" />}
                  </div>
                  <p className="mt-0.5 pl-5 text-[0.6rem] text-slate-500 dark:text-slate-400 line-clamp-1">{s.description.split("—")[0].replace("DEMO: ", "")}</p>
                </button>
              )
            })}
            {testResult && (
              <div className="mt-1 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800">
                <span className="text-[0.65rem] text-slate-500 dark:text-slate-400">Last result:</span>
                <div className="flex items-center gap-1.5">
                  <DecisionBadge decision={testResult.outcome} />
                  <span className="font-mono text-[0.65rem] font-bold text-indigo-600 dark:text-indigo-400">
                    AIR: {testResult.fairness.toFixed(2)} · SPD: {Math.max(0, 1 - testResult.fairness).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Applicant profile accordion */}
      <div className="border-b border-border/60">
        <button
          onClick={() => setProfileOpen(o => !o)}
          className="flex w-full items-center justify-between px-4 py-2.5 hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Hash className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">Applicant Profile</span>
          </div>
          <ChevronDown className={cn("h-3 w-3 text-slate-400 transition-transform", profileOpen && "rotate-180")} />
        </button>
        {profileOpen && (
          <div className="px-3 pb-3">
            {scenario ? (
              <div className="space-y-1">
                {/* Attack vector badge */}
                {scenario.attackVector && (
                  <div className="mb-2 flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1.5 dark:border-orange-900 dark:bg-orange-950/40">
                    <AlertTriangle className="h-3 w-3 text-orange-600 dark:text-orange-400 shrink-0" />
                    <span className="text-[0.62rem] font-semibold text-orange-700 dark:text-orange-400 line-clamp-1">
                      {scenario.attackVector}
                    </span>
                    {scenario.proxiesDetected > 0 && (
                      <span className="ml-auto shrink-0 rounded-full bg-orange-600 px-1.5 py-0.5 text-[0.55rem] font-bold text-white">
                        {scenario.proxiesDetected} proxy
                      </span>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                  {[
                    ["Name",       scenario.applicantName],
                    ["ID",         scenario.applicantId],
                    ["Loan Type",  scenario.loanType],
                    ["Amount",     `$${scenario.loanAmount.toLocaleString()}`],
                    ["Income",     `$${scenario.income.toLocaleString()}/yr`],
                    ["Credit",     scenario.creditScore.toString()],
                    ["ZIP",        scenario.zipCode],
                    ["Employment", `${scenario.employmentYears} yrs`],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-md bg-slate-50 px-2 py-1 dark:bg-slate-800/60">
                      <p className="text-[0.55rem] text-slate-400 uppercase tracking-wide">{k}</p>
                      <p className="font-mono text-[0.65rem] font-semibold text-slate-700 dark:text-slate-200 truncate">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/60 py-6 dark:border-slate-700 dark:bg-slate-800/30">
                <Shield className="h-6 w-6 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-[0.65rem] text-slate-400 text-center">Select a scenario above</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detection controls accordion */}
      <div className="border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setControlsOpen(o => !o)}
          className="flex w-full items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Detection Controls</span>
          </div>
          <ChevronDown className={cn("h-3 w-3 text-slate-400 transition-transform", controlsOpen && "rotate-180")} />
        </button>
        {controlsOpen && (
          <div className="px-3 pb-3 space-y-2.5">
            {/* Data volume indicator */}
            <div className="flex items-center gap-2 rounded-lg bg-indigo-50 border border-indigo-100 px-2.5 py-1.5 dark:bg-indigo-950/30 dark:border-indigo-900/50">
              <Database className="h-3 w-3 text-indigo-500 dark:text-indigo-400 shrink-0" />
              <span className="text-[0.62rem] text-slate-600 dark:text-slate-400">
                Using <span className="font-bold text-indigo-600 dark:text-indigo-400">{DATA_VOLUME.featuresPerDecision}</span> data points
              </span>
            </div>
            {/* Toggles */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="cursor-pointer text-[0.7rem] text-slate-600 dark:text-slate-300" htmlFor="toggle-proxy-scan">
                  Proxy Variable Scanning
                </Label>
                <input
                  id="toggle-proxy-scan"
                  type="checkbox"
                  checked={enableProxyScan}
                  onChange={(e) => handleProxyScanChange(e.target.checked)}
                  data-testid="toggle-proxy-scan"
                  className="h-4 w-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="cursor-pointer text-[0.7rem] text-slate-600 dark:text-slate-300" htmlFor="toggle-do-calc">
                  Do-Calculus Intervention
                </Label>
                <input
                  id="toggle-do-calc"
                  type="checkbox"
                  checked={enableDoCalc}
                  onChange={(e) => handleDoCalcChange(e.target.checked)}
                  data-testid="toggle-do-calc"
                  className="h-4 w-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="cursor-pointer text-[0.7rem] text-slate-600 dark:text-slate-300" htmlFor="toggle-hash-chain">
                  Hash-Chain Ledger Signing
                </Label>
                <input
                  id="toggle-hash-chain"
                  type="checkbox"
                  checked={enableHashChain}
                  onChange={(e) => handleHashChainChange(e.target.checked)}
                  data-testid="toggle-hash-chain"
                  className="h-4 w-4"
                />
              </div>
            </div>
            {/* Selectors */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="mb-1 block text-[0.6rem] text-slate-400 tracking-wide">Loan Type</Label>
                <select
                  value={loanType}
                  onChange={(e) => setLoanType(e.target.value)}
                  data-testid="select-loan-type"
                  className="h-7 w-full text-xs rounded border border-border bg-background px-2"
                >
                  <option value="mortgage">Mortgage</option>
                  <option value="auto">Auto Loan</option>
                  <option value="personal">Personal</option>
                  <option value="business">Business</option>
                </select>
              </div>
              <div>
                <Label className="mb-1 block text-[0.6rem] text-slate-400 tracking-wide">Sensitivity</Label>
                <select
                  value={modelSensitivity}
                  onChange={(e) => setModelSensitivity(e.target.value)}
                  data-testid="select-sensitivity"
                  className="h-7 w-full text-xs rounded border border-border bg-background px-2"
                >
                  <option value="strict">Strict</option>
                  <option value="balanced">Balanced</option>
                  <option value="lenient">Lenient</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Execute button */}
      <div className="mt-auto p-3">
        <Button
          className="w-full gap-2 font-bold text-xs h-9 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 shadow-md shadow-indigo-500/20 transition-all duration-200"
          onClick={onRun}
          disabled={!scenario || running}
          data-testid="execute-adversarial-test"
        >
          {running ? (
            <><RefreshCw className="h-3.5 w-3.5 animate-spin" />Processing...</>
          ) : (
            <><Play className="h-3.5 w-3.5" />Execute Adversarial Test</>
          )}
        </Button>
      </div>
    </div>
  )
}

// ─── Evidence Feed (right panel) ──────────────────────────────────────────────
function EvidenceFeed({ entries }: { entries: LedgerEntry[] }) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
        {entries.map((entry, i) => (
          <div
            key={entry.id}
            className={cn(
              "rounded-xl border bg-white p-2.5 transition-all dark:bg-slate-900/60 dark:border-slate-800",
              i === 0 ? "animate-ledger-in border-indigo-100 shadow-sm dark:border-indigo-900/40" : "border-slate-100"
            )}
            data-testid={`ledger-entry-${entry.id}`}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex flex-wrap items-center gap-1">
                <EventTypeBadge type={entry.eventType} />
                {entry.decision && <DecisionBadge decision={entry.decision} />}
                {entry.severity && <SeverityBadge severity={entry.severity} />}
              </div>
            </div>
            <p className="text-[0.7rem] font-semibold text-slate-800 dark:text-slate-200 truncate">{entry.applicantName}</p>
            <p className="text-[0.62rem] text-slate-500 dark:text-slate-400 truncate mt-0.5">{entry.message}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-mono text-[0.58rem] text-slate-400 dark:text-slate-600 truncate max-w-[100px]">
                #{entry.hash.slice(0, 14)}...
              </span>
              <div className="flex items-center gap-1">
                <div className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  entry.fairnessScore >= 0.8 ? "bg-emerald-500" : "bg-rose-500"
                )} />
                <span className="font-mono text-[0.62rem] font-bold text-slate-600 dark:text-slate-300">
                  AIR: {entry.fairnessScore.toFixed(2)} · SPD: {Math.max(0, 1 - entry.fairnessScore).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Applicant Decision Table ─────────────────────────────────────────────────
type TabFilter = "all" | "approved" | "escalated" | "under_review"

function ApplicantTable({ activeScenario }: { activeScenario: ScenarioConfig | null }) {
  const [tab, setTab] = useState<TabFilter>("all")
  const filtered = RECENT_DECISIONS.filter(d => tab === "all" || d.decision === tab)
  const counts = useMemo(() => ({
    all:          RECENT_DECISIONS.length,
    approved:     RECENT_DECISIONS.filter(d => d.decision === "approved").length,
    escalated:    RECENT_DECISIONS.filter(d => d.decision === "escalated").length,
    under_review: RECENT_DECISIONS.filter(d => d.decision === "under_review").length,
  }), [])
  const tabs = useMemo(() => [
    { id: "all" as TabFilter,          label: "All applications", count: counts.all },
    { id: "approved" as TabFilter,     label: "Approved",          count: counts.approved },
    { id: "escalated" as TabFilter,    label: "Escalated",         count: counts.escalated },
    { id: "under_review" as TabFilter, label: "Under Review",      count: counts.under_review },
  ], [counts])
  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex items-center gap-0.5 border-b border-border/60 px-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-2 text-[0.65rem] font-semibold transition-all border-b-2 -mb-px",
              tab === t.id
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            {t.label}
            <span className={cn(
              "rounded-full px-1.5 py-0.5 text-[0.55rem] font-bold",
              tab === t.id
                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300"
                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            )}>
              {t.count}
            </span>
          </button>
        ))}
      </div>
      {/* Column headers */}
      <div className="grid grid-cols-[32px_1fr_75px_68px_38px_38px_44px] gap-2 px-3 py-1.5 text-[0.58rem] font-bold uppercase tracking-widest text-slate-400">
        <span />
        <span>Applicant</span>
        <span>Loan</span>
        <span>Decision</span>
        <span className="text-right">AIR</span>
        <span className="text-right">SPD</span>
        <span className="text-right">Trend</span>
      </div>
      {/* Rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/40">
        {filtered.map((d, i) => {
          const isHighlighted = activeScenario?.applicantId?.includes(d.id.split("-")[1] ?? "")
          return (
            <div
              key={d.id}
              className={cn(
                "grid grid-cols-[32px_1fr_75px_68px_38px_38px_44px] items-center gap-2 px-3 py-2 transition-colors",
                "hover:bg-slate-50 dark:hover:bg-slate-800/30",
                isHighlighted && "bg-indigo-50/60 dark:bg-indigo-950/20"
              )}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Avatar initial */}
              <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-bold text-white", d.color)}>
                {d.initials}
              </div>
              {/* Name + ID */}
              <div className="min-w-0">
                <p className="text-[0.7rem] font-semibold text-slate-800 dark:text-slate-200 truncate">{d.name}</p>
                <p className="text-[0.58rem] font-mono text-slate-400 dark:text-slate-500">{d.id} · {d.time}</p>
              </div>
              {/* Loan type + amount */}
              <div>
                <p className="text-[0.65rem] font-semibold text-slate-700 dark:text-slate-300">{d.loan}</p>
                <p className="text-[0.58rem] text-slate-400">${(d.amount / 1000).toFixed(0)}k</p>
              </div>
              {/* Decision badge */}
              <div><DecisionBadge decision={d.decision} /></div>
              {/* AIR */}
              <div className="text-right">
                <span className={cn(
                  "font-mono text-[0.65rem] font-bold",
                  d.fairness >= 0.8 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                )}>
                  {d.fairness.toFixed(2)}
                </span>
              </div>
              {/* SPD */}
              <div className="text-right">
                <span className={cn(
                  "font-mono text-[0.65rem] font-bold",
                  d.fairness >= 0.8 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                )}>
                  {Math.max(0, 1 - d.fairness).toFixed(2)}
                </span>
              </div>
              {/* Sparkline */}
              <div className="flex justify-end">
                <Sparkline
                  data={d.trend}
                  color={
                    d.decision === "approved"     ? "#10b981" :
                    d.decision === "escalated"    ? "#f97316" :
                    d.decision === "under_review" ? "#f59e0b" : "#6366f1"
                  }
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Right Insights Panel ─────────────────────────────────────────────────────
function InsightsPanel({ entries, severedEdges, activeScenario, running }: {
  entries: LedgerEntry[]
  severedEdges: string[]
  activeScenario: ScenarioConfig | null
  running: boolean
}) {
  const avgFairness = entries.length
    ? entries.reduce((s, e) => s + e.fairnessScore, 0) / entries.length
    : DAILY_STATS.fairnessScore

  return (
    <div className="flex h-full flex-col overflow-y-auto gap-3 py-1">
      {/* Insights header */}
      <div className="px-1">
        <p className="text-[0.6rem] font-bold tracking-widest text-slate-400 mb-1">Insights</p>
        <h2 className="text-base font-black text-slate-900 dark:text-slate-100 leading-tight">
          {activeScenario ? activeScenario.label : "All Audits"}
        </h2>
      </div>

      {/* KPI tiles row */}
      <div className="grid grid-cols-2 gap-2">
        <div className={cn(
          "rounded-xl border p-2.5 transition-all hover:-translate-y-0.5 hover:shadow-md",
          "border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900/60"
        )}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[0.58rem] font-bold tracking-wider text-slate-400">Models Active</p>
            <Boxes className="h-3 w-3 text-slate-400" />
          </div>
          <p className="text-xl font-black tabular-nums text-slate-800 dark:text-slate-200">
            {DAILY_STATS.modelsInProduction}
          </p>
        </div>
        <div className={cn(
          "rounded-xl border p-2.5 transition-all hover:-translate-y-0.5 hover:shadow-md",
          "border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900/60"
        )}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[0.58rem] font-bold tracking-wider text-slate-400">24h Audits</p>
            <BarChart2 className="h-3 w-3 text-slate-400" />
          </div>
          <p className="text-xl font-black tabular-nums text-slate-800 dark:text-slate-200">
            {DAILY_STATS.auditsLast24h}
          </p>
        </div>
        <div className={cn(
          "rounded-xl border p-2.5 transition-all hover:-translate-y-0.5 hover:shadow-md",
          "border-indigo-100 bg-indigo-50 dark:border-indigo-900/50 dark:bg-indigo-950/30"
        )}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[0.58rem] font-bold tracking-wider text-slate-400">Features</p>
            <Database className="h-3 w-3 text-indigo-500" />
          </div>
          <p className="text-xl font-black tabular-nums text-indigo-700 dark:text-indigo-300">
            {DATA_VOLUME.featuresPerDecision}
          </p>
        </div>
        <div className={cn(
          "rounded-xl border p-2.5 transition-all hover:-translate-y-0.5 hover:shadow-md",
          DAILY_STATS.openIncidents > 0
            ? "border-indigo-100 bg-indigo-50 dark:border-indigo-900/50 dark:bg-indigo-950/30"
            : "border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900/60"
        )}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[0.58rem] font-bold tracking-wider text-slate-400">Open Alerts</p>
            <AlertTriangle className={cn("h-3 w-3", DAILY_STATS.openIncidents > 0 ? "text-indigo-500" : "text-slate-400")} />
          </div>
          <p className={cn("text-xl font-black tabular-nums", DAILY_STATS.openIncidents > 0 ? "text-indigo-700 dark:text-indigo-300" : "text-slate-800 dark:text-slate-200")}>
            {DAILY_STATS.openIncidents}
          </p>
        </div>
      </div>

      {/* Fairness score summary */}
      <div className="rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[0.58rem] font-bold text-slate-400">
                AIR
              </span>
              <p className="text-sm font-black text-slate-700 dark:text-slate-300 font-mono mt-0.5">
                {avgFairness.toFixed(2)}
              </p>
            </div>
            <div>
              <span className="text-[0.58rem] font-bold text-slate-400">
                SPD
              </span>
              <p className="text-sm font-black text-slate-700 dark:text-slate-300 font-mono mt-0.5">
                {Math.max(0, 1 - avgFairness).toFixed(2)}
              </p>
            </div>
          </div>
          <span className={cn(
            "font-mono text-[0.6rem] font-black rounded-md px-1.5 py-0.5 border shrink-0",
            avgFairness >= 0.8
              ? "bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50"
              : "bg-rose-50 text-rose-700 border-rose-250 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50"
          )}>
            {avgFairness >= 0.8 ? "CFPB PASS" : "CFPB FAIL"}
          </span>
        </div>
        <Progress value={avgFairness * 100} className="h-1.5 mb-1.5" />
        <div className="flex justify-between text-[0.58rem] text-slate-400">
          <span>Floor: 0.80</span>
          <span>{severedEdges.length > 0 ? `${severedEdges.length} edge${severedEdges.length > 1 ? "s" : ""} severed` : "No interventions"}</span>
        </div>
      </div>

      {/* Circular compliance gauges */}
      <div className="rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/60">
        <p className="text-[0.6rem] font-bold tracking-widest text-slate-400 mb-3">Compliance Metrics</p>
        <div className="flex justify-around items-start">
          <CircularGauge value={90} label="Consistency"  sub="Highly consistent" color="#6366f1" />
          <CircularGauge value={90} label="Regularity"   sub="Regular audits"    color="#0891b2" />
          <CircularGauge value={80} label="Robustness"   sub="Adversarial tests"  color="#10b981" />
        </div>
      </div>

      {/* Evidence feed */}
      <div className="flex-1 overflow-hidden rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div className={cn("h-1.5 w-1.5 rounded-full", running ? "bg-indigo-500 animate-pulse" : "bg-emerald-500 animate-pulse")} />
            <span className="text-[0.6rem] font-bold tracking-widest text-slate-500 dark:text-slate-400">Evidence Ledger</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition-colors">
              <Download className="h-3 w-3" />
            </button>
            <Badge variant="secondary" className="text-[0.58rem] h-4 px-1.5">
              {entries.length} events
            </Badge>
          </div>
        </div>
        <EvidenceFeed entries={entries} />
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function DashboardPage() {
  const [activeScenario, setActiveScenario]   = useState<ScenarioConfig | null>(null)
  const [running,        setRunning]           = useState(false)
  const [severedEdges,   setSeveredEdges]      = useState<string[]>([])
  const ledgerEntries = useLiveData(() => ledgerService.getRecent(6), ["ledger"])
  const [testResult,     setTestResult]        = useState<{ outcome: string; fairness: number } | null>(null)
  const [graphVisible,   setGraphVisible]      = useState(false)
  const [showTour,       setShowTour]          = useState(false)
  const [tourStep,       setTourStep]          = useState(0)


  const runScenario = useCallback(async () => {
    if (!activeScenario) return
    setRunning(true)
    setSeveredEdges([])
    setTestResult(null)

    await new Promise(r => setTimeout(r, 600))
    toast.info("Scanning application for proxy variables...", { duration: 2000 })

    await new Promise(r => setTimeout(r, 800))
    if (activeScenario.proxiesDetected > 0) {
      toast.warning(`${activeScenario.proxiesDetected} proxy variable(s) detected!`, { duration: 3000 })
      for (const edge of activeScenario.graphSeveredEdges) {
        await new Promise(r => setTimeout(r, 400))
        setSeveredEdges(prev => [...prev, edge])
        toast.info(`Severing: ${edge}`, { duration: 1500 })
      }
    } else {
      toast.success("No proxy variables detected — clean application", { duration: 2000 })
    }

    await new Promise(r => setTimeout(r, 700))
    try {
      const result = await scenarioService.runScenario(activeScenario.id)
      setTestResult({ outcome: result.outcome, fairness: result.fairnessScore })

      if (result.outcome === "approved") {
        toast.success(`Application APPROVED — Fairness score: ${(result.fairnessScore * 100).toFixed(0)}%`, { duration: 4000 })
      } else if (result.outcome === "escalated") {
        toast.error(`Application ESCALATED — ${result.proxiesDetected} proxy attack blocked`, { duration: 4000 })
      } else {
        toast.info(`Application result: ${result.outcome.toUpperCase()}`, { duration: 3000 })
      }
    } catch (error) {
      toast.error("Failed to process scenario")
      console.error(error)
    }

    setRunning(false)
  }, [activeScenario])

  const handleScenarioSelect = (id: DemoScenario) => {
    setActiveScenario(DEMO_SCENARIOS[id])
    setSeveredEdges([])
    setTestResult(null)
    setRunning(false)
  }

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-full overflow-y-auto lg:overflow-hidden">

      {/* ── Left Column: Controls ─────────────────────────────────────── */}
      <div className="flex w-full lg:w-72 shrink-0 flex-col border-b lg:border-b-0 lg:border-r border-border/60 bg-muted/20">
        <ComplianceControlsPanel
          scenario={activeScenario}
          onRun={runScenario}
          running={running}
          activeScenario={activeScenario}
          onScenarioSelect={handleScenarioSelect}
          testResult={testResult}
          onStartTour={() => {
            setTourStep(0)
            setShowTour(true)
          }}
        />
      </div>

      {/* ── Center Column: Analytics ──────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-visible lg:overflow-hidden">
        {/* ── Brand Signature Display ── */}
        <div className="bg-card px-5 py-4 border-b border-border/40 flex items-center justify-between shrink-0">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold tracking-tight text-foreground">Disparate Impact Analysis</h2>
            <p className="text-[0.65rem] text-muted-foreground font-mono uppercase tracking-wider">Adverse Impact Ratio — Operational Dashboard</p>
          </div>
        </div>

        {/* ── Fairness wave + mini-stats row ── */}
        <div className="border-b border-border/60 bg-card px-5 py-3 shrink-0">
          <div className="flex items-center gap-4">
            {/* Metric tiles */}
            <div className="flex flex-col gap-1.5 shrink-0">
              <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/50 px-2.5 py-1.5">
                <span style={{ color: "#6366f1" }}><Activity className="h-3 w-3" /></span>
                <div>
                  <p className="text-sm font-black tabular-nums leading-none" style={{ color: "#6366f1" }}>{Object.keys(DEMO_SCENARIOS).length}</p>
                  <p className="mt-0.5 text-[0.58rem] font-semibold tracking-wider text-slate-400 leading-none">Scenarios</p>
                </div>
                <span className="ml-1"><TrendingUp className="h-2.5 w-2.5 text-emerald-500" /></span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/50 px-2.5 py-1.5">
                <span style={{ color: severedEdges.length > 0 ? "#ef4444" : "#6366f1" }}><Zap className="h-3 w-3" /></span>
                <div>
                  <p className="text-sm font-black tabular-nums leading-none" style={{ color: severedEdges.length > 0 ? "#ef4444" : "#6366f1" }}>{severedEdges.length}</p>
                  <p className="mt-0.5 text-[0.58rem] font-semibold tracking-wider text-slate-400 leading-none">Interventions</p>
                </div>
                <span className="ml-1">{severedEdges.length > 0 ? <TrendingDown className="h-2.5 w-2.5 text-rose-500" /> : <Minus className="h-2.5 w-2.5 text-slate-400" />}</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/50 px-2.5 py-1.5">
                <span style={{ color: "#10b981" }}><Scale className="h-3 w-3" /></span>
                <div>
                  <p className="text-sm font-black tabular-nums leading-none" style={{ color: "#10b981" }}>{DAILY_STATS.fairnessScore.toFixed(2)}</p>
                  <p className="mt-0.5 text-[0.58rem] font-semibold tracking-wider text-slate-400 leading-none">AIR</p>
                </div>
                <span className="ml-1"><TrendingUp className="h-2.5 w-2.5 text-emerald-500" /></span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/50 px-2.5 py-1.5">
                <span style={{ color: "#0ea5e9" }}><Scale className="h-3 w-3" /></span>
                <div>
                  <p className="text-sm font-black tabular-nums leading-none" style={{ color: "#0ea5e9" }}>{Math.max(0, 1 - DAILY_STATS.fairnessScore).toFixed(2)}</p>
                  <p className="mt-0.5 text-[0.58rem] font-semibold tracking-wider text-slate-400 leading-none">SPD</p>
                </div>
                <span className="ml-1"><TrendingDown className="h-2.5 w-2.5 text-emerald-500" /></span>
              </div>
            </div>

            {/* Fairness wave chart */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <p className="text-[0.6rem] font-bold tracking-widest text-slate-400">Fairness Trend</p>
                  <span className="text-[0.6rem] text-slate-400">NOV 2025 – MAY 2026</span>
                  <div className="flex items-center gap-1 ml-1">
                    <div className="h-0.5 w-3 rounded bg-indigo-500" />
                    <span className="text-[0.58rem] text-slate-400">Score</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-px w-3 border-t border-dashed border-slate-400" />
                    <span className="text-[0.58rem] text-slate-400">CFPB Floor</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {running && (
                    <span className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[0.6rem] font-bold text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                      <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                      Live Auditing
                    </span>
                  )}
                  {severedEdges.length > 0 && (
                    <Badge variant="outline" className="border-rose-200 text-rose-600 dark:border-rose-900 dark:text-rose-400 text-[0.58rem] h-5 px-1.5">
                      {severedEdges.length} severed
                    </Badge>
                  )}
                  <button
                    onClick={() => { setSeveredEdges([]); setActiveScenario(null); setTestResult(null) }}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setGraphVisible(v => !v)}
                    className="rounded border border-slate-200 px-2 py-0.5 text-[0.6rem] font-semibold text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 transition-colors"
                  >
                    {graphVisible ? "Hide Graph" : "Show Graph"}
                  </button>
                </div>
              </div>
              <div className="h-[80px]">
                <FairnessWaveChart running={running} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Causal Graph Section ── */}
        <div className="border-b border-border/60 bg-card px-5 py-3 transition-all shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="h-3 w-3 text-indigo-500" />
              <span className="text-[0.65rem] font-bold text-slate-500 dark:text-slate-400">
                {graphVisible 
                  ? `Causal Graph — ${DATA_VOLUME.featuresPerDecision} features` 
                  : "Feature Dependency Graph — 82 variables mapped"}
              </span>
              {graphVisible && (
                <Badge variant="outline" className="border-indigo-200 text-indigo-600 dark:border-indigo-900 dark:text-indigo-400 text-[0.58rem]">
                  {DATA_VOLUME.featuresRange.min}–{DATA_VOLUME.featuresRange.max} range
                </Badge>
              )}
            </div>
            <button
              onClick={() => setGraphVisible(v => !v)}
              className="text-[0.65rem] font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors flex items-center gap-1"
            >
              {graphVisible ? "Hide Feature Graph" : "Show Feature Graph"}
            </button>
          </div>
          {graphVisible && (
            <div className="mt-3 overflow-hidden" style={{ height: "230px" }}>
              <CausalGraph severedEdges={severedEdges} running={running} />
            </div>
          )}
        </div>

        {/* ── Applicant Decisions Table ── */}
        <div className="flex-1 overflow-hidden bg-card">
          <ApplicantTable activeScenario={activeScenario} />
        </div>
      </div>

      {/* ── Right Column: Insights ────────────────────────────────────── */}
      <div className="flex w-full lg:w-72 shrink-0 flex-col border-t lg:border-t-0 lg:border-l border-border/60 bg-muted/20 px-3 py-3">
        <InsightsPanel
          entries={ledgerEntries}
          severedEdges={severedEdges}
          activeScenario={activeScenario}
          running={running}
        />
      </div>
      
      {/* Onboarding Tour Overlay */}
      {showTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-sm rounded-xl border border-slate-100 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900/95 animate-fade-slide-up">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AvarentLogo className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Meridian Tour</span>
              </div>
              <span className="text-[0.65rem] font-bold text-slate-400">Step {tourStep + 1} of 4</span>
            </div>
            
            {tourStep === 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Welcome to Meridian</h3>
                <p className="mt-2 text-[0.7rem] leading-relaxed text-slate-500 dark:text-slate-400">
                  Meridian is a high-density, authoritative console designed for real-time model risk management and fair lending auditing. Let's take a quick 4-step tour to get familiar with the 3-column operational layout.
                </p>
              </div>
            )}

            {tourStep === 1 && (
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">1. Red-Team & Simulation Controls</h3>
                <p className="mt-2 text-[0.7rem] leading-relaxed text-slate-500 dark:text-slate-400">
                  The Left Column is your simulation bay. Here you can load active Good-Faith or Bad-Faith borrower profiles, select credit scenarios, adjust model sensitivities, and test automated compliance scanning in real-time.
                </p>
              </div>
            )}

            {tourStep === 2 && (
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">2. Causal Interventions & Decision Ledger</h3>
                <p className="mt-2 text-[0.7rem] leading-relaxed text-slate-500 dark:text-slate-400">
                  The Center Column tracks immediate telemetry. Watch historical Fairness trends, expand the **Feature Dependency Graph** to inspect proxy pathway severings, and audit the live, monospaced **Applicant Table** decisions.
                </p>
              </div>
            )}

            {tourStep === 3 && (
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">3. Compliance Metrics & Sealed Ledger</h3>
                <p className="mt-2 text-[0.7rem] leading-relaxed text-slate-500 dark:text-slate-400">
                  The Right Column is the MRM telemetry system. It displays aggregated decimals for **AIR** (Adverse Impact Ratio) and **SPD** (Statistical Parity Difference) side-by-side alongside an active chronological feed of cryptographically **Audit Sealed** proofs.
                </p>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between border-t pt-3 dark:border-slate-800">
              <button
                onClick={() => {
                  localStorage.setItem("meridian_tour_completed", "true")
                  setShowTour(false)
                }}
                className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 dark:hover:text-slate-350"
              >
                Skip Tour
              </button>
              <div className="flex gap-2">
                {tourStep > 0 && (
                  <button
                    onClick={() => setTourStep(s => s - 1)}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[0.65rem] font-bold text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-750 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={() => {
                    if (tourStep < 3) {
                      setTourStep(s => s + 1)
                    } else {
                      localStorage.setItem("meridian_tour_completed", "true")
                      setShowTour(false)
                      toast.success("Meridian System Tour Complete!", {
                        description: "You are ready to audit and enforce model fairness."
                      })
                    }
                  }}
                  className="rounded-md bg-primary px-3 py-1.5 text-[0.65rem] font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {tourStep === 3 ? "Complete" : "Next"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
