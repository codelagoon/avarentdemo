import React, { useState } from "react"
import { useLiveData } from "@/hooks/useLiveData"
import { Network, Link2, Link2Off, BadgePercent, Cpu, CheckCircle2, AlertTriangle, Plus, Layers, TrendingUp, Info, ChevronDown, ChevronUp } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { altDataService } from "@/services/altDataService"
import type { AltFeature } from "@/services/altDataService"
import { cn } from "@/lib/utils"

export function AltDataHubPage() {
  const state = useLiveData(() => altDataService.getState(), ["altData"])
  const [newVarName, setNewVarName] = useState("")
  const [newVarSource, setNewVarSource] = useState("Plaid")
  const [newVarCorrelation, setNewVarCorrelation] = useState("0.15")
  const [newVarIV, setNewVarIV] = useState("0.35")
  const [isScreening, setIsScreening] = useState(false)
  const [screeningProgress, setScreeningProgress] = useState(0)
  const [recentScreened, setRecentScreened] = useState<AltFeature | null>(null)

  // Accordion states
  const [isConnectorsExpanded, setIsConnectorsExpanded] = useState(true)
  const [isScreenerExpanded, setIsScreenerExpanded] = useState(true)
  const [isLibraryExpanded, setIsLibraryExpanded] = useState(true)
  const [isScorerExpanded, setIsScorerExpanded] = useState(true)

  const handleToggleConnector = (id: string) => {
    altDataService.toggleConnectorStatus(id)
    const conn = state.connectors.find(c => c.id === id)
    if (conn) {
      toast.success(`${conn.name} is now ${conn.status === "connected" ? "disconnected" : "connected"}`)
    }
  }

  const handleToggleQuarantine = (id: string, status: "approved" | "quarantined") => {
    altDataService.toggleFeatureQuarantine(id, status)
    toast.success(`Variable successfully ${status === "quarantined" ? "quarantined" : "approved"}`)
  }

  const handleScreenVariable = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newVarName.trim()) {
      toast.error("Please enter a variable name")
      return
    }

    setIsScreening(true)
    setScreeningProgress(0)

    const interval = setInterval(() => {
      setScreeningProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          const corr = parseFloat(newVarCorrelation)
          const iv = parseFloat(newVarIV)
          const { feature } = altDataService.screenNewFeature(
            newVarName.trim(),
            newVarSource,
            corr,
            iv
          )
          setRecentScreened(feature)
          setIsScreening(false)
          setNewVarName("")
          
          if (feature.status === "quarantined") {
            toast.error(`ALERT: Proxy variable detected! ${feature.name} quarantined due to high disparate impact risk (${feature.proxyRiskScore}/100).`)
          } else {
            toast.success(`Success: Variable ${feature.name} screened, cleared, and added to features library.`)
          }
          return 100
        }
        return prev + 20
      })
    }, 150)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden" data-testid="alt-data-hub">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 bg-card px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Network className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Alternative Data Integration Hub</h1>
            <p className="text-[0.7rem] text-muted-foreground">Secure integration of bank, asset, rent, and utility streams with dynamic proxy screening</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-1 font-mono text-[0.65rem] font-bold text-destructive">
            {state.quarantineCount} Quarantined
          </span>
          <span className="animate-pulse rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[0.65rem] font-bold text-emerald-600 dark:text-emerald-400">
            Screener Online
          </span>
        </div>
      </div>

      {/* Workspace Area */}
      <div className="flex-1 overflow-auto p-5 space-y-5">
        
        {/* Row 1: Connected APIs Grid & Dynamic Screening Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Connector Grid */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/60 shadow-sm">
              <button
                type="button"
                onClick={() => setIsConnectorsExpanded(!isConnectorsExpanded)}
                className="flex w-full items-center justify-between border-b border-border/40 px-5 py-3 text-left hover:bg-muted/20 transition-colors duration-100"
              >
                <div className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Regulated API Integrations</p>
                    <p className="text-[0.68rem] text-muted-foreground">Connected Plaid, Finicity, RentTrack, and utility providers</p>
                  </div>
                </div>
                {isConnectorsExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {isConnectorsExpanded && (
                <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {state.connectors.map(c => {
                    const isConnected = c.status === "connected"
                    return (
                      <div
                        key={c.id}
                        className={cn(
                          "p-4 rounded-xl border flex items-center justify-between transition-all",
                          isConnected
                            ? "bg-card border-slate-200 dark:border-slate-800"
                            : "bg-slate-50/50 border-dashed dark:bg-slate-900/10"
                        )}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{c.name}</span>
                            <span className={cn(
                              "inline-block size-1.5 rounded-full",
                              isConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                            )} />
                          </div>
                          <p className="text-[0.65rem] text-slate-400">
                            Category: {c.category} • Records: {c.recordsProcessed.toLocaleString()}
                          </p>
                          <p className="text-[0.6rem] text-slate-400 font-mono">
                            Synced: {new Date(c.lastSynced).toLocaleTimeString()}
                          </p>
                        </div>
                        <Button
                          variant={isConnected ? "outline" : "default"}
                          size="sm"
                          className="h-8 text-xs font-semibold px-2.5"
                          onClick={() => handleToggleConnector(c.id)}
                        >
                          {isConnected ? (
                            <>
                              <Link2Off className="h-3 w-3 mr-1" />
                              Disconnect
                            </>
                          ) : (
                            <>
                              <Link2 className="h-3 w-3 mr-1" />
                              Connect
                            </>
                          )}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
              )}
            </Card>
          </div>

          {/* Screening Input / Pipeline Simulation */}
          <Card className="border-primary/20 bg-primary/[0.02] shadow-sm">
            <button
              type="button"
              onClick={() => setIsScreenerExpanded(!isScreenerExpanded)}
              className="flex w-full items-center justify-between border-b border-primary/10 px-5 py-3 text-left hover:bg-muted/20 transition-colors duration-100"
            >
              <div className="flex items-center gap-2">
                <Cpu className="h-3.5 w-3.5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Dynamic Proxy Screener</p>
                  <p className="text-[0.68rem] text-muted-foreground">Scan new cash-flow variables for Disparate Impact correlations</p>
                </div>
              </div>
              {isScreenerExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {isScreenerExpanded && (
              <div className="space-y-4 p-4">
              <form onSubmit={handleScreenVariable} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[0.65rem] font-bold text-muted-foreground">Variable Name</label>
                  <Input
                    placeholder="e.g. Utility_Bill_Late_Payments"
                    value={newVarName}
                    onChange={e => setNewVarName(e.target.value)}
                    className="h-8 text-xs"
                    disabled={isScreening}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[0.65rem] font-bold text-muted-foreground">Source</label>
                    <select
                      value={newVarSource}
                      onChange={e => setNewVarSource(e.target.value)}
                      className="w-full h-8 px-2 border rounded-md text-xs bg-background"
                      disabled={isScreening}
                    >
                      <option>Plaid</option>
                      <option>Finicity</option>
                      <option>RentTrack</option>
                      <option>Experian Boost</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[0.65rem] font-bold text-muted-foreground">IV (Predictive Power)</label>
                    <Input
                      type="number"
                      step="0.05"
                      min="0.1"
                      max="0.9"
                      value={newVarIV}
                      onChange={e => setNewVarIV(e.target.value)}
                      className="h-8 text-xs font-mono"
                      disabled={isScreening}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-[0.65rem] font-bold text-muted-foreground flex items-center gap-1">
                      Protected Class Correlation
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-slate-400" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-xs">
                            Correlation &gt; 0.45 triggers auto-quarantine due to disparate impact hazard.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </label>
                    <span className="font-mono text-xs font-bold text-primary">{newVarCorrelation}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={newVarCorrelation}
                    onChange={e => setNewVarCorrelation(e.target.value)}
                    className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                    disabled={isScreening}
                  />
                </div>

                {isScreening && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[0.65rem] font-bold text-primary">
                      <span>RUNNING ADVERSARIAL SCREENER...</span>
                      <span>{screeningProgress}%</span>
                    </div>
                    <Progress value={screeningProgress} className="h-1" />
                  </div>
                )}

                <Button type="submit" disabled={isScreening} className="w-full h-8 text-xs mt-2" data-testid="screen-variable-button">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Screen Variable
                </Button>
              </form>

              {recentScreened && (
                <div className={cn(
                  "p-3 rounded-lg border text-xs space-y-1",
                  recentScreened.status === "quarantined"
                    ? "bg-red-50 border-red-200 text-red-950 dark:bg-red-950/20 dark:text-red-300"
                    : "bg-emerald-50 border-emerald-200 text-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-300"
                )}>
                  <div className="flex items-center gap-1.5 font-bold">
                    {recentScreened.status === "quarantined" ? (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    )}
                    <span>Result: {recentScreened.status === "quarantined" ? "Quarantined" : "Approved"}</span>
                  </div>
                  <p className="font-mono text-[0.65rem] font-semibold">{recentScreened.name}</p>
                  <p className="text-[0.65rem] text-slate-500">
                    Proxy Risk: {recentScreened.proxyRiskScore}/100 • Correlation: {recentScreened.correlation}
                  </p>
                </div>
              )}
            </div>
            )}
          </Card>
        </div>

        {/* Row 2: Credit Invisible Scorer Demo & Variable Explorer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Variable Explorer Table */}
          <Card className="lg:col-span-2 border-border/60 shadow-sm">
            <button
              type="button"
              onClick={() => setIsLibraryExpanded(!isLibraryExpanded)}
              className="flex w-full items-center justify-between border-b border-border/40 px-5 py-3 text-left hover:bg-muted/20 transition-colors duration-100"
            >
              <div className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Extracted Cash-Flow Feature Library</p>
                  <p className="text-[0.68rem] text-muted-foreground">All alternative data variables and their statistical risk tags</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-[0.62rem]">HMDA/ECOA Pre-screened</Badge>
                {isLibraryExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </button>
            {isLibraryExpanded && (
              <div className="p-4">
                <div className="max-h-[280px] overflow-y-auto overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-2 text-left text-xs font-semibold text-slate-500">Feature Name</th>
                      <th className="pb-2 text-center text-xs font-semibold text-slate-500">Source</th>
                      <th className="pb-2 text-center text-xs font-semibold text-slate-500">Predictive Power (IV)</th>
                      <th className="pb-2 text-center text-xs font-semibold text-slate-500">Proxy Risk</th>
                      <th className="pb-2 text-center text-xs font-semibold text-slate-500">Correlation</th>
                      <th className="pb-2 text-center text-xs font-semibold text-slate-500">Status</th>
                      <th className="pb-2 text-center text-xs font-semibold text-slate-500">Regulatory Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.features.map(feat => {
                      return (
                        <tr key={feat.id} className="border-b last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                          <td className="py-2.5 text-xs font-semibold font-mono text-foreground">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger className="text-left font-mono">
                                  {feat.name}
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs text-xs">
                                  {feat.description}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </td>
                          <td className="py-2.5 text-center text-xs text-muted-foreground">{feat.source}</td>
                          <td className="py-2.5 text-center font-mono text-xs">
                            <span className={cn(
                              "font-semibold",
                              feat.informationValue >= 0.4 ? "text-primary" : "text-slate-500"
                            )}>
                              {feat.informationValue.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-2.5 text-center">
                            <span className={cn(
                              "rounded-full px-2 py-0.5 text-[0.6rem] font-bold border",
                              feat.proxyRiskScore >= 70
                                ? "bg-red-50 text-red-700 dark:bg-red-950/20 border-red-200"
                                : feat.proxyRiskScore >= 35
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 border-amber-200"
                                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 border-emerald-200"
                            )}>
                              {feat.proxyRiskScore}/100
                            </span>
                          </td>
                          <td className="py-2.5 text-center font-mono text-xs text-slate-500">{feat.correlation.toFixed(2)}</td>
                          <td className="py-2.5 text-center">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[0.6rem] font-bold uppercase",
                                feat.status === "quarantined"
                                  ? "border-red-300 bg-red-50 text-red-700 dark:bg-red-950/20"
                                  : "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20"
                              )}
                            >
                              {feat.status}
                            </Badge>
                          </td>
                          <td className="py-2.5 text-center">
                            {feat.status === "approved" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[0.65rem] font-bold text-destructive hover:bg-destructive/5 hover:text-destructive border-red-100"
                                onClick={() => handleToggleQuarantine(feat.id, "quarantined")}
                              >
                                Quarantine
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[0.65rem] font-bold text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 border-emerald-100"
                                onClick={() => handleToggleQuarantine(feat.id, "approved")}
                              >
                                Approve
                              </Button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            )}
          </Card>

          {/* Credit Invisible Scorer Panel */}
          <Card className="border-border/60 shadow-sm">
            <button
              type="button"
              onClick={() => setIsScorerExpanded(!isScorerExpanded)}
              className="flex w-full items-center justify-between border-b border-border/40 px-5 py-3 text-left hover:bg-muted/20 transition-colors duration-100"
            >
              <div className="flex items-center gap-2">
                <BadgePercent className="h-3.5 w-3.5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Credit Invisible Scorer</p>
                  <p className="text-[0.68rem] text-muted-foreground">Thin-file applicant scored using alt cash-flow features</p>
                </div>
              </div>
              {isScorerExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {isScorerExpanded && (
              <div className="space-y-4 p-4">
              <div className="p-3.5 rounded-lg border bg-slate-50 dark:bg-slate-900/50 space-y-1">
                <span className="text-[0.65rem] font-bold text-muted-foreground">Applicant Profile</span>
                <p className="text-sm font-extrabold text-foreground">{state.applicantDemo.name}</p>
                <Badge className="text-[0.55rem] font-mono font-bold bg-primary text-white border-primary">Thin File / No Tradeline</Badge>
              </div>

              {/* Before vs After Scores */}
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Traditional Bureaus</span>
                    <span className="text-destructive font-mono font-bold">INSUFFICIENT (REJECT)</span>
                  </div>
                  <Progress value={0} className="h-1.5 bg-red-100 dark:bg-red-950/20" />
                  <p className="text-[0.625rem] text-slate-400 italic leading-relaxed">
                    "{state.applicantDemo.reasonTraditional}"
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-emerald-600 flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Alt Data Meridian Score
                    </span>
                    <span className="text-emerald-700 font-mono font-bold">{state.applicantDemo.altScore} (APPROVE)</span>
                  </div>
                  <Progress value={((state.applicantDemo.altScore - 300) / 550) * 100} className="h-1.5" />
                  <p className="text-[0.625rem] text-slate-400 italic leading-relaxed">
                    "{state.applicantDemo.reasonAlt}"
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/50 space-y-1 text-[0.7rem] text-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-300">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Fair Lending Compliance Clean
                </p>
                <p className="leading-relaxed">
                  Alt-scoring models are dynamically screened. Marcus Robinson's cash-flow features do not act as proxies for protected groups, complying with ECOA Regulation B guidelines.
                </p>
              </div>
            </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  )
}
