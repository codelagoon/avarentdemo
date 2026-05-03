import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Search,
  CheckCircle,
  Download,
  Scale,
  TrendingUp,
  AlertTriangle,
  Award
} from "lucide-react"
import { rashomonService, type LessDiscriminatoryAlternative } from "@/services/rashomonService"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Mock current model for demonstration
const CURRENT_MODEL = {
  id: "FNB-FAIR-v4.2.1",
  name: "Fair Lending Model v4.2.1",
  accuracy: 0.9234,
  fairnessScore: 0.8912,
  featureCount: 82,
  calibration: 0.94,
  latencyMs: 145,
  complexity: "medium" as const,
  description: "Production fair lending model with 82 features",
  parameters: { regularization: 0.01, ensembleSize: 1 },
}

export function LDASearchDialog() {
  const [isSearching, setIsSearching] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<LessDiscriminatoryAlternative | null>(null)
  const [open, setOpen] = useState(false)

  const handleSearch = async () => {
    setIsSearching(true)
    setProgress(0)
    setResult(null)

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 10, 90))
    }, 200)

    // Perform search
    const searchResult = await rashomonService.searchForLDA(CURRENT_MODEL)
    
    clearInterval(interval)
    setProgress(100)
    setResult(searchResult)
    setIsSearching(false)

    if (searchResult.exists) {
      toast.success("Less Discriminatory Alternative found!")
    } else {
      toast.info("No LDA found - Refutation Certificate available")
    }
  }

  const downloadCertificate = () => {
    if (!result) return
    
    const cert = rashomonService.exportAnalysis(result)
    const blob = new Blob([cert], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `refutation-certificate-${new Date().toISOString().split("T")[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success("Refutation Certificate downloaded")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Search className="h-4 w-4" />
          Search for LDA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Less Discriminatory Alternative Search
          </DialogTitle>
          <DialogDescription>
            Search the Rashomon set for models within 0.5% performance slack that may be fairer than the current model.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Current Model Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Current Model</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Model</p>
                  <p className="font-semibold">{CURRENT_MODEL.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                  <p className="font-semibold">{(CURRENT_MODEL.accuracy * 100).toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fairness</p>
                  <p className="font-semibold">{(CURRENT_MODEL.fairnessScore * 100).toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Features</p>
                  <p className="font-semibold">{CURRENT_MODEL.featureCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Parameters */}
          <div className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium">Search Parameters</p>
              <p className="text-xs text-muted-foreground">
                Performance Slack: 0.5% • Models to Evaluate: 8 variations
              </p>
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="gap-2"
            >
              {isSearching ? (
                <>
                  <Search className="h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Start Search
                </>
              )}
            </Button>
          </div>

          {/* Progress */}
          {isSearching && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Searching Rashomon set...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Results */}
          {result && (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-4">
                {/* Status Banner */}
                <div className={cn(
                  "p-4 rounded-lg border flex items-start gap-3",
                  result.exists 
                    ? "bg-green-50 border-green-200" 
                    : "bg-blue-50 border-blue-200"
                )}>
                  {result.exists ? (
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <Award className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={cn(
                      "font-semibold",
                      result.exists ? "text-green-800" : "text-blue-800"
                    )}>
                      {result.exists 
                        ? "Less Discriminatory Alternative Found" 
                        : "No LDA Found - Refutation Certificate Available"
                      }
                    </p>
                    <p className={cn(
                      "text-sm mt-1",
                      result.exists ? "text-green-700" : "text-blue-700"
                    )}>
                      {result.recommendation}
                    </p>
                  </div>
                </div>

                {/* Comparison Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Current Model</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Accuracy</span>
                        <span className="font-medium">{(result.currentModel.accuracy * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Fairness</span>
                        <span className="font-medium">{(result.currentModel.fairnessScore * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Features</span>
                        <span className="font-medium">{result.currentModel.featureCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Latency</span>
                        <span className="font-medium">{result.currentModel.latencyMs}ms</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={cn(result.exists && "border-green-300 bg-green-50/30")}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        {result.exists ? "Alternative Model" : "Best Alternative"}
                        {result.exists && <Badge className="bg-green-600">RECOMMENDED</Badge>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Accuracy</span>
                        <span className={cn(
                          "font-medium",
                          result.accuracyGap < 0 ? "text-red-600" : "text-green-600"
                        )}>
                          {result.alternativeModel 
                            ? `${(result.alternativeModel.accuracy * 100).toFixed(2)}%`
                            : "N/A"
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Fairness</span>
                        <span className={cn(
                          "font-medium",
                          result.fairnessGain > 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {result.alternativeModel 
                            ? `${(result.alternativeModel.fairnessScore * 100).toFixed(2)}%`
                            : "N/A"
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Features</span>
                        <span className="font-medium">
                          {result.alternativeModel?.featureCount || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Latency</span>
                        <span className="font-medium">
                          {result.alternativeModel?.latencyMs || "N/A"}ms
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Delta Summary */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Impact Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-secondary/50 rounded-lg">
                        <TrendingUp className={cn(
                          "h-5 w-5 mx-auto mb-1",
                          result.slackWithin ? "text-green-500" : "text-red-500"
                        )} />
                        <p className="text-xs text-muted-foreground">Performance Slack</p>
                        <p className={cn(
                          "font-semibold",
                          result.slackWithin ? "text-green-600" : "text-red-600"
                        )}>
                          {result.slackWithin ? "Within 0.5%" : "Exceeds 0.5%"}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-secondary/50 rounded-lg">
                        <Scale className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                        <p className="text-xs text-muted-foreground">Accuracy Gap</p>
                        <p className="font-semibold">
                          {(result.accuracyGap * 100).toFixed(2)}%
                        </p>
                      </div>
                      <div className="text-center p-3 bg-secondary/50 rounded-lg">
                        <AlertTriangle className={cn(
                          "h-5 w-5 mx-auto mb-1",
                          result.fairnessGain > 0 ? "text-green-500" : "text-gray-400"
                        )} />
                        <p className="text-xs text-muted-foreground">Fairness Gain</p>
                        <p className={cn(
                          "font-semibold",
                          result.fairnessGain > 0 ? "text-green-600" : "text-gray-500"
                        )}>
                          {result.fairnessGain > 0 ? "+" : ""}
                          {(result.fairnessGain * 100).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Rashomon Set Info */}
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg text-sm">
                  <span className="text-muted-foreground">
                    Rashomon Set Size: {result.rashomonSetSize} models evaluated
                  </span>
                  <Badge variant="outline">
                    {result.slackWithin ? "Pareto-Optimal" : "Trade-off Required"}
                  </Badge>
                </div>

                {/* Certificate Download */}
                {!result.exists && (
                  <Button
                    onClick={downloadCertificate}
                    variant="default"
                    className="w-full gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Refutation Certificate
                  </Button>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
