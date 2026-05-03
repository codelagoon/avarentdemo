import { useState, useEffect, useRef, useCallback } from "react"
import { Play, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Shield, Zap, ChevronDown, Hash, Clock, Activity, RefreshCw, Download, Info, Boxes, Scale, Database } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
  DEMO_SCENARIOS, DAILY_STATS, DATA_VOLUME,
  type DemoScenario, type ScenarioConfig, type LedgerEntry, type LedgerEventType
} from "@/data/mockData"
import { ledgerService } from "@/services/ledgerService"
import { scenarioService } from "@/services/scenarioService"
import { DataImportDialog } from "@/components/DataImportDialog"
import { ApiKeyDialog } from "@/components/ApiKeyDialog"

// ─── Status pill helpers ─────────────────────────────────────────────────────
function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    critical: "bg-destructive/10 text-destructive border-destructive/20",
    high: "bg-orange-50 text-orange-700 border-orange-200",
    medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
    low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  }
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide", map[severity] ?? map.low)}>
      {severity}
    </span>
  )
}

function DecisionBadge({ decision }: { decision: string }) {
  const map: Record<string, string> = {
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    denied: "bg-destructive/10 text-destructive border-destructive/20",
    under_review: "bg-yellow-50 text-yellow-700 border-yellow-200",
    escalated: "bg-orange-50 text-orange-700 border-orange-200",
  }
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide", map[decision] ?? "bg-muted text-muted-foreground border-border")}>
      {decision.replace("_", " ")}
    </span>
  )
}

