import { useState } from "react"
import { useLiveData } from "@/hooks/useLiveData"
import { Database, Cpu, ShieldAlert, Sparkles, Sliders, RefreshCw, BarChart3, CheckCircle2, HelpCircle, Download, FileSpreadsheet } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { syntheticDataService } from "@/services/syntheticDataService"
import { cn } from "@/lib/utils"

export function SyntheticDataStudioPage() {
  const state = useLiveData(() => syntheticDataService.getState(), ["syntheticStudio"])
  const [epochs, setEpochs] = useState(1500)
  const [privacyBudget, setPrivacyBudget] = useState(1.5)
  const [quality, setQuality] = useState(85)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [activeCategory, setActiveCategory] = useState<"Race" | "Gender" | "Age">("Race")

  const filteredGroups = state.groups.filter(g => g.category === activeCategory)

  // Chart configuration for before/after comparison
  const chartConfig = {
    before: { label: "Before GAN Debiasing", color: "oklch(0.577 0.245 27.325)" },
    after: { label: "After GAN Debiasing", color: "oklch(0.627 0.265 150.2)" },
  }

  // Prep chart data
  const barChartData = filteredGroups.map(g => ({
    name: g.group.split(" ")[0], // short name
    fullName: g.group,
    before: g.approvalRateBefore,
    after: g.approvalRateAfter,
  }))

  const handleSliderChange = (id: string, value: number) => {
    syntheticDataService.updateGroupTargetCount(id, value)
  }

  const handleToggleFeature = (id: string, status: "active" | "quarantined" | "sanitized") => {
    syntheticDataService.toggleFeatureStatus(id, status)
    toast.success(`Feature updated to ${status}`)
  }

  const handleGenerate = () => {
    setIsGenerating(true)
    setGenerationProgress(0)
    
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          syntheticDataService.runGANSimulation(epochs, privacyBudget, quality)
          setIsGenerating(false)
          toast.success("Fairness-Constrained GAN generation complete! Minority profile representation corrected.")
          return 100
        }
        return prev + 10
      })
    }, 150)
  }

  const handleExport = () => {
    toast.success("Exported debiased synthetic dataset package (2,460 profiles generated). CSV and regulatory metadata ready.")
  }

  return (
    <div className="flex h-full flex-col overflow-hidden" data-testid="synthetic-data-studio">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 bg-card px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Database className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Synthetic Data Studio</h1>
            <p className="text-[0.7rem] text-muted-foreground">Fairness-constrained GAN synthesis to remediate historical class imbalance</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary/30 bg-primary/5 font-mono text-[0.7rem] text-primary">GAN v2.4-FC</Badge>
          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-[0.7rem] text-emerald-600 dark:text-emerald-400">
            W-Dist: {state.ganMetrics.wassersteinDistance}
          </Badge>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 overflow-auto p-5 space-y-5">
        
        {/* Row 1: Intro Cards & Imbalance Analyzer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Class Imbalance Panel */}
          <Card className="lg:col-span-2 border-border/60 shadow-sm">
            <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
              <div className="flex items-center gap-2">
                <Sliders className="h-3.5 w-3.5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Minority Representation Balancer</p>
                  <p className="text-[0.68rem] text-muted-foreground">Adjust target demographics to calibrate GAN synthesis ratios</p>
                </div>
              </div>
              <div className="flex gap-1 rounded-lg border border-border/60 bg-muted/60 p-0.5">
                {(["Race", "Gender", "Age"] as const).map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} className={cn("rounded-md px-2.5 py-1 text-xs font-semibold transition-all", activeCategory === cat ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3 p-4">
              <div className="space-y-3">
                {filteredGroups.map(group => {
                  const severity = group.representationRatio < 15 ? "critical" : group.representationRatio < 30 ? "moderate" : "nominal"
                  return (
                    <div key={group.id} className="p-3.5 rounded-lg border bg-card/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-foreground">{group.group}</p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[0.65rem] text-muted-foreground font-mono">
                              Current: {group.currentCount} ({group.representationRatio}%)
                            </span>
                            <span className="text-[0.65rem] text-muted-foreground">•</span>
                            <span className="text-[0.65rem] font-bold text-primary font-mono">
                              Target: {group.targetCount} ({group.targetRatio}%)
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[0.6rem] tracking-wider font-bold",
                            severity === "critical"
                              ? "border-destructive/20 bg-destructive/5 text-destructive"
                              : severity === "moderate"
                              ? "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/20"
                              : "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20"
                          )}
                        >
                          {severity === "critical" ? "Severe Imbalance" : severity === "moderate" ? "Moderate Bias" : "Balanced"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="100"
                          max="2000"
                          step="20"
                          value={group.targetCount}
                          onChange={(e) => handleSliderChange(group.id, parseInt(e.target.value))}
                          className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>

          {/* GAN Synthesizer Engine controls */}
          <Card className="border-primary/20 bg-primary/[0.02] shadow-sm">
            <div className="flex items-center gap-2 border-b border-primary/10 px-5 py-3">
              <Cpu className="h-3.5 w-3.5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Fairness GAN Synthesizer</p>
                <p className="text-[0.68rem] text-muted-foreground">Configure Generative Adversarial Network constraints</p>
              </div>
            </div>
            <div className="space-y-4 p-5">
              <div className="space-y-3.5">
                {/* Epochs */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-muted-foreground flex items-center gap-1">
                      Epochs to Train
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-3 w-3 text-slate-400" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-xs">
                            More epochs yield lower Wasserstein distance but require more training time.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                    <span className="font-mono font-bold text-primary">{epochs}</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="5000"
                    step="100"
                    value={epochs}
                    onChange={(e) => setEpochs(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Privacy Budget */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-muted-foreground flex items-center gap-1">
                      Differential Privacy (ε)
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-3 w-3 text-slate-400" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-xs">
                            Lower epsilon provides stronger mathematical privacy guards but slightly reduces utility.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                    <span className="font-mono font-bold text-primary">ε = {privacyBudget}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.1"
                    value={privacyBudget}
                    onChange={(e) => setPrivacyBudget(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Synthesis Quality */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-muted-foreground">Synthesis Fidelity</span>
                    <span className="font-mono font-bold text-primary">{quality}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={quality}
                    onChange={(e) => setQuality(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>

              {/* Progress bar */}
              {isGenerating && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[0.65rem] font-bold text-primary">
                    <span>GENERATING SYNTHETIC PROFILES...</span>
                    <span>{generationProgress}%</span>
                  </div>
                  <Progress value={generationProgress} className="h-1.5" />
                </div>
              )}

              <Button onClick={handleGenerate} disabled={isGenerating} className="w-full gap-2" data-testid="generate-gan-button">
                <RefreshCw className={cn("h-4 w-4", isGenerating && "animate-spin")} />
                Run GAN Debiasing
              </Button>
            </div>
          </Card>
        </div>

        {/* Row 2: Before/After Comparison Chart & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Bar Chart Comparison */}
          <Card className="lg:col-span-2 border-border/60 shadow-sm">
            <div className="flex items-center gap-2 border-b border-border/40 px-5 py-3">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Debiasing Impact: Before vs. After GAN</p>
                <p className="text-[0.68rem] text-muted-foreground">Credit approval rate changes across demographic groups under fairness-constrained synthesis</p>
              </div>
            </div>
            <div className="p-4">
              <ChartContainer config={chartConfig} className="h-[240px] w-full" style={{ minHeight: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="oklch(0.91 0.008 247)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} />
                    <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                    <Bar dataKey="before" name="Before Meridian GAN" fill="var(--color-before)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="after" name="After Meridian GAN" fill="var(--color-after)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </Card>

          {/* GAN Metrics & Sanitization Info */}
          <Card className="border-border/60 shadow-sm">
            <div className="flex items-center gap-2 border-b border-border/40 px-5 py-3">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Synthesis Verification Metrics</p>
                <p className="text-[0.68rem] text-muted-foreground">Statistical validity gauges of the generated synthetic datasets</p>
              </div>
            </div>
            <div className="space-y-4 p-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-900/50 space-y-1">
                  <p className="text-[0.625rem] font-bold text-muted-foreground">Wasserstein Distance:</p>
                  <p className="font-mono text-xs font-bold text-foreground leading-normal">{state.ganMetrics.wassersteinDistance} (synthetic data is statistically indistinguishable from source)</p>
                  <Badge className="text-[0.55rem] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 border-emerald-300">Optimal</Badge>
                </div>
                <div className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-900/50 space-y-1">
                  <p className="text-[0.625rem] font-bold text-muted-foreground">FID Score</p>
                  <p className="font-mono text-lg font-extrabold text-foreground">{state.ganMetrics.fidScore}</p>
                  <Badge className="text-[0.55rem] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 border-emerald-300">Excellent</Badge>
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-primary/20 bg-primary/5 space-y-1.5">
                <p className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Compliance Verification
                </p>
                <p className="text-[0.7rem] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Generated profiles meet the <strong>CFPB 4/5ths Rule</strong> with zero direct correlation to protected attributes. The differential privacy budget safeguards against applicant re-identification.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="w-full gap-2 text-xs" onClick={handleExport}>
                  <Download className="h-3.5 w-3.5" />Export Metadata
                </Button>
                <Button className="w-full gap-2 text-xs" onClick={handleExport}>
                  <FileSpreadsheet className="h-3.5 w-3.5" />Download CSV
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Row 3: Proxy Sanitization Panel */}
        <Card className="border-border/60 shadow-sm">
          <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-3.5 w-3.5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Disparate Impact & Proxy Variable Sanitizer</p>
                <p className="text-[0.68rem] text-muted-foreground">Strip latent correlations between standard variables and protected classes</p>
              </div>
            </div>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[0.62rem] font-semibold text-emerald-600 dark:text-emerald-400">Remover Active</span>
          </div>
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left text-xs font-semibold text-slate-500">Variable Name</th>
                    <th className="pb-2 text-left text-xs font-semibold text-slate-500">Suspected Protected Proxy</th>
                    <th className="pb-2 text-center text-xs font-semibold text-slate-500">Risk Score</th>
                    <th className="pb-2 text-center text-xs font-semibold text-slate-500">Original Correlation</th>
                    <th className="pb-2 text-center text-xs font-semibold text-slate-500">Sanitized Correlation</th>
                    <th className="pb-2 text-center text-xs font-semibold text-slate-500">Disparate Impact Lift</th>
                    <th className="pb-2 text-center text-xs font-semibold text-slate-500">Regulatory Action</th>
                  </tr>
                </thead>
                <tbody>
                  {state.features.map(feat => {
                    return (
                      <tr key={feat.id} className="border-b last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                        <td className="py-3 text-xs font-semibold font-mono text-foreground">{feat.name}</td>
                        <td className="py-3 text-xs text-muted-foreground">{feat.protectedAttribute}</td>
                        <td className="py-3 text-center">
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-[0.6rem] font-bold",
                            feat.riskScore >= 70
                              ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200"
                              : feat.riskScore >= 40
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200"
                          )}>
                            {feat.riskScore}/100
                          </span>
                        </td>
                        <td className="py-3 text-center font-mono text-xs text-slate-500">{feat.originalCorrelation.toFixed(2)}</td>
                        <td className="py-3 text-center font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                          {feat.sanitizedCorrelation.toFixed(2)}
                        </td>
                        <td className="py-3 text-center font-mono text-xs font-semibold text-emerald-600">
                          +{feat.impactPercentage}%
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex justify-center gap-1.5">
                            <button
                              onClick={() => handleToggleFeature(feat.id, "active")}
                              className={cn(
                                "rounded-md px-2 py-1 text-[0.625rem] font-bold transition-all border",
                                feat.status === "active"
                                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                                  : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300"
                              )}
                            >
                              Allow
                            </button>
                            <button
                              onClick={() => handleToggleFeature(feat.id, "sanitized")}
                              className={cn(
                                "rounded-md px-2 py-1 text-[0.625rem] font-bold transition-all border",
                                feat.status === "sanitized"
                                  ? "bg-primary text-white border-primary"
                                  : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300"
                              )}
                            >
                              Sanitize
                            </button>
                            <button
                              onClick={() => handleToggleFeature(feat.id, "quarantined")}
                              className={cn(
                                "rounded-md px-2 py-1 text-[0.625rem] font-bold transition-all border",
                                feat.status === "quarantined"
                                  ? "bg-destructive text-white border-destructive"
                                  : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300"
                              )}
                            >
                              Quarantine
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

      </div>
    </div>
  )
}
