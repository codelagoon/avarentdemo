import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Play,
  Square,
  Download
} from "lucide-react"
import { 
  ResponsiveContainer, 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  ReferenceLine,
  ReferenceDot
} from "recharts"
import { fairnessDriftService, type DriftAlert, type ParityMonitor } from "@/services/fairnessDriftService"
import { cn } from "@/lib/utils"

// Gauge Chart Component for DPD
function DPDGauge({ value, threshold, status }: { value: number; threshold: number; status: string }) {
  const percentage = Math.min((value / (threshold * 2)) * 100, 100)
  const color = status === "critical" ? "#ef4444" : status === "warning" ? "#f59e0b" : "#22c55e"
  void percentage // Used for strokeDasharray calculation
  
  return (
    <div className="relative w-48 h-24 mx-auto">
      {/* Gauge Background */}
      <svg viewBox="0 0 100 50" className="w-full h-full">
        {/* Background arc */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${percentage * 1.26} 126`}
          className="transition-all duration-500"
        />
        {/* Threshold marker */}
        <line
          x1={50 + 35 * Math.cos((1 - threshold / (threshold * 2)) * Math.PI)}
          y1={50 - 35 * Math.sin((1 - threshold / (threshold * 2)) * Math.PI)}
          x2={50 + 45 * Math.cos((1 - threshold / (threshold * 2)) * Math.PI)}
          y2={50 - 45 * Math.sin((1 - threshold / (threshold * 2)) * Math.PI)}
          stroke="#6b7280"
          strokeWidth="2"
        />
      </svg>
      
      {/* Value Display */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
        <p className="text-2xl font-bold" style={{ color }}>
          {(value * 100).toFixed(1)}%
        </p>
        <p className="text-xs text-muted-foreground">ΔDPD</p>
      </div>
    </div>
  )
}

// Alert Item Component
function AlertItem({ alert, onAcknowledge }: { alert: DriftAlert; onAcknowledge: (id: string) => void }) {
  const icons = {
    critical: AlertTriangle,
    high: AlertTriangle,
    warning: Activity,
  }
  const Icon = icons[alert.severity]
  
  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg border",
      alert.severity === "critical" && "bg-red-50 border-red-200",
      alert.severity === "high" && "bg-orange-50 border-orange-200",
      alert.severity === "warning" && "bg-yellow-50 border-yellow-200",
    )}>
      <Icon className={cn(
        "h-5 w-5 shrink-0 mt-0.5",
        alert.severity === "critical" && "text-red-600",
        alert.severity === "high" && "text-orange-600",
        alert.severity === "warning" && "text-yellow-600",
      )} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge variant={alert.severity === "critical" ? "destructive" : "secondary"} className="text-xs">
            {alert.severity.toUpperCase()}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(alert.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <p className="text-sm font-medium mt-1">
          {alert.metric} = {(alert.currentValue * 100).toFixed(2)}%
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Δ{(alert.delta * 100).toFixed(2)}% above threshold
        </p>
        <p className="text-xs mt-1.5">{alert.recommendedAction}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onAcknowledge(alert.id)}
        className="shrink-0"
      >
        Ack
      </Button>
    </div>
  )
}

// Main Fairness Drift Panel
export function FairnessDriftPanel() {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [monitor, setMonitor] = useState<ParityMonitor | null>(null)
  const [alerts, setAlerts] = useState<DriftAlert[]>([])
  const [scatterData, setScatterData] = useState<{ x: number; y: number; label: string }[]>([])

  useEffect(() => {
    // Initial load
    setMonitor(fairnessDriftService.getParityMonitor())
    setAlerts(fairnessDriftService.getActiveAlerts())
    setScatterData(fairnessDriftService.getAccuracyFairnessData())
    
    // Check monitoring status
    setIsMonitoring(fairnessDriftService.isActive())
    
    // Refresh interval
    const interval = setInterval(() => {
      setMonitor(fairnessDriftService.getParityMonitor())
      setAlerts(fairnessDriftService.getActiveAlerts())
      setScatterData(fairnessDriftService.getAccuracyFairnessData())
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const toggleMonitoring = () => {
    if (isMonitoring) {
      fairnessDriftService.stopMonitoring()
    } else {
      fairnessDriftService.startMonitoring(30000)
    }
    setIsMonitoring(!isMonitoring)
  }

  const handleAcknowledge = (id: string) => {
    fairnessDriftService.acknowledgeAlert(id)
    setAlerts(fairnessDriftService.getActiveAlerts())
  }

  const exportReport = () => {
    const report = fairnessDriftService.generateDriftReport()
    const blob = new Blob([report], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `fairness-drift-report-${new Date().toISOString().split("T")[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Sample data if empty
  const displayData = scatterData.length > 0 ? scatterData : [
    { x: 0.85, y: 0.82, label: "Baseline" },
    { x: 0.87, y: 0.80, label: "Week 1" },
    { x: 0.89, y: 0.78, label: "Week 2" },
    { x: 0.91, y: 0.75, label: "Week 3" },
    { x: 0.88, y: 0.79, label: "Current" },
  ]

  const currentPoint = displayData[displayData.length - 1]

  return (
    <div className="space-y-4">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Fairness Drift Monitor</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="monitoring-toggle"
              checked={isMonitoring}
              onCheckedChange={toggleMonitoring}
            />
            <Label htmlFor="monitoring-toggle" className="text-sm">
              {isMonitoring ? (
                <span className="flex items-center gap-1.5 text-green-600">
                  <Play className="h-3.5 w-3.5" /> Monitoring
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Square className="h-3.5 w-3.5" /> Paused
                </span>
              )}
            </Label>
          </div>
          <Button variant="outline" size="sm" onClick={exportReport}>
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Parity Monitor Gauge */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Parity Monitor
              {monitor?.trend === "improving" && <TrendingUp className="h-4 w-4 text-green-500" />}
              {monitor?.trend === "degrading" && <TrendingDown className="h-4 w-4 text-red-500" />}
              {monitor?.trend === "stable" && <Minus className="h-4 w-4 text-gray-500" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DPDGauge 
              value={monitor?.currentDPD || 0} 
              threshold={0.05}
              status={monitor?.status || "normal"}
            />
            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              <div className="bg-secondary/50 rounded p-2">
                <p className="text-xs text-muted-foreground">Baseline</p>
                <p className="text-sm font-semibold">
                  {((monitor?.baselineDPD || 0) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-secondary/50 rounded p-2">
                <p className="text-xs text-muted-foreground">Threshold</p>
                <p className="text-sm font-semibold">5.0%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accuracy-Fairness Scatter Plot */}
        <Card className="col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Accuracy vs Fairness Trade-off
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 30, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name="Accuracy" 
                    domain={[0.7, 1]}
                    tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                    label={{ value: "Accuracy", position: "bottom", offset: 0, fontSize: 12 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name="Fairness" 
                    domain={[0.7, 1]}
                    tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                    label={{ value: "Fairness", angle: -90, position: "insideLeft", fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => `${((value as number) * 100).toFixed(1)}%`}
                    labelFormatter={(_, payload) => (payload?.[0] as { payload?: { label?: string } })?.payload?.label || ""}
                  />
                  <ReferenceLine x={0.85} stroke="#9ca3af" strokeDasharray="3 3" />
                  <ReferenceLine y={0.8} stroke="#9ca3af" strokeDasharray="3 3" />
                  <Scatter data={displayData.slice(0, -1)} fill="#3b82f6" />
                  <ReferenceDot 
                    x={currentPoint?.x || 0.85} 
                    y={currentPoint?.y || 0.82} 
                    r={8} 
                    fill="#ef4444" 
                    stroke="white"
                    strokeWidth={2}
                    label={{ value: "Current", position: "top", fontSize: 10 }}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span>Active Alerts ({alerts.length})</span>
            {alerts.length === 0 && (
              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                <CheckCircle className="h-3 w-3 mr-1" />
                All Clear
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm">No active fairness drift alerts</p>
              <p className="text-xs mt-1">System operating within normal parameters</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {alerts.map((alert) => (
                <AlertItem 
                  key={alert.id} 
                  alert={alert} 
                  onAcknowledge={handleAcknowledge}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