function EventTypeBadge({ type }: { type: LedgerEventType }) {
  const map: Record<LedgerEventType, { label: string; cls: string }> = {
    decision: { label: "Decision", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    intervention: { label: "Intervention", cls: "bg-orange-50 text-orange-700 border-orange-200" },
    proof_signed: { label: "Proof Signed", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    alert: { label: "Alert", cls: "bg-destructive/10 text-destructive border-destructive/20" },
    audit: { label: "Audit", cls: "bg-secondary text-muted-foreground border-border" },
  }
  const { label, cls } = map[type]
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold", cls)}>
      {label}
    </span>
  )
}

// ─── Professional Stat Cards ──────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, accent = false, trend }: {
  label: string; value: string | number; sub?: string; 
  icon: React.ComponentType<{ className?: string }>; accent?: boolean;
  trend?: "up" | "down" | "neutral"
}) {
  return (
    <Card className={cn(
      "border-0 shadow-sm transition-all duration-200 hover:shadow-md",
      accent ? "bg-gradient-to-br from-primary/5 to-primary/10" : "bg-white"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500 truncate">
              {label}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className={cn(
                "text-2xl font-bold tracking-tight tabular-nums",
                accent ? "text-primary" : "text-slate-900"
              )}>
                {value}
              </p>
              {trend && (
                <span className={cn(
                  "text-xs font-medium",
                  trend === "up" ? "text-emerald-600" : 
                  trend === "down" ? "text-red-600" : "text-slate-400"
                )}>
                  {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
                </span>
              )}
            </div>
            {sub && <p className="mt-1 text-[0.7rem] text-slate-400">{sub}</p>}
          </div>
          <div className={cn(
            "shrink-0 rounded-lg p-2",
            accent ? "bg-primary/15" : "bg-slate-100"
          )}>
            <Icon className={cn("h-4 w-4", accent ? "text-primary" : "text-slate-500")} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Causal Graph ─────────────────────────────────────────────────────────────
interface GraphNode {
  id: string; label: string; x: number; y: number; type: "input" | "model" | "output" | "proxy" | "severed"
}
interface GraphEdge {
  from: string; to: string; severed?: boolean; animating?: boolean
}

function CausalGraph({ severedEdges, running }: { severedEdges: string[]; running: boolean }) {
  const canvasRef = useRef<SVGSVGElement>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setTick(p => p + 1), 80)
    return () => clearInterval(t)
  }, [running])

  const nodes: GraphNode[] = [
    { id: "income", label: "Income", x: 60, y: 80, type: "input" },
    { id: "credit_score", label: "Credit Score", x: 60, y: 140, type: "input" },
    { id: "employment", label: "Employment", x: 60, y: 200, type: "input" },
    { id: "loan_amount", label: "Loan Amount", x: 60, y: 260, type: "input" },
    { id: "zip_code", label: "ZIP Code", x: 60, y: 320, type: severedEdges.includes("zip_code -> risk_score") || severedEdges.includes("zip_code -> credit_decision") ? "severed" : "proxy" },
    { id: "neighborhood", label: "Neighborhood", x: 60, y: 370, type: severedEdges.includes("neighborhood_score -> approval_gate") ? "severed" : "proxy" },
    { id: "school_dist", label: "School Dist.", x: 60, y: 420, type: severedEdges.includes("school_district -> creditworthiness") ? "severed" : "proxy" },
    { id: "risk_model", label: "Risk Model", x: 210, y: 160, type: "model" },
    { id: "fairness_layer", label: "Fairness Layer", x: 210, y: 260, type: "model" },
    { id: "causal_engine", label: "Causal Engine", x: 210, y: 340, type: "model" },
    { id: "credit_decision", label: "Credit Decision", x: 370, y: 200, type: "output" },
    { id: "proof_bundle", label: "Proof Bundle", x: 370, y: 300, type: "output" },
  ]

  const edges: GraphEdge[] = [
    { from: "income", to: "risk_model" },
    { from: "credit_score", to: "risk_model" },
    { from: "employment", to: "risk_model" },
    { from: "loan_amount", to: "risk_model" },
    { from: "zip_code", to: "risk_model", severed: severedEdges.includes("zip_code -> risk_score") || severedEdges.includes("zip_code -> credit_decision") },
    { from: "neighborhood", to: "fairness_layer", severed: severedEdges.includes("neighborhood_score -> approval_gate") },
    { from: "school_dist", to: "causal_engine", severed: severedEdges.includes("school_district -> creditworthiness") },
    { from: "risk_model", to: "fairness_layer" },
    { from: "fairness_layer", to: "causal_engine" },
    { from: "fairness_layer", to: "credit_decision" },
    { from: "causal_engine", to: "credit_decision" },
    { from: "causal_engine", to: "proof_bundle" },
    { from: "risk_model", to: "credit_decision" },
  ]

  const getNode = (id: string) => nodes.find(n => n.id === id)!

  const nodeColor: Record<string, string> = {
    input: "oklch(0.35 0.065 255)",
    model: "oklch(0.42 0.09 195)",
    output: "oklch(0.35 0.065 255)",
    proxy: "oklch(0.65 0.18 85)",
    severed: "oklch(0.577 0.245 27.325)",
  }

  const pulseRadius = running ? 4 + Math.sin(tick * 0.2) * 1.5 : 4

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border bg-card">
      {/* Grid background */}
      <svg
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 460 480"
        preserveAspectRatio="xMidYMid meet"
        data-testid="causal-graph"
      >
        {/* Grid */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="oklch(0.91 0.008 247)" strokeWidth="0.5" />
          </pattern>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="oklch(0.75 0.008 247)" />
          </marker>
          <marker id="arrowhead-severed" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="oklch(0.577 0.245 27.325)" />
          </marker>
        </defs>
        <rect width="460" height="480" fill="url(#grid)" />

        {/* Label areas */}
        <text x="110" y="20" fontSize="8" fill="oklch(0.52 0.018 255)" fontFamily="IBM Plex Sans" fontWeight="500" letterSpacing="2">INPUT FEATURES</text>
        <text x="187" y="20" fontSize="8" fill="oklch(0.52 0.018 255)" fontFamily="IBM Plex Sans" fontWeight="500" letterSpacing="2">MODEL LAYERS</text>
        <text x="342" y="20" fontSize="8" fill="oklch(0.52 0.018 255)" fontFamily="IBM Plex Sans" fontWeight="500" letterSpacing="2">OUTPUTS</text>
        <line x1="155" y1="30" x2="155" y2="470" stroke="oklch(0.91 0.008 247)" strokeWidth="1" strokeDasharray="4,4" />
        <line x1="320" y1="30" x2="320" y2="470" stroke="oklch(0.91 0.008 247)" strokeWidth="1" strokeDasharray="4,4" />

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
                d={`M ${from.x + 30} ${from.y} C ${mx + 10} ${from.y}, ${mx - 10} ${to.y}, ${to.x - 30} ${to.y}`}
                fill="none"
                stroke={isSevered ? "oklch(0.577 0.245 27.325)" : running ? "oklch(0.42 0.09 195)" : "oklch(0.78 0.008 247)"}
                strokeWidth={isSevered ? 1.5 : running ? 1.5 : 1}
                strokeDasharray={isSevered ? "4,4" : "none"}
                opacity={isSevered ? 0.6 : 0.8}
                markerEnd={isSevered ? "url(#arrowhead-severed)" : "url(#arrowhead)"}
              />
              {isSevered && (
                <text
                  x={mx}
                  y={(from.y + to.y) / 2 - 4}
                  fontSize="7"
                  fill="oklch(0.577 0.245 27.325)"
                  textAnchor="middle"
                  fontFamily="IBM Plex Mono"
                  fontWeight="600"
                >
                  SEVERED
                </text>
              )}
            </g>
          )
        })}

        {/* Nodes */}
        {nodes.map(node => {
          const color = nodeColor[node.type]
          const isProxy = node.type === "proxy" || node.type === "severed"
          const isPulsing = running && (node.type === "model" || node.type === "output")
          return (
            <g key={node.id} data-testid={`graph-node-${node.id}`}>
              {isPulsing && (
                <circle cx={node.x} cy={node.y} r={pulseRadius + 8} fill={color} opacity={0.12} />
              )}
              <rect
                x={node.x - 30}
                y={node.y - 12}
                width={60}
                height={24}
                rx={4}
                fill={color}
                opacity={node.type === "severed" ? 0.35 : 0.9}
                stroke={node.type === "severed" ? "oklch(0.577 0.245 27.325)" : "none"}
                strokeWidth={node.type === "severed" ? 1.5 : 0}
                strokeDasharray={node.type === "severed" ? "3,2" : "none"}
              />
              <text
                x={node.x}
                y={node.y + 4}
                fontSize={isProxy ? 7.5 : 8}
                fill="white"
                textAnchor="middle"
                fontFamily="IBM Plex Sans"
                fontWeight="600"
                opacity={node.type === "severed" ? 0.7 : 1}
              >
                {node.label}
              </text>
            </g>
          )
        })}

        {/* Running indicator */}
        {running && (
          <g>
            <circle cx={430} cy={460} r={5} fill="oklch(0.55 0.15 195)" opacity={0.9 + Math.sin(tick * 0.3) * 0.1} />
            <text x={418} y={457} fontSize="7" fill="oklch(0.42 0.09 195)" textAnchor="end" fontFamily="IBM Plex Mono">
              ACTIVE
            </text>
          </g>
        )}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex items-center gap-3 rounded-md border bg-card/90 px-2 py-1 backdrop-blur-sm">
        {[
          { label: "Input", color: "bg-blue-600" },
          { label: "Model", color: "bg-primary" },
          { label: "Output", color: "bg-blue-600" },
          { label: "Proxy", color: "bg-amber-500" },
          { label: "Severed", color: "bg-destructive" },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1">
            <div className={cn("h-2 w-2 rounded-sm", item.color)} />
            <span className="text-[0.6rem] text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Evidence Feed ────────────────────────────────────────────────────────────
function EvidenceFeed({ entries }: { entries: LedgerEntry[] }) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between px-1 pb-2">
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          <span className="text-xs font-semibold text-foreground">Live Feed</span>
        </div>
        <Badge variant="secondary" className="text-[0.6rem]">
          {entries.length} events
        </Badge>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1.5">
        {entries.map((entry, i) => (
          <div
            key={entry.id}
            className={cn(
              "rounded-md border bg-card p-2.5 transition-all",
              i === 0 ? "animate-ledger-in border-primary/20 shadow-sm" : ""
            )}
            data-testid={`ledger-entry-${entry.id}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1 mb-1">
                  <EventTypeBadge type={entry.eventType} />
                  {entry.decision && <DecisionBadge decision={entry.decision} />}
                  {entry.severity && <SeverityBadge severity={entry.severity} />}
                </div>
                <p className="text-xs font-medium text-foreground truncate">{entry.applicantName}</p>
                <p className="text-[0.65rem] text-muted-foreground truncate">{entry.message}</p>
                <p className="text-[0.6rem] text-primary/70 mt-0.5">
                  Based on {DATA_VOLUME.featuresPerDecision} features • {entry.interventionType ? "1" : "0"} intervention{entry.interventionType ? "" : "s"} applied
                </p>
              </div>
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="font-mono text-[0.6rem] text-muted-foreground truncate max-w-[120px]" title={entry.hash}>
                #{entry.hash.slice(0, 16)}…
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <span className="font-mono text-[0.6rem] text-primary font-medium">
                  {(entry.fairnessScore * 100).toFixed(0)}%
                </span>
                <span className="text-[0.6rem] text-muted-foreground">fair</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Red Team Console ─────────────────────────────────────────────────────────
function RedTeamConsole({
  scenario,
  onRun,
  running,
}: {
  scenario: ScenarioConfig | null
  onRun: () => void
  running: boolean
}) {
  const [enableProxyScan, setEnableProxyScan] = useState(true)
  const [enableDoCalc, setEnableDoCalc] = useState(true)
  const [enableHashChain, setEnableHashChain] = useState(true)
  const [loanType, setLoanType] = useState("mortgage")
  const [modelSensitivity, setModelSensitivity] = useState("balanced")

  return (
    <div className="flex h-full flex-col gap-3" data-testid="red-team-console">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wide text-foreground">Red Team Console</span>
        </div>
        <Badge variant="outline" className="text-[0.6rem] border-primary/30 text-primary">
          ADVERSARIAL
        </Badge>
      </div>

      {/* Data volume indicator */}
      <div className="flex items-center gap-2 rounded-md bg-primary/5 border border-primary/10 px-2.5 py-1.5">
        <Database className="h-3 w-3 text-primary" />
        <span className="text-[0.65rem] text-foreground">
          Using <span className="font-semibold text-primary">{DATA_VOLUME.featuresPerDecision}</span> data points for this decision
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-[0.65rem]">Optimal range: {DATA_VOLUME.featuresRange.min}–{DATA_VOLUME.featuresRange.max} features per decision. 82 provides the best balance of accuracy, explainability, and low proxy risk.</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Applicant info */}
      {scenario ? (
        <div className="rounded-md border bg-secondary/40 p-2.5">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Applicant Profile
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {[
              ["Name", scenario.applicantName],
              ["ID", scenario.applicantId],
              ["Loan", scenario.loanType],
              ["Amount", `$${scenario.loanAmount.toLocaleString()}`],
              ["Income", `$${scenario.income.toLocaleString()}/yr`],
              ["Credit", scenario.creditScore.toString()],
              ["ZIP", scenario.zipCode],
              ["Employment", `${scenario.employmentYears} yrs`],
            ].map(([k, v]) => (
              <div key={k}>
                <span className="text-[0.6rem] text-muted-foreground">{k}: </span>
                <span className="font-mono text-[0.65rem] font-medium text-foreground">{v}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-dashed bg-secondary/20 p-4 text-center">
          <Shield className="mx-auto mb-1.5 h-6 w-6 text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground">
            Select a Demo Scenario above to populate the console
          </p>
        </div>
      )}

      {/* Attack vector */}
      {scenario && scenario.attackVector && (
        <div className="rounded-md border border-orange-200 bg-orange-50 p-2">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3 text-orange-600" />
            <span className="text-[0.65rem] font-semibold text-orange-700">
              Attack Vector: {scenario.attackVector}
            </span>
          </div>
          {scenario.proxiesDetected > 0 && (
            <p className="mt-0.5 text-[0.6rem] text-orange-600">
              {scenario.proxiesDetected} proxy variable{scenario.proxiesDetected > 1 ? "s" : ""} injected
            </p>
          )}
        </div>
      )}

      <Separator />

      {/* Controls */}
      <div className="space-y-2">
        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
          Detection Controls
        </p>
        <div className="space-y-2">
          {[
            { label: "Proxy Variable Scanning", value: enableProxyScan, set: setEnableProxyScan, testId: "toggle-proxy-scan" },
            { label: "Do-Calculus Intervention", value: enableDoCalc, set: setEnableDoCalc, testId: "toggle-do-calc" },
            { label: "Hash-Chain Ledger Signing", value: enableHashChain, set: setEnableHashChain, testId: "toggle-hash-chain" },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <Label className="cursor-pointer text-xs text-foreground" htmlFor={item.testId}>
                {item.label}
              </Label>
              <Switch
                id={item.testId}
                checked={item.value}
                onCheckedChange={item.set}
                data-testid={item.testId}
                size="sm"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="mb-1 block text-[0.65rem] text-muted-foreground">Loan Type</Label>
          <Select value={loanType} onValueChange={setLoanType}>
            <SelectTrigger className="h-7 text-xs" data-testid="select-loan-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mortgage">Mortgage</SelectItem>
              <SelectItem value="auto">Auto Loan</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="business">Business</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1 block text-[0.65rem] text-muted-foreground">Sensitivity</Label>
          <Select value={modelSensitivity} onValueChange={setModelSensitivity}>
            <SelectTrigger className="h-7 text-xs" data-testid="select-sensitivity">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="strict">Strict</SelectItem>
              <SelectItem value="balanced">Balanced</SelectItem>
              <SelectItem value="lenient">Lenient</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        className="mt-auto w-full font-semibold"
        onClick={onRun}
        disabled={!scenario || running}
        data-testid="execute-adversarial-test"
        size="default"
      >
        {running ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Execute Adversarial Test
          </>
        )}
      </Button>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function DashboardPage() {
  const [activeScenario, setActiveScenario] = useState<ScenarioConfig | null>(null)
  const [running, setRunning] = useState(false)
  const [severedEdges, setSeveredEdges] = useState<string[]>([])
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([])
  const [testResult, setTestResult] = useState<{ outcome: string; fairness: number } | null>(null)

  // Load ledger entries on mount
  useEffect(() => {
    setLedgerEntries(ledgerService.getRecent(6))
  }, [])

  const runScenario = useCallback(async () => {
    if (!activeScenario) return
    setRunning(true)
    setSeveredEdges([])
    setTestResult(null)

    // Step 1: scanning
    await new Promise(r => setTimeout(r, 600))
    toast.info(`Scanning application for proxy variables…`, { duration: 2000 })

    // Step 2: proxy detection
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

    // Step 3: execute scenario and persist results
    await new Promise(r => setTimeout(r, 700))
    try {
      const result = await scenarioService.runScenario(activeScenario.id)
      setLedgerEntries(ledgerService.getRecent(6))
      setTestResult({ outcome: result.outcome, fairness: result.fairnessScore })

      // Step 4: result toast
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
    <div className="flex h-full flex-col gap-0 overflow-hidden bg-slate-50/50">
      {/* Professional Header */}
      <div className="border-b bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">AVARENT Sentinel</h1>
              <p className="text-[0.7rem] text-slate-500">Fair Lending Compliance Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[0.65rem] border-emerald-200 bg-emerald-50 text-emerald-700">
              System Operational
            </Badge>
            <span className="text-[0.65rem] text-slate-400">v2.4.1</span>
          </div>
        </div>
      </div>

      {/* Stats row - Professional KPIs */}
      <div className="grid grid-cols-5 gap-3 border-b border-slate-200 bg-white px-6 py-4">
        <StatCard label="Active Models" value={DAILY_STATS.modelsInProduction} icon={Boxes} trend="neutral" />
        <StatCard label="24h Audits" value={DAILY_STATS.auditsLast24h} icon={Clock} trend="up" />
        <StatCard label="Features / Decision" value={DATA_VOLUME.featuresPerDecision} sub="Optimal range" icon={Database} accent trend="up" />
        <StatCard label="Fairness Score" value={`${(DAILY_STATS.fairnessScore * 100).toFixed(1)}%`} icon={Scale} trend="up" />
        <StatCard label="Active Alerts" value={DAILY_STATS.openIncidents} icon={AlertTriangle} trend={DAILY_STATS.openIncidents > 0 ? "down" : "neutral"} />
      </div>

      {/* Demo Scenarios Bar - Professional */}
      <div className="flex items-center gap-4 border-b border-slate-200 bg-white px-6 py-3 shadow-sm" data-testid="demo-scenarios-bar">
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
            <Activity className="h-3 w-3 text-primary" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-700">Test Scenarios</span>
            <p className="text-[0.6rem] text-slate-400">Compliance validation suite</p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-slate-400 cursor-help hover:text-slate-600" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p className="font-medium text-sm mb-1">Interactive Testing</p>
              <p className="text-xs text-slate-600">Validate fair lending compliance with predefined scenarios</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Separator orientation="vertical" className="h-8 bg-slate-200" />
        <div className="flex items-center gap-2">
          <ApiKeyDialog />
          <DataImportDialog />
        </div>
        <Separator orientation="vertical" className="h-8 bg-slate-200" />
        <div className="flex items-center gap-2 flex-wrap">
          {(Object.values(DEMO_SCENARIOS) as ScenarioConfig[]).map(s => {
            const isActive = activeScenario?.id === s.id
            const colors = {
              good_faith: isActive ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700" : "border-emerald-300 text-emerald-700 hover:bg-emerald-50",
              mild_proxy: isActive ? "bg-amber-600 text-white border-amber-600 hover:bg-amber-700" : "border-amber-300 text-amber-700 hover:bg-amber-50",
              bad_faith: isActive ? "bg-destructive text-white border-destructive hover:bg-destructive/90" : "border-destructive/30 text-destructive hover:bg-destructive/5",
            }[s.id]
            return (
              <Tooltip key={s.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleScenarioSelect(s.id)}
                    data-testid={`scenario-${s.id}`}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-all duration-150",
                      colors
                    )}
                  >
                    {s.id === "good_faith" && <CheckCircle className="h-3.5 w-3.5" />}
                    {s.id === "mild_proxy" && <AlertTriangle className="h-3.5 w-3.5" />}
                    {s.id === "bad_faith" && <Shield className="h-3.5 w-3.5" />}
                    {s.label}
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-semibold">{s.label}</p>
                  <p className="text-xs opacity-80">{s.description}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
        {testResult && (
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">Last result:</span>
            <DecisionBadge decision={testResult.outcome} />
            <span className="font-mono text-xs font-medium text-primary">
              {(testResult.fairness * 100).toFixed(0)}% fair
            </span>
          </div>
        )}
      </div>

      {/* 3-column main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Red Team Console */}
        <div className="flex w-72 shrink-0 flex-col overflow-y-auto border-r bg-card px-4 py-4">
          <RedTeamConsole
            scenario={activeScenario}
            onRun={runScenario}
            running={running}
          />
        </div>

        {/* Center: Causal Graph */}
        <div className="flex flex-1 flex-col overflow-hidden px-4 py-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wide text-foreground">
                Causal Graph — {DATA_VOLUME.featuresPerDecision} features analyzed
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="border-primary/30 text-primary text-[0.6rem] cursor-help">
                    {DATA_VOLUME.featuresRange.min}–{DATA_VOLUME.featuresRange.max} range
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-[0.65rem]">{DATA_VOLUME.featuresPerDecision} features is the optimal sweet spot—enough for high accuracy while maintaining explainability and minimizing proxy variable risk.</p>
                </TooltipContent>
              </Tooltip>
              {running && (
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-semibold text-primary">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                  LIVE
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {severedEdges.length > 0 && (
                <Badge variant="outline" className="border-destructive/30 text-destructive text-[0.65rem]">
                  {severedEdges.length} edge{severedEdges.length > 1 ? "s" : ""} severed
                </Badge>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => { setSeveredEdges([]); setActiveScenario(null); setTestResult(null) }}
                    className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Reset graph</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Training data info */}
          <div className="mb-2 flex items-center gap-2 text-[0.6rem] text-muted-foreground">
            <Database className="h-3 w-3" />
            <span>Trained on {(DATA_VOLUME.trainingRecords / 1000000).toFixed(1)}M historical records</span>
            <span className="text-border">|</span>
            <span>Monthly batch: {(DATA_VOLUME.monthlyRetraining / 1000).toFixed(0)}K new applications</span>
          </div>

          {activeScenario ? (
            <div className="flex-1 overflow-hidden rounded-lg border shadow-sm">
              <CausalGraph severedEdges={severedEdges} running={running} />
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed bg-secondary/20">
              <Shield className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">Select a Demo Scenario to activate the causal graph</p>
              <p className="text-xs text-muted-foreground/60 mt-1">The graph will show real-time proxy detection and causal interventions</p>
              <div className="mt-4 flex gap-2">
                {(Object.values(DEMO_SCENARIOS) as ScenarioConfig[]).map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleScenarioSelect(s.id)}
                    className="rounded-md border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Intervention status bar */}
          {activeScenario && (
            <div className="mt-2 rounded-md border bg-card p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Fairness Score
                </span>
                <span className={cn(
                  "font-mono text-xs font-bold",
                  activeScenario.fairnessScore >= 0.9 ? "text-emerald-600" :
                  activeScenario.fairnessScore >= 0.75 ? "text-amber-600" : "text-destructive"
                )}>
                  {(activeScenario.fairnessScore * 100).toFixed(1)}%
                </span>
              </div>
              <Progress
                value={activeScenario.fairnessScore * 100}
                className="mt-1.5 h-1.5"
              />
              <div className="mt-1.5 flex items-center justify-between text-[0.6rem] text-muted-foreground">
                <span>CFPB 4/5ths rule: {activeScenario.fairnessScore >= 0.8 ? "Pass" : "Fail"}</span>
                <span>Scenario: {activeScenario.label}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Evidence Feed */}
        <div className="flex w-72 shrink-0 flex-col overflow-hidden border-l bg-card px-4 py-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wide text-foreground">
                Evidence Ledger
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                    <Download className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Export ledger</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>Hash-chained immutable ledger</TooltipContent>
              </Tooltip>
            </div>
          </div>
          <EvidenceFeed entries={ledgerEntries} />
        </div>
      </div>
    </div>
  )
}
